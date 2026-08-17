const mongoose = require('mongoose');
const { getIsDbConnected } = require('../config/db');
const { UserModel, OtpLogModel } = require('../models');

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

    const event = status === 'DELIVERED' ? 'otp.delivered' : (status === 'FAILED' ? 'otp.failed' : 'otp.status_update');
    const normalizedChannel = (channel || 'whatsapp').toLowerCase().replace('direct', '').replace('telco', '').trim();
    const payload = {
      event,
      msgId: msgId || ('msg_' + Math.random().toString(36).substring(2, 11)),
      channel: normalizedChannel,
      phoneNumber: phoneNumber || '+60123456789',
      status: status || 'DELIVERED',
      errorCode: errorCode || '0',
      remark: matchedLog?.remark || matchedUser?.remark || '',
      cost: cost || (normalizedChannel === 'sms' ? '0.0210' : (normalizedChannel === 'telegram' ? '0.0035' : '0.0075')),
      currency: 'USD',
      timestamp: new Date().toISOString()
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OTP88-Webhook-Delivery/1.0',
        'X-OTP88-Event': event
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    }).catch(e => {
      console.warn(`Could not forward webhook to client URL (${targetUrl}):`, e.message);
    }).finally(() => clearTimeout(timer));
  } catch (err) {
    console.warn('Error in forwardDlrToClientWebhook:', err.message);
  }
}

module.exports = {
  forwardDlrToClientWebhook
};
