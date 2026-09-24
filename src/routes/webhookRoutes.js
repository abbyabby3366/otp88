const express = require('express');
const router = express.Router();
const { getIsDbConnected } = require('../config/db');
const { DLR_WEBHOOK_SECRET } = require('../config/constants');
const { OtpLogModel, OtpAuditLogModel } = require('../models');
const { forwardDlrToClientWebhook } = require('../services/webhookService');

let warnedAboutMissingSecret = false;

/**
 * Optional protection for provider callbacks. When DLR_WEBHOOK_SECRET is set, providers
 * must include it as `?token=` or an `x-webhook-token` header. When it is not set, the
 * endpoints stay open exactly as before, so existing provider configurations keep working.
 */
function dlrAuth(req, res, next) {
  if (!DLR_WEBHOOK_SECRET) {
    if (!warnedAboutMissingSecret) {
      warnedAboutMissingSecret = true;
      console.warn('DLR_WEBHOOK_SECRET is not set; delivery reports are accepted without a token. Set it and add ?token=... at the provider to lock this down.');
    }
    return next();
  }
  const provided = req.query.token || req.headers['x-webhook-token'] || req.headers['x-otp88-token'] || '';
  if (String(provided) !== DLR_WEBHOOK_SECRET) {
    return res.status(401).send('Unauthorized');
  }
  next();
}

function normalizeDlrStatus(rawStatus, { allowRead }) {
  const s = String(rawStatus || '').toUpperCase();
  if (s.includes('UNDELIV') || s.includes('FAIL') || s.includes('REJECT') || s.includes('ERR')) return 'FAILED';
  if (s.includes('EXPIRE')) return 'EXPIRED';
  if (allowRead && s.includes('READ')) return 'READ';
  if (s.includes('ACCEPT') || s.includes('BUFF') || s.includes('QUEUE') || s.includes('PENDING') || s.includes('ENROUTE') || (allowRead && s.includes('SENT'))) return 'PENDING';
  return 'DELIVERED';
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds a delivery-report handler for one provider. Records are matched by the
 * provider's message ID only; matching by phone number could touch other customers' logs.
 */
function createDlrHandler({ providerLabel, channel, allowRead, idFields }) {
  return async (req, res) => {
    try {
      const payload = req.method === 'POST' ? req.body : req.query;
      if (!payload || Object.keys(payload).length === 0) {
        return res.status(200).send('ACK');
      }

      const rawStatus = payload.status || payload.stat || payload.dlr_status || payload.delivery_status || payload.Status;
      const normalizedStatus = normalizeDlrStatus(rawStatus, { allowRead });
      const rawMsgId = idFields.map(f => payload[f]).find(v => v !== undefined && v !== null && String(v).trim() !== '');
      const msgId = rawMsgId ? String(rawMsgId).trim() : '';
      const errorCode = String(
        payload['error-code'] !== undefined ? payload['error-code'] : (payload.errorCode || payload.error_code || payload.err || '0')
      ).trim();

      if (!msgId) {
        console.warn(`[${providerLabel} DLR] Ignored report without a message ID`, payload);
        return res.status(200).send('ACK');
      }

      // Providers may append suffixes such as "-0" or ".0602-0" to the original reference
      const baseMsgId = msgId.split('-').slice(0, 2).join('-') || msgId.split('.')[0] || msgId;
      const match = [{ msgId }];
      if (baseMsgId && baseMsgId !== msgId) match.push({ msgId: new RegExp('^' + escapeRegex(baseMsgId)) });

      let updatedCount = 0;
      let matchedLog = null;
      if (getIsDbConnected()) {
        matchedLog = await OtpLogModel.findOne({ $or: match }).lean();
        const result = await OtpLogModel.updateMany({ $or: match }, { $set: { status: normalizedStatus, errorCode } });
        await OtpAuditLogModel.updateMany({ $or: match }, { $set: { status: normalizedStatus } });
        updatedCount = result.modifiedCount || 0;
      }

      forwardDlrToClientWebhook({
        msgId,
        phoneNumber: matchedLog?.phoneNumber,
        channel,
        status: normalizedStatus,
        errorCode,
        userId: matchedLog?.userId
      });

      console.log(`[${providerLabel} DLR] msgId=${msgId} status=${normalizedStatus} updated=${updatedCount}`);

      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({ success: true, status: normalizedStatus, msgId, updatedCount });
      }
      return res.status(200).send('ACK');
    } catch (err) {
      console.error(`Error processing ${providerLabel} DLR webhook:`, err.message);
      return res.status(200).send('ACK');
    }
  };
}

// Bulk360 / telco delivery notifications
router.all(
  ['/api/webhooks/sms360/dlr', '/api/webhooks/dlr', '/api/webhooks/sms/dlr'],
  dlrAuth,
  createDlrHandler({
    providerLabel: 'Bulk360',
    channel: 'sms',
    allowRead: false,
    idFields: ['msgid', 'msgId', 'ref', 'id', 'messageId']
  })
);

// VerifyWay WhatsApp delivery notifications
router.all(
  ['/api/webhooks/whatsapp/dlr', '/api/webhooks/whatsapp', '/v1/webhooks/whatsapp'],
  dlrAuth,
  createDlrHandler({
    providerLabel: 'VerifyWay',
    channel: 'whatsapp',
    allowRead: true,
    idFields: ['id', 'message_id', 'msgid', 'msgId', 'ref', 'messageId']
  })
);

module.exports = router;
