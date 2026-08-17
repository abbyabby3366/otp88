const express = require('express');
const router = express.Router();
const { getIsDbConnected } = require('../config/db');
const { handleLiveReloadSse } = require('../services/liveReloadService');

// --- Backend Health Check & Online Status ---
router.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    dbConnected: getIsDbConnected(),
    timestamp: Date.now()
  });
});

// --- Browser Live-Reload SSE Stream for Development ---
router.get('/api/live-reload', handleLiveReloadSse);

// --- Platform Status ---
router.get('/api/status', (req, res) => {
  res.json({
    success: true,
    platform: 'OTP88 Next-Gen CPaaS Gateway',
    status: 'All Systems Operational',
    uptime: '99.99%',
    dbConnected: getIsDbConnected(),
    channels: {
      whatsapp: 'Operational',
      sms: 'Operational (SMS360 Integrated)',
      telegram: 'Operational',
      voice: 'Operational',
      email: 'Operational',
      rcs: 'Beta Testing'
    },
    latency: {
      whatsapp: '0.62s',
      sms: '0.45s',
      telegram: '0.64s',
      voice: '2.1s'
    },
    directCarrierConnections: ['Maxis MY', 'CelcomDigi MY', 'Singtel SG', 'Telkomsel ID', 'AIS TH', 'Viettel VN']
  });
});

module.exports = router;
