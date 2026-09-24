const mongoose = require('mongoose');
const { getIsDbConnected } = require('../config/db');
const { DEFAULT_CHANNEL_RATES } = require('../config/constants');
const { UserModel, OtpLogModel, WebhookLogModel } = require('../models');

const STATUS_EVENTS = {
  SENT: 'otp.sent',
  DELIVERED: 'otp.delivered',
  READ: 'otp.read',
  FAILED: 'otp.failed',
  EXPIRED: 'otp.expired',
  PENDING: 'otp.pending'
};

const REQUEST_TIMEOUT_MS = 6000;
const RETRY_DELAYS_MS = [2000, 6000];

async function deliverWebhookWithRetry({ targetUrl, payload, event, userId, msgId, channel, maxAttempts = 3 }) {
  let attempt = 0;
  let success = false;
  let lastError = null;
  let lastHttpStatus = null;
  let lastStatusText = '';
  let durationMs = 0;

  while (attempt < maxAttempts && !success) {
    attempt++;
    const startT = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
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
      }
      lastError = `Receiver returned HTTP ${resp.status} (${resp.statusText || 'Error'})`;
    } catch (err) {
      durationMs = Date.now() - startT;
      lastHttpStatus = err.name === 'AbortError' ? 408 : 503;
      lastStatusText = err.name === 'AbortError' ? 'Request Timeout' : 'Connection Refused / Network Error';
      lastError = err.message || 'Network request failed';
    }

    if (!success && attempt < maxAttempts) {
      await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[attempt - 1] || 5000));
    }
  }

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
      console.warn('Error recording WebhookLog:', dbErr.message);
    }
  }

  if (!success) {
    console.warn(`[Webhook] Delivery to ${targetUrl} failed after ${attempt} attempt(s): ${lastError}`);
  }

  return { success, attempts: attempt, httpStatus: lastHttpStatus, latencyMs: durationMs, error: lastError };
}

/**
 * Builds the event payload sent to a customer's webhook URL.
 * `recipient` holds the phone number or email address; `phoneNumber` is kept for
 * backwards compatibility with earlier integrations.
 */
function buildWebhookPayload({ event, msgId, channel, recipient, status, errorCode, remark, cost }) {
  return {
    event,
    msgId,
    channel,
    recipient,
    phoneNumber: recipient,
    status,
    errorCode: errorCode || '0',
    remark: remark || '',
    cost,
    currency: 'USD',
    timestamp: new Date().toISOString()
  };
}

/**
 * Looks up the owning customer for a message and, if they configured a webhook URL,
 * posts a status event to it. Matching is by user ID or exact message ID only.
 */
async function forwardDlrToClientWebhook({ msgId, phoneNumber, channel, status, errorCode, cost, userId }) {
  try {
    if (!getIsDbConnected()) return;

    let matchedLog = null;
    if (msgId) {
      matchedLog = await OtpLogModel.findOne({ msgId }).sort({ createdAt: -1 }).lean();
    }

    const ownerId = (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId
      : (matchedLog?.userId && mongoose.Types.ObjectId.isValid(matchedLog.userId)) ? matchedLog.userId
      : null;
    if (!ownerId) return;

    const owner = await UserModel.findById(ownerId).lean();
    const targetUrl = owner?.webhookUrl ? owner.webhookUrl.trim() : '';
    if (!targetUrl) return;

    const normalizedChannel = String(channel || matchedLog?.channel || 'whatsapp').toLowerCase().replace(/[^a-z]/g, '') || 'whatsapp';
    const event = STATUS_EVENTS[status] || 'otp.status_update';
    const resolvedCost = cost
      || (matchedLog?.cost ? String(matchedLog.cost).replace('$', '').trim() : null)
      || (DEFAULT_CHANNEL_RATES[normalizedChannel] ?? DEFAULT_CHANNEL_RATES.whatsapp).toFixed(4);

    const payload = buildWebhookPayload({
      event,
      msgId: msgId || matchedLog?.msgId || ('msg_' + Math.random().toString(36).substring(2, 11)),
      channel: normalizedChannel,
      recipient: phoneNumber || matchedLog?.phoneNumber || '',
      status: status || 'DELIVERED',
      errorCode,
      remark: matchedLog?.remark || owner?.remark || '',
      cost: resolvedCost
    });

    deliverWebhookWithRetry({
      targetUrl,
      payload,
      event,
      userId: owner._id.toString(),
      msgId: payload.msgId,
      channel: normalizedChannel
    }).catch(err => console.warn('Unhandled webhook error:', err.message));
  } catch (err) {
    console.warn('Error in forwardDlrToClientWebhook:', err.message);
  }
}

module.exports = {
  forwardDlrToClientWebhook,
  deliverWebhookWithRetry,
  buildWebhookPayload,
  STATUS_EVENTS
};
