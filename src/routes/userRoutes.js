const express = require('express');
const router = express.Router();
const { getIsDbConnected } = require('../config/db');
const { EMAIL_SENDER_DOMAIN } = require('../config/constants');
const { UserModel, WebhookLogModel } = require('../models');
const { verifyJwtMiddleware, loadAuthenticatedUser } = require('../middleware/auth');
const { validateBody, PATTERNS } = require('../middleware/validate');
const { buildWebhookPayload } = require('../services/webhookService');
const { escapeRegex } = require('../utils/format');

function publicProfile(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name || user.email,
    phone: user.phone,
    role: user.role || 'USER',
    status: user.status || 'ACTIVE',
    balanceUsd: user.balanceUsd ?? 0,
    apiKeyLive: user.apiKeyLive || '',
    webhookUrl: user.webhookUrl || '',
    emailBrandHandle: user.emailBrandHandle || '',
    emailBrandName: user.emailBrandName || '',
    emailReplyTo: user.emailReplyTo || '',
    remark: user.remark || '',
    monthlyVolumeRemaining: user.monthlyVolumeRemaining || '100,000'
  };
}

// Signed-in user's live profile
router.get('/api/user/profile', verifyJwtMiddleware, async (req, res) => {
  try {
    const user = await loadAuthenticatedUser(req);
    if (user) {
      return res.json({ success: true, user: publicProfile(user) });
    }
    // Environment-only admin session (no database record)
    return res.json({
      success: true,
      user: {
        id: req.user.id || 'admin_root_01',
        email: req.user.email || req.user.username || 'admin',
        name: req.user.name || req.user.username || req.user.email || 'admin',
        role: req.user.role || 'USER',
        status: 'ACTIVE',
        balanceUsd: 0,
        apiKeyLive: '',
        webhookUrl: '',
        emailBrandHandle: '',
        emailBrandName: '',
        emailReplyTo: '',
        remark: '',
        monthlyVolumeRemaining: 'Unlimited'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function cleanBrandHandle(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(new RegExp('(@|\\.)' + escapeRegex(EMAIL_SENDER_DOMAIN) + '$', 'i'), '')
    .replace(/[^a-z0-9_-]/g, '');
}

// Update the branded email sender used for Email OTPs
router.post(
  '/api/user/email-sender',
  verifyJwtMiddleware,
  validateBody({
    brandName: { maxLength: 60 },
    brandHandle: { maxLength: 80 },
    replyTo: { pattern: PATTERNS.email, patternMessage: 'must be a valid email address', lowercase: true, maxLength: 200 }
  }),
  async (req, res) => {
    try {
      const { brandName = '', brandHandle = '', replyTo = '' } = req.body;
      const cleanHandle = cleanBrandHandle(brandHandle);

      if (cleanHandle && !/^[a-z0-9_-]{2,32}$/.test(cleanHandle)) {
        return res.status(400).json({
          success: false,
          error: 'Brand handle must be between 2 and 32 characters and contain only letters, numbers, hyphens, or underscores.'
        });
      }

      const reservedHandles = ['root', 'postmaster', 'abuse', 'security', 'mailer-daemon', 'noreply', 'no-reply', 'support', 'admin'];
      if (cleanHandle && reservedHandles.includes(cleanHandle) && req.user.role !== 'ADMIN') {
        return res.status(400).json({ success: false, error: `'${cleanHandle}' is a reserved handle. Please choose another one.` });
      }

      if (!getIsDbConnected()) {
        return res.status(503).json({ success: false, error: 'Settings are temporarily unavailable. Please try again shortly.' });
      }

      const user = await loadAuthenticatedUser(req);
      if (!user) {
        return res.status(404).json({ success: false, error: 'Account not found.' });
      }

      if (cleanHandle) {
        const taken = await UserModel.findOne({ emailBrandHandle: cleanHandle, _id: { $ne: user._id } }).lean();
        if (taken) {
          return res.status(409).json({ success: false, error: `The handle '${cleanHandle}' is already in use by another account.` });
        }
      }

      user.emailBrandHandle = cleanHandle;
      user.emailBrandName = brandName;
      user.emailReplyTo = replyTo;
      await user.save();

      const preview = `${brandName || 'OTP88'} <${cleanHandle || 'noreply'}@${EMAIL_SENDER_DOMAIN}>`;
      res.json({
        success: true,
        message: 'Email sender updated.',
        sender: { brandName, brandHandle: cleanHandle, replyTo, preview }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Update the customer's webhook URL
router.post(
  '/api/user/webhook',
  verifyJwtMiddleware,
  validateBody({
    webhookUrl: { maxLength: 500, pattern: PATTERNS.url, patternMessage: 'must start with http:// or https://' }
  }),
  async (req, res) => {
    try {
      const cleanUrl = req.body.webhookUrl || '';
      if (!getIsDbConnected()) {
        return res.status(503).json({ success: false, error: 'Settings are temporarily unavailable. Please try again shortly.' });
      }
      const user = await loadAuthenticatedUser(req);
      if (!user) return res.status(404).json({ success: false, error: 'Account not found.' });

      user.webhookUrl = cleanUrl;
      await user.save();
      res.json({ success: true, message: cleanUrl ? 'Webhook URL saved.' : 'Webhook URL removed.', webhookUrl: cleanUrl });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Recent webhook delivery attempts
router.get('/api/user/webhook/logs', verifyJwtMiddleware, async (req, res) => {
  try {
    if (!getIsDbConnected() || !req.user?.id) {
      return res.json({ success: true, logs: [] });
    }
    const query = req.user.role === 'ADMIN' && req.query.all === 'true' ? {} : { userId: req.user.id };
    const logs = await WebhookLogModel.find(query).sort({ createdAt: -1 }).limit(100).lean();
    res.json({
      success: true,
      logs: logs.map(l => ({
        id: l._id.toString(),
        msgId: l.msgId,
        event: l.event,
        channel: l.channel || 'whatsapp',
        targetUrl: l.targetUrl,
        httpStatus: l.httpStatus,
        statusText: l.statusText,
        attempts: l.attempts || 1,
        success: l.success,
        latencyMs: l.latencyMs || 0,
        error: l.error,
        payload: l.payload,
        createdAt: l.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, logs: [] });
  }
});

// Send a sample event to the customer's webhook URL
router.post(
  '/api/user/webhook/test',
  verifyJwtMiddleware,
  validateBody({
    webhookUrl: { maxLength: 500, pattern: PATTERNS.url, patternMessage: 'must start with http:// or https://' },
    channel: { enum: ['whatsapp', 'sms', 'email'] },
    event: { enum: ['otp.sent', 'otp.delivered', 'otp.read', 'otp.failed', 'otp.expired'] }
  }),
  async (req, res) => {
    try {
      const { channel = 'whatsapp', event = 'otp.delivered' } = req.body;
      let targetUrl = req.body.webhookUrl || '';
      if (!targetUrl) {
        const user = await loadAuthenticatedUser(req);
        targetUrl = user?.webhookUrl || '';
      }
      if (!targetUrl) {
        return res.status(400).json({ success: false, error: 'No webhook URL configured. Enter a URL first.' });
      }

      const statusByEvent = { 'otp.sent': 'SENT', 'otp.delivered': 'DELIVERED', 'otp.read': 'READ', 'otp.failed': 'FAILED', 'otp.expired': 'EXPIRED' };
      const costByChannel = { sms: '0.0210', whatsapp: '0.0075', email: '0.0020' };
      const testPayload = buildWebhookPayload({
        event,
        msgId: 'msg_test_' + Math.random().toString(36).substring(2, 11),
        channel,
        recipient: channel === 'email' ? 'user@example.com' : '+60123456789',
        status: statusByEvent[event] || 'DELIVERED',
        errorCode: event === 'otp.failed' ? '1' : '0',
        remark: 'Webhook test from OTP88 console',
        cost: costByChannel[channel] || '0.0075'
      });

      let pingSuccess = false;
      let statusCode = null;
      let durationMs = 0;
      let statusText = '';
      let lastError = null;
      const startT = Date.now();

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const resp = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'OTP88-Webhook-Delivery/1.0',
            'X-OTP88-Event': testPayload.event,
            'X-OTP88-Delivery-Attempt': '1'
          },
          body: JSON.stringify(testPayload),
          signal: controller.signal
        });
        clearTimeout(timer);
        durationMs = Date.now() - startT;
        statusCode = resp.status;
        statusText = resp.statusText || (resp.ok ? 'OK' : `HTTP ${resp.status}`);
        pingSuccess = resp.ok;
        if (!resp.ok) lastError = `HTTP ${resp.status} (${resp.statusText || 'Error'})`;
      } catch (netErr) {
        durationMs = Date.now() - startT;
        statusCode = netErr.name === 'AbortError' ? 408 : 503;
        statusText = netErr.name === 'AbortError' ? 'Timeout' : 'Connection Refused';
        lastError = netErr.message;
      }

      if (getIsDbConnected() && req.user?.id) {
        WebhookLogModel.create({
          userId: req.user.id,
          msgId: testPayload.msgId,
          event: testPayload.event,
          channel: testPayload.channel,
          targetUrl,
          httpStatus: statusCode,
          statusText,
          payload: testPayload,
          attempts: 1,
          success: pingSuccess,
          latencyMs: durationMs,
          error: pingSuccess ? undefined : lastError
        }).catch(logErr => console.warn('Error recording webhook test:', logErr.message));
      }

      if (!pingSuccess) {
        return res.json({
          success: false,
          error: `Could not reach ${targetUrl}: ${lastError}`,
          statusCode,
          payload: testPayload,
          targetUrl
        });
      }

      res.json({
        success: true,
        message: `Test webhook delivered (HTTP ${statusCode}) in ${durationMs}ms.`,
        statusCode,
        durationMs: `${durationMs}ms`,
        targetUrl,
        payload: testPayload
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
