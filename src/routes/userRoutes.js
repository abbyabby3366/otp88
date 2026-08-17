const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ADMIN_USERNAME } = require('../config/constants');
const { getIsDbConnected } = require('../config/db');
const { UserModel, WebhookLogModel } = require('../models');
const { verifyJwtMiddleware } = require('../middleware/auth');

// Authenticated User Live Profile
router.get('/api/user/profile', verifyJwtMiddleware, async (req, res) => {
  try {
    let user = null;
    const isDbConnected = getIsDbConnected();
    if (isDbConnected) {
      if (req.user.id && req.user.id !== 'admin_root_01' && mongoose.Types.ObjectId.isValid(req.user.id)) {
        user = await UserModel.findById(req.user.id).lean();
      }
      if (!user && (req.user.role === 'ADMIN' || req.user.email === 'admin' || req.user.username === 'admin')) {
        user = await UserModel.findOne({
          $or: [{ email: 'admin' }, { email: ADMIN_USERNAME.toLowerCase() }, { name: 'admin' }, { name: ADMIN_USERNAME }]
        }).lean();
      }
      if (!user && req.user.email) {
        user = await UserModel.findOne({ email: req.user.email }).lean();
      }
      if (!user && req.user.phone) {
        user = await UserModel.findOne({ phone: req.user.phone }).lean();
      }
    }

    if (user) {
      return res.json({
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name || user.email,
          phone: user.phone,
          role: user.role || 'USER',
          balanceUsd: user.balanceUsd !== undefined ? user.balanceUsd : 50.00,
          apiKeyLive: user.apiKeyLive || ('otp88_api_' + Math.random().toString(36).substring(2, 16) + '88'),
          webhookUrl: user.webhookUrl || '',
          remark: user.remark || '',
          monthlyVolumeRemaining: user.monthlyVolumeRemaining || '100,000'
        }
      });
    }

    return res.json({
      success: true,
      user: {
        id: req.user.id || 'usr_fallback',
        email: req.user.email || req.user.username || 'admin',
        name: req.user.name || req.user.username || req.user.email || 'admin',
        role: req.user.role || 'USER',
        balanceUsd: 50.00,
        apiKeyLive: req.user.role === 'ADMIN' ? 'otp88_api_88a90184bcedf88' : 'otp88_api_88a90184bcedf41',
        webhookUrl: '',
        remark: ''
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Authenticated User Webhook Endpoint
router.post('/api/user/webhook', verifyJwtMiddleware, async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    const cleanUrl = (webhookUrl || '').trim();
    if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return res.status(400).json({ success: false, error: 'Webhook URL must start with http:// or https://' });
    }

    const isDbConnected = getIsDbConnected();
    if (isDbConnected && req.user && req.user.id) {
      if (mongoose.Types.ObjectId.isValid(req.user.id)) {
        await UserModel.findByIdAndUpdate(req.user.id, { $set: { webhookUrl: cleanUrl } });
      } else if (req.user.role === 'ADMIN') {
        await UserModel.findOneAndUpdate(
          { $or: [{ email: 'admin' }, { email: ADMIN_USERNAME.toLowerCase() }, { name: 'admin' }, { name: ADMIN_USERNAME }] },
          { $set: { webhookUrl: cleanUrl } }
        );
      }
    }

    res.json({
      success: true,
      message: 'Webhook URL updated successfully!',
      webhookUrl: cleanUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get User's Recent Webhook Delivery Logs
router.get('/api/user/webhook/logs', verifyJwtMiddleware, async (req, res) => {
  try {
    const isDbConnected = getIsDbConnected();
    if (!isDbConnected || !req.user?.id) {
      return res.json({ success: true, logs: [] });
    }

    const query = req.user.role === 'ADMIN' && req.query.all === 'true'
      ? {}
      : { userId: req.user.id };

    const logs = await WebhookLogModel.find(query).sort({ createdAt: -1 }).limit(20).lean();
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

// Send Test Ping to User Webhook URL
router.post('/api/user/webhook/test', verifyJwtMiddleware, async (req, res) => {
  try {
    const { webhookUrl, channel = 'whatsapp', event = 'otp.delivered' } = req.body;
    let targetUrl = (webhookUrl || '').trim();
    const isDbConnected = getIsDbConnected();
    if (!targetUrl && req.user && req.user.id && isDbConnected) {
      if (mongoose.Types.ObjectId.isValid(req.user.id)) {
        const user = await UserModel.findById(req.user.id).lean();
        targetUrl = user?.webhookUrl || '';
      }
    }

    if (!targetUrl) {
      return res.status(400).json({ success: false, error: 'No Webhook URL configured. Please enter a valid URL first.' });
    }

    const testPayload = {
      event: event || 'otp.delivered',
      msgId: 'msg_test_' + Math.random().toString(36).substring(2, 11),
      channel: channel || 'whatsapp',
      phoneNumber: '+60123456789',
      status: event === 'otp.failed' ? 'FAILED' : 'DELIVERED',
      errorCode: event === 'otp.failed' ? 'ERR_HANDSET_UNREACHABLE' : '0',
      cost: channel === 'sms' ? '0.0210' : (channel === 'telegram' ? '0.0035' : '0.0500'),
      currency: 'USD',
      latency: '0.8s',
      timestamp: new Date().toISOString()
    };

    let pingSuccess = false;
    let statusCode = null;
    let durationMs = 0;
    let statusText = '';
    let lastError = null;

    try {
      const startT = Date.now();
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
      durationMs = Date.now();
      statusCode = netErr.name === 'AbortError' ? 408 : 503;
      statusText = netErr.name === 'AbortError' ? 'Timeout' : 'Connection Refused';
      lastError = netErr.message;
    }

    // Record test attempt into WebhookLogModel
    if (isDbConnected && req.user?.id) {
      try {
        await WebhookLogModel.create({
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
        });
      } catch (logErr) {}
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
      message: `Test webhook delivered successfully (HTTP ${statusCode}) in ${durationMs}ms!`,
      statusCode,
      durationMs: `${durationMs}ms`,
      targetUrl,
      payload: testPayload
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
