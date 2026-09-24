const express = require('express');
const router = express.Router();
const { ADMIN_PASSWORD } = require('../config/constants');
const { getIsDbConnected } = require('../config/db');
const { UserModel, OtpLogModel, OtpAuditLogModel } = require('../models');
const { verifyJwtMiddleware, requireAdmin, loadAuthenticatedUser } = require('../middleware/auth');
const { formatDateTime, normalizePhoneNumber } = require('../utils/format');
const { verifyPassword } = require('../services/passwordService');

// Normalises the many channel spellings stored over time into display labels
const normalizeLogChannel = (ch) => {
  if (!ch) return 'WhatsApp';
  const c = String(ch).toUpperCase();
  if (c.includes('WHATSAPP')) return 'WhatsApp';
  if (c.includes('SMS') || c.includes('BULK360') || c.includes('TELCO') || c.includes('360')) return 'SMS';
  if (c.includes('TELEGRAM')) return 'Telegram';
  if (c.includes('VOICE')) return 'Voice';
  if (c.includes('RCS')) return 'RCS';
  if (c.includes('EMAIL')) return 'Email';
  return ch;
};

// Recent OTP logs for the signed-in user (admins see everyone, optionally filtered by userId)
router.get(['/api/logs', '/api/otp-logs', '/api/admin/logs'], verifyJwtMiddleware, async (req, res) => {
  try {
    if (!getIsDbConnected()) return res.json({ success: true, logs: [] });

    let query = {};
    if (req.user.role !== 'ADMIN') {
      query = { userId: req.user.id };
    } else if (req.query.userId && req.query.userId !== 'ALL') {
      query = { userId: req.query.userId };
    }
    const rawLogs = await OtpLogModel.find(query).sort({ createdAt: -1 }).limit(150).lean();

    const userMap = {};
    if (req.user.role === 'ADMIN') {
      const users = await UserModel.find({}).select('name email _id').lean();
      users.forEach(u => { userMap[u._id.toString()] = u.name || u.email; });
    }

    const formatted = rawLogs.map((l) => {
      const isEmail = String(l.channel || '').toUpperCase().includes('EMAIL') || String(l.phoneNumber || '').includes('@');
      return {
        id: l.msgId || ('LOG_' + l._id.toString().slice(-6).toUpperCase()),
        to: isEmail ? l.phoneNumber : normalizePhoneNumber(l.phoneNumber),
        channel: normalizeLogChannel(l.channel),
        otpCode: l.otpCode || '',
        message: l.messageText || '',
        senderId: l.senderId || '',
        latency: l.latency || '',
        cost: l.cost || '',
        status: l.status || 'SENT',
        errorCode: l.errorCode || '0',
        remark: l.remark || '',
        userId: l.userId || '',
        userName: (l.userId && userMap[l.userId]) ? userMap[l.userId] : (l.userId ? 'User #' + l.userId.slice(-4) : 'System'),
        time: formatDateTime(l.createdAt),
        createdAt: l.createdAt
      };
    });
    res.json({ success: true, logs: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, logs: [] });
  }
});

// Admin audit trail
router.get('/api/admin/otp-audit-logs', verifyJwtMiddleware, requireAdmin, async (req, res) => {
  try {
    if (!getIsDbConnected()) return res.json({ success: true, logs: [] });
    const rawLogs = await OtpAuditLogModel.find().sort({ createdAt: -1 }).limit(100).lean();
    const formatted = rawLogs.map(l => ({
      id: l.auditId || l._id.toString().slice(-6),
      target: String(l.target || '').includes('@') ? l.target : normalizePhoneNumber(l.target),
      channel: l.channel,
      action: l.action,
      actor: l.actor,
      status: l.status,
      latency: l.latency,
      time: formatDateTime(l.createdAt || l.time),
      createdAt: l.createdAt
    }));
    res.json({ success: true, logs: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, logs: [] });
  }
});

// Admin: permanently delete all OTP logs. Requires the admin password to be re-entered.
router.post('/api/admin/logs/clear', verifyJwtMiddleware, requireAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, error: 'Admin password is required to delete all logs.' });
  }

  let isPasswordValid = password === ADMIN_PASSWORD;
  if (!isPasswordValid) {
    try {
      const adminDoc = await loadAuthenticatedUser(req);
      if (adminDoc && adminDoc.password) {
        isPasswordValid = (await verifyPassword(password, adminDoc.password)).ok;
      }
    } catch (e) {
      console.warn('Admin password re-check failed:', e.message);
    }
  }

  if (!isPasswordValid) {
    return res.status(403).json({ success: false, error: 'Incorrect admin password. Deletion cancelled.' });
  }

  try {
    if (getIsDbConnected()) {
      await OtpLogModel.deleteMany({});
      await OtpAuditLogModel.deleteMany({});
    }
    return res.json({ success: true, message: 'All OTP logs have been permanently deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
