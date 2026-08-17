const express = require('express');
const router = express.Router();
const { getIsDbConnected } = require('../config/db');
const { OtpLogModel, OtpAuditLogModel } = require('../models');
const { forwardDlrToClientWebhook } = require('../services/webhookService');

// Inbound Generic Webhook
router.all(['/api/webhooks/otp88', '/v1/webhooks'], (req, res) => {
  res.json({
    success: true,
    message: 'OTP88 Webhook active and operational.',
    endpoint: '/api/webhooks/otp88',
    timestamp: new Date().toISOString(),
    receivedPayload: req.body || {}
  });
});

// DLR Webhook Callback Handler for SMS 360 & Telco Delivery Notifications (DN)
router.all(['/api/webhooks/sms360/dlr', '/api/webhooks/dlr', '/api/webhooks/sms/dlr'], async (req, res) => {
  try {
    const payload = req.method === 'POST' ? req.body : req.query;
    console.log('📬 Received Bulk360 / Telco Delivery Notification (DN):', payload);

    if (!payload || Object.keys(payload).length === 0) {
      return res.status(200).send('ACK');
    }

    // Extract payload fields (handling multiple parameter formats from Telcos/Bulk360)
    const rawStatus = (payload.status || payload.stat || payload.dlr_status || payload.delivery_status || payload.Status || '').toString().toUpperCase();
    let normalizedStatus = 'DELIVERED';
    if (rawStatus.includes('UNDELIV') || rawStatus.includes('FAIL') || rawStatus.includes('REJECT') || rawStatus.includes('ERR')) {
      normalizedStatus = 'FAILED';
    } else if (rawStatus.includes('EXPIRE')) {
      normalizedStatus = 'EXPIRED';
    } else if (rawStatus.includes('ACCEPT') || rawStatus.includes('BUFF') || rawStatus.includes('QUEUE') || rawStatus.includes('PENDING') || rawStatus.includes('ENROUTE')) {
      normalizedStatus = 'PENDING';
    } else if (rawStatus.includes('DELIV') || rawStatus.includes('SUCCESS') || rawStatus === '0' || rawStatus === 'OK') {
      normalizedStatus = 'DELIVERED';
    }

    const rawMsgId = (payload.msgid || payload.msgId || payload.ref || payload.id || payload.messageId || '').toString().trim();
    const cleanPhone = (payload.msisdn || payload.to || payload.phone || payload.dest || payload.mobile || '').toString().replace(/[^0-9]/g, '');
    const errorCode = (payload['error-code'] !== undefined ? payload['error-code'] : (payload.errorCode || payload.error_code || payload.err || '0')).toString().trim();

    // Base msgId (strip telco suffix like -0 or .0602-0)
    const baseMsgId = rawMsgId.split('-').slice(0, 2).join('-') || rawMsgId.split('.')[0] || rawMsgId;

    let updatedCount = 0;
    const isDbConnected = getIsDbConnected();

    // Update MongoDB Atlas OtpLog & OtpAuditLog for all users and admins
    if (isDbConnected) {
      const matchOr = [];
      if (rawMsgId) {
        matchOr.push({ msgId: rawMsgId });
        if (baseMsgId && baseMsgId !== rawMsgId) {
          matchOr.push({ msgId: new RegExp('^' + baseMsgId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
        }
      }
      if (cleanPhone && cleanPhone.length >= 7) {
        const last8 = cleanPhone.slice(-8);
        matchOr.push({ phoneNumber: new RegExp(last8 + '$') });
      }

      if (matchOr.length > 0) {
        const updateResult = await OtpLogModel.updateMany(
          { $or: matchOr },
          { $set: { status: normalizedStatus, errorCode: errorCode } }
        );
        await OtpAuditLogModel.updateMany(
          { $or: matchOr.map(c => c.msgId ? { msgId: c.msgId } : { target: c.phoneNumber }) },
          { $set: { status: normalizedStatus } }
        );
        updatedCount += (updateResult.modifiedCount || 0);
      }
    }

    // Forward DLR event to client's configured webhook endpoint
    forwardDlrToClientWebhook({
      msgId: rawMsgId,
      phoneNumber: cleanPhone,
      channel: 'sms',
      status: normalizedStatus,
      errorCode
    });

    console.log(`✅ DN Processed: MsgID=${rawMsgId || 'N/A'}, Phone=${cleanPhone || 'N/A'}, Status=${normalizedStatus}, Updated=${updatedCount} record(s)`);

    // Standard Telco ACK response
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ success: true, status: normalizedStatus, msgId: rawMsgId, updatedCount });
    }
    return res.status(200).send('ACK');
  } catch (err) {
    console.error('Error processing Bulk360 DN webhook:', err.message);
    return res.status(200).send('ACK');
  }
});

// DLR Webhook Callback Handler for WhatsApp (VerifyWay & WhatsApp Routers)
router.all(['/api/webhooks/whatsapp/dlr', '/api/webhooks/whatsapp', '/v1/webhooks/whatsapp'], async (req, res) => {
  try {
    const payload = req.method === 'POST' ? req.body : req.query;
    console.log('📬 Received VerifyWay / WhatsApp Delivery Notification (DLR):', payload);

    if (!payload || Object.keys(payload).length === 0) {
      return res.status(200).send('ACK');
    }

    const rawStatus = (payload.status || payload.stat || payload.dlr_status || payload.delivery_status || payload.Status || '').toString().toUpperCase();
    let normalizedStatus = 'DELIVERED';
    if (rawStatus.includes('UNDELIV') || rawStatus.includes('FAIL') || rawStatus.includes('REJECT') || rawStatus.includes('ERR')) {
      normalizedStatus = 'FAILED';
    } else if (rawStatus.includes('EXPIRE')) {
      normalizedStatus = 'EXPIRED';
    } else if (rawStatus.includes('READ')) {
      normalizedStatus = 'READ';
    } else if (rawStatus.includes('ACCEPT') || rawStatus.includes('BUFF') || rawStatus.includes('QUEUE') || rawStatus.includes('PENDING') || rawStatus.includes('ENROUTE') || rawStatus.includes('SENT')) {
      normalizedStatus = 'PENDING';
    } else if (rawStatus.includes('DELIV') || rawStatus.includes('SUCCESS') || rawStatus === '0' || rawStatus === 'OK') {
      normalizedStatus = 'DELIVERED';
    }

    const rawMsgId = (payload.id || payload.msgid || payload.msgId || payload.ref || payload.messageId || '').toString().trim();
    const cleanPhone = (payload.recipient || payload.msisdn || payload.to || payload.phone || payload.dest || payload.mobile || '').toString().replace(/[^0-9]/g, '');
    const errorCode = (payload['error-code'] !== undefined ? payload['error-code'] : (payload.errorCode || payload.error_code || payload.err || '0')).toString().trim();

    const baseMsgId = rawMsgId.split('-').slice(0, 2).join('-') || rawMsgId.split('.')[0] || rawMsgId;

    let updatedCount = 0;
    const isDbConnected = getIsDbConnected();

    // Update MongoDB Atlas OtpLog & OtpAuditLog
    if (isDbConnected) {
      const matchOr = [];
      if (rawMsgId) {
        matchOr.push({ msgId: rawMsgId });
        if (baseMsgId && baseMsgId !== rawMsgId) {
          matchOr.push({ msgId: new RegExp('^' + baseMsgId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
        }
      }
      if (cleanPhone && cleanPhone.length >= 7) {
        const last8 = cleanPhone.slice(-8);
        matchOr.push({ phoneNumber: new RegExp(last8 + '$') });
      }

      if (matchOr.length > 0) {
        const updateResult = await OtpLogModel.updateMany(
          { $or: matchOr },
          { $set: { status: normalizedStatus, errorCode: errorCode } }
        );
        await OtpAuditLogModel.updateMany(
          { $or: matchOr.map(c => c.msgId ? { msgId: c.msgId } : { target: c.phoneNumber }) },
          { $set: { status: normalizedStatus } }
        );
        updatedCount += (updateResult.modifiedCount || 0);
      }
    }

    // Forward DLR event to client's configured webhook endpoint
    forwardDlrToClientWebhook({
      msgId: rawMsgId,
      phoneNumber: cleanPhone,
      channel: 'whatsapp',
      status: normalizedStatus,
      errorCode
    });

    console.log(`✅ WhatsApp DLR Processed: MsgID=${rawMsgId || 'N/A'}, Phone=${cleanPhone || 'N/A'}, Status=${normalizedStatus}, Updated=${updatedCount} record(s)`);

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ success: true, status: normalizedStatus, msgId: rawMsgId, updatedCount });
    }
    return res.status(200).send('ACK');
  } catch (err) {
    console.error('Error processing VerifyWay WhatsApp DLR webhook:', err.message);
    return res.status(200).send('ACK');
  }
});

module.exports = router;
