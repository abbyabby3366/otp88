const express = require('express');
const router = express.Router();
const { getIsDbConnected } = require('../../config/db');
const { OtpLogModel, OtpAuditLogModel, EmailConfigModel } = require('../../models');
const { verifyJwtMiddleware, requireAdmin } = require('../../middleware/auth');
const { formatDateTime } = require('../../utils/format');
const { sendOtpEmail, getResendDomainStatus } = require('../../services/emailService');
const { RESEND_API_KEY, DEFAULT_EMAIL_FROM } = require('../../config/constants');

// --- 1. Get Email OTP Configuration, Domain Status & Recent Logs ---
router.get('/api/admin/email/config', verifyJwtMiddleware, requireAdmin, async (req, res) => {
  try {
    let dbConfig = null;
    let recentLogs = [];
    const isDbConnected = getIsDbConnected();

    if (isDbConnected) {
      try {
        dbConfig = await EmailConfigModel.findOne({ key: 'email_resend_primary' }).lean();

        const logs = await OtpLogModel.find({ channel: { $regex: /email/i } })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean();

        recentLogs = logs.map(l => ({
          id: l.msgId || ('EML-' + l._id.toString().slice(-8).toUpperCase()),
          recipient: l.phoneNumber, // For email channel, this stores email
          channel: 'Email',
          code: l.otpCode || '-',
          cost: l.cost || `$${dbConfig?.ratePerOtp || '0.0020'}`,
          status: l.status || 'SENT',
          latency: l.latency || '0.45s',
          message: l.messageText || '',
          timestamp: formatDateTime(l.createdAt),
          createdAt: l.createdAt
        }));
      } catch (e) {
        console.error('Error fetching Email config from MongoDB:', e.message);
      }
    }

    const effectiveApiKey = dbConfig?.apiKey || RESEND_API_KEY;
    const domainCheck = await getResendDomainStatus(effectiveApiKey);

    res.json({
      success: true,
      config: dbConfig || {
        key: 'email_resend_primary',
        apiKey: RESEND_API_KEY,
        fromEmail: DEFAULT_EMAIL_FROM,
        replyTo: '',
        subjectTemplate: 'Your OTP88 Verification Code: {{otpCode}}',
        ratePerOtp: '0.0020',
        currency: 'USD',
        status: 'ACTIVE',
        brandName: 'OTP88',
        supportEmail: 'support@otp88.top'
      },
      domainStatus: domainCheck.domain || null,
      logs: recentLogs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 2. Update Email OTP Configuration ---
router.post('/api/admin/email/config', verifyJwtMiddleware, requireAdmin, async (req, res) => {
  try {
    const { apiKey, fromEmail, replyTo, subjectTemplate, ratePerOtp, currency, status, brandName, supportEmail } = req.body;
    const updateData = {};
    if (apiKey !== undefined) updateData.apiKey = apiKey.trim();
    if (fromEmail !== undefined) updateData.fromEmail = fromEmail.trim();
    if (replyTo !== undefined) updateData.replyTo = replyTo.trim();
    if (subjectTemplate !== undefined) updateData.subjectTemplate = subjectTemplate.trim();
    if (ratePerOtp !== undefined) updateData.ratePerOtp = ratePerOtp.trim();
    if (currency !== undefined) updateData.currency = currency.trim();
    if (status !== undefined) updateData.status = status;
    if (brandName !== undefined) updateData.brandName = brandName.trim();
    if (supportEmail !== undefined) updateData.supportEmail = supportEmail.trim();

    let saved = updateData;
    if (getIsDbConnected()) {
      saved = await EmailConfigModel.findOneAndUpdate(
        { key: 'email_resend_primary' },
        { $set: updateData },
        { new: true, upsert: true }
      );
    }

    res.json({
      success: true,
      message: 'Email OTP (Resend) configuration successfully saved in database.',
      config: saved
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 3. Live Test Send Email OTP ---
router.post('/api/admin/email/test-send', verifyJwtMiddleware, requireAdmin, async (req, res) => {
  const { to, code, subject, brandName = 'OTP88', expiryMinutes = 5 } = req.body;
  if (!to || !to.includes('@')) {
    return res.status(400).json({ success: false, error: 'A valid recipient email address is required.' });
  }

  const otpCode = code && code.trim() ? code.trim() : Math.floor(100000 + Math.random() * 900000).toString();

  let dbConfig = null;
  if (getIsDbConnected()) {
    try {
      dbConfig = await EmailConfigModel.findOne({ key: 'email_resend_primary' }).lean();
    } catch (e) {}
  }

  const effectiveApiKey = dbConfig?.apiKey || RESEND_API_KEY;
  const effectiveFrom = dbConfig?.fromEmail || DEFAULT_EMAIL_FROM;
  const unitCost = `$${dbConfig?.ratePerOtp || '0.0020'}`;

  const dispatchResult = await sendOtpEmail({
    to,
    otpCode,
    subject: subject || `${brandName} Verification Code: ${otpCode}`,
    senderName: brandName,
    expiryMinutes,
    apiKey: effectiveApiKey,
    fromEmail: effectiveFrom,
    replyTo: dbConfig?.replyTo
  });

  const messageId = dispatchResult.messageId || ('EML_TEST_' + Math.floor(1000 + Math.random() * 9000));
  const statusStr = dispatchResult.success ? 'DELIVERED' : 'FAILED';

  if (getIsDbConnected()) {
    try {
      await OtpLogModel.create({
        phoneNumber: to.trim().toLowerCase(),
        channel: 'EMAIL',
        otpCode,
        messageText: `Your ${brandName} verification code is ${otpCode}. Valid for ${expiryMinutes} minutes.`,
        senderId: brandName,
        segments: 1,
        latency: dispatchResult.latency,
        cost: unitCost,
        status: statusStr,
        msgId: messageId,
        errorCode: dispatchResult.success ? '0' : 'ERR_EMAIL_DISPATCH',
        userId: req.user?.id || 'admin'
      });

      await OtpAuditLogModel.create({
        auditId: 'AUD_' + Math.floor(1000 + Math.random() * 9000),
        target: to.trim().toLowerCase(),
        channel: 'EMAIL',
        action: 'EMAIL_OTP_DISPATCH',
        actor: req.user?.email || req.user?.username || 'ADMIN',
        status: statusStr,
        latency: dispatchResult.latency,
        time: formatDateTime(),
        msgId: messageId
      });
    } catch (e) {
      console.error('Error saving Email OTP log to MongoDB:', e.message);
    }
  }

  if (!dispatchResult.success) {
    return res.status(400).json({
      success: false,
      error: dispatchResult.error,
      latency: dispatchResult.latency,
      fromUsed: dispatchResult.fromUsed,
      response: dispatchResult.response
    });
  }

  res.json({
    success: true,
    message: `Verification code successfully dispatched to ${to} via Resend.`,
    messageId,
    otpCode,
    latency: dispatchResult.latency,
    fromUsed: dispatchResult.fromUsed,
    response: dispatchResult.response
  });
});

// --- 4. Re-check / Trigger Domain Verification on Resend ---
router.post('/api/admin/email/verify-domain', verifyJwtMiddleware, requireAdmin, async (req, res) => {
  try {
    let dbConfig = null;
    if (getIsDbConnected()) {
      dbConfig = await EmailConfigModel.findOne({ key: 'email_resend_primary' }).lean();
    }
    const effectiveApiKey = dbConfig?.apiKey || RESEND_API_KEY;
    const domainId = '110c5fe9-6024-4406-81fb-d7fb1061ca27';

    // Trigger verification endpoint on Resend
    await fetch(`https://api.resend.com/domains/${domainId}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${effectiveApiKey}`
      }
    });

    // Query status immediately after trigger
    const statusRes = await getResendDomainStatus(effectiveApiKey, domainId);
    res.json({
      success: true,
      message: 'Triggered verification scan on Resend.',
      domain: statusRes.domain || null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
