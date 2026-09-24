const express = require('express');
const router = express.Router();
const { getIsDbConnected } = require('../../config/db');
const { OtpLogModel, OtpAuditLogModel, EmailConfigModel } = require('../../models');
const { verifyJwtMiddleware, requireAdmin } = require('../../middleware/auth');
const { validateBody, PATTERNS } = require('../../middleware/validate');
const { formatDateTime } = require('../../utils/format');
const { getResendDomainStatus, triggerResendDomainVerification } = require('../../services/emailService');
const { sendEmail, getEmailConfig } = require('../../services/dispatchers/emailDispatcher');
const { RESEND_DOMAIN_ID, DEFAULT_EMAIL_FROM } = require('../../config/constants');

const adminOnly = [verifyJwtMiddleware, requireAdmin];

function maskConfig(cfg) {
  if (!cfg) return {};
  const { apiKey, ...rest } = cfg;
  return { ...rest, apiKey: apiKey ? `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}` : '', hasApiKey: Boolean(apiKey) };
}

// Configuration, Resend domain status and recent email dispatches
router.get('/api/admin/email/config', ...adminOnly, async (req, res) => {
  try {
    const cfg = await getEmailConfig();
    let logs = [];

    if (getIsDbConnected()) {
      const dbLogs = await OtpLogModel.find({ channel: { $regex: /email/i } }).sort({ createdAt: -1 }).limit(20).lean();
      logs = dbLogs.map(l => ({
        id: l.msgId || ('EML-' + l._id.toString().slice(-8).toUpperCase()),
        recipient: l.phoneNumber,
        channel: 'Email',
        code: l.otpCode || '-',
        cost: l.cost || '',
        status: l.status || 'SENT',
        latency: l.latency || '',
        message: l.messageText || '',
        timestamp: formatDateTime(l.createdAt),
        createdAt: l.createdAt
      }));
    }

    const domainCheck = await getResendDomainStatus(cfg.apiKey, RESEND_DOMAIN_ID);

    res.json({
      success: true,
      config: maskConfig(cfg.raw || {
        key: 'email_resend_primary',
        apiKey: cfg.apiKey,
        fromEmail: DEFAULT_EMAIL_FROM,
        replyTo: '',
        subjectTemplate: 'Your {{brandName}} verification code: {{otpCode}}',
        ratePerOtp: '0.0020',
        currency: 'USD',
        status: 'ACTIVE',
        brandName: 'OTP88',
        supportEmail: ''
      }),
      configured: Boolean(cfg.apiKey),
      domainStatus: domainCheck.domain || null,
      domainError: domainCheck.success ? null : domainCheck.error,
      logs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(
  '/api/admin/email/config',
  ...adminOnly,
  validateBody({
    apiKey: { maxLength: 200 },
    fromEmail: { maxLength: 200 },
    replyTo: { pattern: PATTERNS.email, patternMessage: 'must be a valid email address', lowercase: true, maxLength: 200 },
    subjectTemplate: { maxLength: 200 },
    ratePerOtp: { maxLength: 20 },
    currency: { maxLength: 5 },
    status: { enum: ['ACTIVE', 'PAUSED'] },
    brandName: { maxLength: 60 },
    supportEmail: { pattern: PATTERNS.email, patternMessage: 'must be a valid email address', lowercase: true, maxLength: 200 }
  }),
  async (req, res) => {
    try {
      const allowed = ['apiKey', 'fromEmail', 'replyTo', 'subjectTemplate', 'ratePerOtp', 'currency', 'status', 'brandName', 'supportEmail'];
      const updateData = {};
      for (const key of allowed) {
        if (req.body[key] === undefined) continue;
        if (key === 'apiKey' && (req.body[key] === '' || req.body[key].includes('…'))) continue;
        updateData[key] = req.body[key];
      }
      if (!getIsDbConnected()) {
        return res.status(503).json({ success: false, error: 'Database unavailable; settings were not saved.' });
      }
      const saved = await EmailConfigModel.findOneAndUpdate(
        { key: 'email_resend_primary' },
        { $set: updateData },
        { new: true, upsert: true }
      ).lean();
      res.json({ success: true, message: 'Email (Resend) settings saved.', config: maskConfig(saved) });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Send a real test email through Resend (admin tooling; not billed to a customer)
router.post(
  '/api/admin/email/test-send',
  ...adminOnly,
  validateBody({
    to: { required: true, pattern: PATTERNS.email, patternMessage: 'must be a valid email address', lowercase: true, maxLength: 200 },
    code: { pattern: PATTERNS.otp, patternMessage: 'must be 4 to 8 digits' },
    subject: { maxLength: 200 },
    brandName: { maxLength: 60 },
    expiryMinutes: { type: 'number', min: 1, max: 60 }
  }),
  async (req, res) => {
    const { to, code, subject, brandName = 'OTP88', expiryMinutes = 5 } = req.body;
    const otpCode = code || Math.floor(100000 + Math.random() * 900000).toString();

    const result = await sendEmail({ to, otpCode, subject, brandName, expiryMinutes });
    const messageId = result.ref || ('EML_TEST_' + Math.floor(1000 + Math.random() * 9000));
    const status = result.success ? 'SENT' : 'FAILED';
    const latency = `${((result.latencyMs || 0) / 1000).toFixed(2)}s`;

    if (getIsDbConnected()) {
      try {
        await OtpLogModel.create({
          phoneNumber: to,
          channel: 'Email',
          otpCode,
          messageText: `Your ${brandName} verification code is ${otpCode}. Valid for ${expiryMinutes} minutes.`,
          senderId: result.fromUsed || brandName,
          segments: 1,
          latency,
          cost: '$0.0000',
          status,
          msgId: messageId,
          errorCode: result.success ? '0' : 'GATEWAY_ERROR',
          remark: 'Admin test send',
          userId: req.user.id
        });
        await OtpAuditLogModel.create({
          auditId: 'AUD_' + Math.floor(1000 + Math.random() * 9000),
          target: to,
          channel: 'EMAIL',
          action: 'EMAIL_OTP_TEST',
          actor: req.user.email || req.user.username || 'ADMIN',
          status,
          latency,
          time: formatDateTime(),
          msgId: messageId
        });
      } catch (e) {
        console.error('Error saving email test log:', e.message);
      }
    }

    if (!result.success) {
      return res.status(502).json({ success: false, error: result.error, latency, fromUsed: result.fromUsed, response: result.raw });
    }
    res.json({ success: true, message: `Test email accepted by Resend for ${to}.`, messageId, otpCode, latency, fromUsed: result.fromUsed, response: result.raw });
  }
);

// Ask Resend to re-check the sending domain's DNS records
router.post('/api/admin/email/verify-domain', ...adminOnly, async (req, res) => {
  try {
    const cfg = await getEmailConfig();
    const result = await triggerResendDomainVerification(cfg.apiKey, RESEND_DOMAIN_ID);
    if (!result.success) return res.status(502).json({ success: false, error: result.error });
    res.json({ success: true, message: 'Domain verification requested on Resend.', domain: result.domain || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
