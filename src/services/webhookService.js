const mongoose = require('mongoose');
const { getIsDbConnected } = require('../config/db');
const { UserModel, OtpLogModel, WebhookLogModel } = require('../models');

async function deliverWebhookWithRetry({ targetUrl, payload, event, userId, msgId, channel, maxAttempts = 3 }) {
  let attempt = 0;
  let success = false;
  let lastError = null;
  let lastHttpStatus = null;
  let lastStatusText = '';
  let durationMs = 0;

  const retryDelaysMs = [2000, 6000]; // Delays between retry 1->2 and 2->3

  while (attempt < maxAttempts && !success) {
    attempt++;
    const startT = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OTP88-Webhook-Delivery/1.0',
          'X-OTP88-Event': event,
          'X-OTP88-Delivery-Attempt': String(attempt)
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timer);
      durationMs = Date.now() - startT;
      lastHttpStatus = resp.status;
      lastStatusText = resp.statusText || (resp.ok ? 'OK' : `HTTP ${resp.status}`);

      if (resp.ok) {
        success = true;
        break;
      } else {
        lastError = `Receiver returned HTTP ${resp.status} (${resp.statusText || 'Error'})`;
      }
    } catch (err) {
      durationMs = Date.now() - startT;
      lastHttpStatus = err.name === 'AbortError' ? 408 : 503;
      lastStatusText = err.name === 'AbortError' ? 'Request Timeout' : 'Connection Refused / Network Error';
      lastError = err.message || 'Network request failed';
    }

    if (!success && attempt < maxAttempts) {
      const delay = retryDelaysMs[attempt - 1] || 5000;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  // Persist delivery outcome into WebhookLogModel in MongoDB Atlas
  if (getIsDbConnected() && userId) {
    try {
      await WebhookLogModel.create({
        userId,
        msgId,
        event,
        channel,
        targetUrl,
        httpStatus: lastHttpStatus,
        statusText: lastStatusText,
        payload,
        attempts: attempt,
        success,
        latencyMs: durationMs,
        error: success ? undefined : lastError
      });
    } catch (dbErr) {
      console.warn('Error recording WebhookLog to MongoDB:', dbErr.message);
    }
  }

  if (!success) {
    console.warn(`[Webhook Delivery Failed] ${targetUrl} after ${attempt} attempt(s): ${lastError}`);
  }

  return { success, attempts: attempt, httpStatus: lastHttpStatus, latencyMs: durationMs, error: lastError };
}

async function forwardDlrToClientWebhook({ msgId, phoneNumber, channel, status, errorCode, cost, userId }) {
  try {
    let targetUrl = '';
    let matchedUser = null;
    let matchedLog = null;
    const isDbConnected = getIsDbConnected();

    if (userId && isDbConnected && mongoose.Types.ObjectId.isValid(userId)) {
      matchedUser = await UserModel.findById(userId).lean();
      if (matchedUser && matchedUser.webhookUrl) {
        targetUrl = matchedUser.webhookUrl.trim();
      }
    }

    if (isDbConnected && (msgId || phoneNumber)) {
      const query = msgId ? { msgId } : { phoneNumber: new RegExp((phoneNumber || '').slice(-8) + '$') };
      matchedLog = await OtpLogModel.findOne(query).sort({ createdAt: -1 }).lean();
      if (!targetUrl && matchedLog && matchedLog.userId && mongoose.Types.ObjectId.isValid(matchedLog.userId)) {
        matchedUser = await UserModel.findById(matchedLog.userId).lean();
        if (matchedUser && matchedUser.webhookUrl) targetUrl = matchedUser.webhookUrl.trim();
      }
    }

    if (!targetUrl) return;

    const event = status === 'DELIVERED' ? 'otp.delivered' : (status === 'FAILED' ? 'otp.failed' : (status === 'READ' ? 'otp.read' : 'otp.status_update'));
    const normalizedChannel = (channel || 'whatsapp').toLowerCase().replace('direct', '').replace('telco', '').trim();
    const payload = {
      event,
      msgId: msgId || ('msg_' + Math.random().toString(36).substring(2, 11)),
      channel: normalizedChannel,
      phoneNumber: phoneNumber || '+60123456789',
      status: status || 'DELIVERED',
      errorCode: errorCode || '0',
      remark: matchedLog?.remark || matchedUser?.remark || '',
      cost: cost || (matchedLog?.cost ? matchedLog.cost.replace('$', '').trim() : (normalizedChannel === 'sms' ? '0.0210' : (normalizedChannel === 'telegram' ? '0.0035' : '0.0500'))),
      currency: 'USD',
      timestamp: new Date().toISOString()
    };

    const targetUserId = matchedUser ? matchedUser._id.toString() : (userId || matchedLog?.userId || null);

    // Asynchronously trigger webhook dispatch with retry in background
    deliverWebhookWithRetry({
      targetUrl,
      payload,
      event,
      userId: targetUserId,
      msgId: payload.msgId,
      channel: normalizedChannel
    }).catch(err => {
      console.warn('Unhandled webhook error:', err.message);
    });

  } catch (err) {
    console.warn('Error in forwardDlrToClientWebhook:', err.message);
  }
}

module.exports = {
  forwardDlrToClientWebhook,
  deliverWebhookWithRetry
};
