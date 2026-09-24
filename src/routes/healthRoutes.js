const express = require('express');
const router = express.Router();
const { getIsDbConnected } = require('../config/db');
const { SUPPORTED_CHANNELS } = require('../config/constants');
const { handleLiveReloadSse } = require('../services/liveReloadService');
const { getSmsConfig } = require('../services/dispatchers/smsDispatcher');
const { getWhatsAppConfig } = require('../services/dispatchers/whatsappDispatcher');
const { getEmailConfig } = require('../services/dispatchers/emailDispatcher');

const startedAt = Date.now();

// Liveness probe
router.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    dbConnected: getIsDbConnected(),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: Date.now()
  });
});

// Browser live-reload stream (development only)
router.get('/api/live-reload', handleLiveReloadSse);

// Platform status: which channels are configured and active right now
router.get('/api/status', async (req, res) => {
  const [sms, whatsapp, email] = await Promise.all([getSmsConfig(), getWhatsAppConfig(), getEmailConfig()]);
  const describe = (cfg, configured) => {
    if (!configured) return 'Not configured';
    return cfg.status === 'ACTIVE' ? 'Operational' : 'Paused';
  };
  res.json({
    success: true,
    platform: 'OTP88',
    dbConnected: getIsDbConnected(),
    supportedChannels: SUPPORTED_CHANNELS,
    channels: {
      whatsapp: describe(whatsapp, Boolean(whatsapp.apiKey)),
      sms: describe(sms, Boolean(sms.appKey && sms.appSecret)),
      email: describe(email, Boolean(email.apiKey))
    },
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
