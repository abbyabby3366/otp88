const express = require('express');
const router = express.Router();
const { getIsDbConnected } = require('../../config/db');
const { OtpLogModel, OtpAuditLogModel, WhatsAppConfigModel } = require('../../models');
const { verifyJwtMiddleware, requireAdmin } = require('../../middleware/auth');
const { validateBody, PATTERNS } = require('../../middleware/validate');
const { formatDateTime, normalizePhoneNumber } = require('../../utils/format');
const { sendWhatsApp, getWhatsAppConfig } = require('../../services/dispatchers/whatsappDispatcher');

const adminOnly = [verifyJwtMiddleware, requireAdmin];

function maskConfig(cfg) {
  if (!cfg) return {};
  return { ...cfg, hasApiKey: Boolean(cfg.apiKey) };
}

router.get('/api/admin/whatsapp/config', ...adminOnly, async (req, res) => {
  try {
    const cfg = await getWhatsAppConfig();
    let logs = [];
    if (getIsDbConnected()) {
      const dbLogs = await OtpLogModel.find({ channel: { $regex: /whatsapp/i } }).sort({ createdAt: -1 }).limit(20).lean();
      logs = dbLogs.map(l => ({
        id: l.msgId || ('WA-' + l._id.toString().slice(-8).toUpperCase()),
        recipient: normalizePhoneNumber(l.phoneNumber),
        channel: 'whatsapp',
        code: l.otpCode || '-',
        cost: l.cost || '',
        status: l.status || 'SENT',
        latency: l.latency || '-',
        timestamp: formatDateTime(l.createdAt),
        createdAt: l.createdAt
      }));
    }
    res.json({
      success: true,
      config: maskConfig(cfg.raw || { apiKey: cfg.apiKey, apiUrl: cfg.apiUrl, lang: cfg.lang, fallback: cfg.fallback, status: cfg.status }),
      configured: Boolean(cfg.apiKey),
      logs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(
  '/api/admin/whatsapp/config',
  ...adminOnly,
  validateBody({
    apiKey: { maxLength: 200 },
    apiUrl: { pattern: PATTERNS.url, patternMessage: 'must be a valid URL', maxLength: 500 },
    channel: { maxLength: 20 },
    fallback: { enum: ['yes', 'no'] },
    lang: { maxLength: 5 },
    webhookUrl: { maxLength: 500 },
    ratePerOtp: { maxLength: 20 },
    currency: { maxLength: 5 },
    status: { enum: ['ACTIVE', 'PAUSED'] }
  }),
  async (req, res) => {
    try {
      const allowed = ['apiKey', 'apiUrl', 'channel', 'fallback', 'lang', 'webhookUrl', 'ratePerOtp', 'currency', 'status'];
      const updateData = {};
      for (const key of allowed) {
        if (req.body[key] === undefined) continue;
        // Masked or empty key from the console means "keep the existing one"
        if (key === 'apiKey' && (req.body[key] === '' || req.body[key].includes('…'))) continue;
        updateData[key] = req.body[key];
      }
      if (!getIsDbConnected()) {
        return res.status(503).json({ success: false, error: 'Database unavailable; settings were not saved.' });
      }
      const saved = await WhatsAppConfigModel.findOneAndUpdate(
        { key: 'whatsapp_verifyway_primary' },
        { $set: updateData },
        { new: true, upsert: true }
      ).lean();
      res.json({ success: true, message: 'WhatsApp (VerifyWay) settings saved.', config: maskConfig(saved) });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Send a real test OTP through VerifyWay (admin tooling; not billed to a customer)
router.post(
  '/api/admin/whatsapp/test-send',
  ...adminOnly,
  validateBody({
    recipient: { required: true, pattern: PATTERNS.phone, patternMessage: 'must be a valid phone number' },
    code: { required: true, pattern: PATTERNS.otp, patternMessage: 'must be 4 to 8 digits' },
    lang: { maxLength: 5 },
    fallback: { enum: ['yes', 'no'] },
    apiKey: { maxLength: 200 }
  }),
  async (req, res) => {
    const { recipient, code, lang, fallback, apiKey } = req.body;
    const normalizedRecipient = normalizePhoneNumber(recipient);
    const cleanApiKey = apiKey && !apiKey.includes('…') ? apiKey : undefined;

    const result = await sendWhatsApp({ to: normalizedRecipient, otpCode: code, lang, fallback, apiKey: cleanApiKey });
    const messageId = result.ref || ('WA_TEST_' + Math.floor(1000 + Math.random() * 9000));
    const status = result.success ? 'SENT' : 'FAILED';
    const latency = `${((result.latencyMs || 0) / 1000).toFixed(2)}s`;

    if (getIsDbConnected()) {
      try {
        await OtpLogModel.create({
          phoneNumber: normalizedRecipient,
          channel: 'WhatsApp',
          otpCode: code,
          messageText: `Your verification code is ${code}.`,
          senderId: 'WhatsApp',
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
          target: normalizedRecipient,
          channel: 'WHATSAPP',
          action: 'WHATSAPP_OTP_TEST',
          actor: req.user.email || req.user.username || 'ADMIN',
          status,
          latency,
          time: formatDateTime(),
          msgId: messageId
        });
      } catch (e) {
        console.error('Error saving WhatsApp test log:', e.message);
      }
    }

    if (!result.success) {
      return res.status(502).json({ success: false, error: result.error, messageId, response: result.raw });
    }
    res.json({ success: true, message: 'Test OTP accepted by VerifyWay.', messageId, latency, response: result.raw });
  }
);

module.exports = router;
