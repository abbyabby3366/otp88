const express = require('express');
const router = express.Router();
const { getIsDbConnected } = require('../../config/db');
const { OtpLogModel, OtpAuditLogModel, Sms360ConfigModel } = require('../../models');
const { verifyJwtMiddleware, requireAdmin } = require('../../middleware/auth');
const { validateBody, PATTERNS } = require('../../middleware/validate');
const { formatDateTime, detectPublicIp, normalizePhoneNumber } = require('../../utils/format');
const { sendSms, getSmsConfig } = require('../../services/dispatchers/smsDispatcher');

const adminOnly = [verifyJwtMiddleware, requireAdmin];

function clientIpOf(req) {
  const raw = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '';
  return String(raw).split(',')[0].trim().replace(/^::ffff:/, '');
}

function maskConfig(cfg) {
  if (!cfg) return {};
  return { ...cfg, hasAppSecret: Boolean(cfg.appSecret) };
}

router.get('/api/admin/sms360/my-ip', ...adminOnly, async (req, res) => {
  try {
    const serverIp = await detectPublicIp();
    const clientIp = clientIpOf(req);
    res.json({ success: true, serverIp, clientIp: clientIp || serverIp, detectedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/api/admin/sms360/stats', ...adminOnly, async (req, res) => {
  try {
    const serverIp = await detectPublicIp();
    const clientIp = clientIpOf(req);
    const cfg = await getSmsConfig();
    let logs = [];

    if (getIsDbConnected()) {
      const dbLogs = await OtpLogModel.find({ channel: { $regex: /sms/i } }).sort({ createdAt: -1 }).limit(20).lean();
      logs = dbLogs.map(l => ({
        id: l.msgId || ('SMS-' + l._id.toString().slice(-8).toUpperCase()),
        recipient: normalizePhoneNumber(l.phoneNumber),
        message: l.messageText || '',
        senderId: l.senderId || cfg.senderId,
        telco: 'Bulk360',
        segments: l.segments || 1,
        cost: l.cost || '',
        status: l.status || 'SENT',
        errorCode: l.errorCode || '0',
        latency: l.latency || '',
        timestamp: formatDateTime(l.createdAt),
        createdAt: l.createdAt
      }));
    }

    res.json({
      success: true,
      config: maskConfig(cfg.raw || { appKey: cfg.appKey, appSecret: cfg.appSecret, senderId: cfg.senderId, apiUrl: cfg.sendUrl, balanceUrl: cfg.balanceUrl, status: cfg.status }),
      configured: Boolean(cfg.appKey && cfg.appSecret),
      serverIp,
      clientIp: clientIp || serverIp,
      logs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(
  '/api/admin/sms360/config',
  ...adminOnly,
  validateBody({
    appKey: { maxLength: 200 },
    appSecret: { maxLength: 200 },
    apiKey: { maxLength: 200 },
    apiUrl: { pattern: PATTERNS.url, patternMessage: 'must be a valid URL', maxLength: 500 },
    balanceUrl: { pattern: PATTERNS.url, patternMessage: 'must be a valid URL', maxLength: 500 },
    senderId: { maxLength: 20 },
    webhookUrl: { maxLength: 500 },
    ratePerSms: { maxLength: 20 },
    currency: { maxLength: 5 },
    status: { enum: ['ACTIVE', 'PAUSED'] },
    autoFallback: { type: 'boolean' }
  }),
  async (req, res) => {
    try {
      const allowed = ['appKey', 'appSecret', 'apiKey', 'apiUrl', 'balanceUrl', 'senderId', 'webhookUrl', 'ratePerSms', 'currency', 'status', 'autoFallback'];
      const updateData = {};
      for (const key of allowed) {
        if (req.body[key] === undefined) continue;
        // An empty secret from the console means "keep the existing one"
        if (key === 'appSecret' && req.body[key] === '') continue;
        updateData[key] = req.body[key];
      }

      if (!getIsDbConnected()) {
        return res.status(503).json({ success: false, error: 'Database unavailable; settings were not saved.' });
      }
      const saved = await Sms360ConfigModel.findOneAndUpdate(
        { key: 'sms360_primary' },
        { $set: updateData },
        { new: true, upsert: true }
      ).lean();
      res.json({ success: true, message: 'Bulk360 gateway settings saved.', config: maskConfig(saved) });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Live credit balance on Bulk360
router.post('/api/admin/sms360/live-balance', ...adminOnly, async (req, res) => {
  try {
    const cfg = await getSmsConfig();
    const user = req.body.appKey || cfg.appKey;
    const pass = req.body.appSecret || cfg.appSecret;
    const country = String(req.body.country || 'MYS').slice(0, 5);

    if (!user || !pass) {
      return res.status(400).json({ success: false, isLiveConnected: false, error: 'Bulk360 App Key and App Secret are required.' });
    }

    const params = new URLSearchParams({ user, pass, country });
    const targetUrl = `${cfg.balanceUrl}?${params.toString()}`;

    let apiResponse = null;
    let rawText = '';
    let httpStatus = 0;
    let isLiveConnected = false;
    let errorType = null;
    let errorMessage = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const gwRes = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeout);
      httpStatus = gwRes.status;
      rawText = await gwRes.text();
      try { apiResponse = JSON.parse(rawText); } catch (pe) { apiResponse = { raw: rawText }; }

      if (gwRes.ok && (apiResponse?.status === 'success' || apiResponse?.description || typeof apiResponse?.credits !== 'undefined')) {
        isLiveConnected = true;
      } else {
        const lowerRaw = rawText.toLowerCase();
        const lowerMsg = String(apiResponse?.message || apiResponse?.notice || '').toLowerCase();
        if (httpStatus === 401 || lowerRaw.includes('ip') || lowerMsg.includes('whitelist')) {
          errorType = 'ip_not_whitelisted';
          errorMessage = 'IP address not whitelisted on Bulk360';
        } else if (lowerRaw.includes('auth') || lowerRaw.includes('user') || lowerRaw.includes('pass') || lowerRaw.includes('invalid')) {
          errorType = 'invalid_credentials';
          errorMessage = 'Invalid Bulk360 credentials';
        } else {
          errorType = 'api_error';
          errorMessage = apiResponse?.message || rawText || `Bulk360 returned HTTP ${httpStatus}`;
        }
      }
    } catch (netErr) {
      errorType = netErr.name === 'AbortError' ? 'timeout' : 'network_error';
      errorMessage = netErr.message || 'Connection to Bulk360 timed out or failed';
    }

    res.json({
      success: isLiveConnected,
      isLiveConnected,
      httpStatus,
      endpoint: targetUrl.replace(encodeURIComponent(pass), '***'),
      country,
      data: apiResponse,
      rawText,
      errorType,
      errorMessage
    });
  } catch (e) {
    res.status(500).json({ success: false, isLiveConnected: false, error: e.message });
  }
});

// Send a real test SMS through Bulk360 (admin tooling; not billed to a customer)
router.post(
  '/api/admin/sms360/test-send',
  ...adminOnly,
  validateBody({
    phoneNumber: { required: true, pattern: PATTERNS.phone, patternMessage: 'must be a valid phone number' },
    message: { required: true, minLength: 1, maxLength: 640 },
    senderId: { maxLength: 20 },
    appKey: { maxLength: 200 },
    appSecret: { maxLength: 200 }
  }),
  async (req, res) => {
    const { phoneNumber: rawPhone, senderId, message, appKey, appSecret } = req.body;
    const normalizedPhone = normalizePhoneNumber(rawPhone);
    const cfg = await getSmsConfig();

    const result = await sendSms({ to: normalizedPhone, messageText: message, senderId, appKey, appSecret });
    const messageId = result.ref || ('SMS_TEST_' + Math.floor(1000 + Math.random() * 9000));
    const status = result.success ? 'SENT' : 'FAILED';
    const latency = `${((result.latencyMs || 0) / 1000).toFixed(2)}s`;
    const segments = Math.ceil(message.length / 160) || 1;

    if (getIsDbConnected()) {
      try {
        await OtpLogModel.create({
          phoneNumber: normalizedPhone,
          channel: 'SMS',
          otpCode: (message.match(/\b\d{4,8}\b/) || [''])[0],
          messageText: message,
          senderId: senderId || cfg.senderId,
          segments,
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
          target: normalizedPhone,
          channel: 'SMS',
          action: 'SMS_GATEWAY_TEST',
          actor: req.user.email || req.user.username || 'ADMIN',
          status,
          latency,
          time: formatDateTime(),
          msgId: messageId
        });
      } catch (e) {
        console.error('Error saving SMS test log:', e.message);
      }
    }

    if (!result.success) {
      return res.status(502).json({ success: false, error: result.error, messageId, response: result.raw });
    }
    res.json({ success: true, message: 'Test SMS accepted by Bulk360.', messageId, latency, response: result.raw });
  }
);

module.exports = router;
