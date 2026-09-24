const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { JWT_SECRET } = require('../config/constants');
const { UserModel } = require('../models');
const { getIsDbConnected } = require('../config/db');

const API_KEY_PREFIXES = ['otp88_api_', 'otp_live_', 'api_'];

const generateJwtToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

function extractToken(req) {
  const header = req.headers['authorization'] || req.headers['x-api-key'];
  if (!header) return '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim();
}

function isApiKey(token) {
  return API_KEY_PREFIXES.some(p => token.startsWith(p));
}

/**
 * Looks up the account that owns an API key. Older keys were issued with an
 * `otp_live_` prefix, so both spellings of the same key are accepted.
 * Returns the lean user document or null.
 */
async function resolveUserFromApiKey(token) {
  if (!getIsDbConnected()) return null;
  const candidates = new Set([token]);
  if (token.startsWith('otp88_api_')) candidates.add('otp_live_' + token.slice('otp88_api_'.length));
  if (token.startsWith('otp_live_')) candidates.add('otp88_api_' + token.slice('otp_live_'.length));
  const user = await UserModel.findOne({ apiKeyLive: { $in: [...candidates] } }).lean();
  return user || null;
}

function toRequestUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role || 'USER',
    name: user.name,
    status: user.status || 'ACTIVE'
  };
}

/**
 * Authenticates either a dashboard JWT or a live API key.
 * Unknown API keys are rejected; when the database is unreachable API keys
 * cannot be verified, so those requests get a 503 instead of a guess.
 */
const verifyJwtMiddleware = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'API key or Authorization header required.' });
  }

  if (isApiKey(token)) {
    if (!getIsDbConnected()) {
      return res.status(503).json({ success: false, error: 'Account service unavailable. Please retry shortly.' });
    }
    try {
      const user = await resolveUserFromApiKey(token);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid API key.' });
      }
      if (user.status && user.status !== 'ACTIVE') {
        return res.status(403).json({ success: false, error: `Account is ${user.status.toLowerCase()}. Contact support.` });
      }
      req.user = toRequestUser(user);
      req.authType = 'api_key';
      return next();
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Authentication lookup failed.' });
    }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.authType = 'jwt';
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired credentials.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Admin privileges required.' });
  }
  next();
};

/**
 * Loads the full user document for the authenticated request when possible.
 * Admin sessions created from the env credentials may not map to a DB document.
 */
async function loadAuthenticatedUser(req) {
  if (!getIsDbConnected() || !req.user) return null;
  if (req.user.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
    const byId = await UserModel.findById(req.user.id);
    if (byId) return byId;
  }
  if (req.user.email) {
    const byEmail = await UserModel.findOne({ email: req.user.email });
    if (byEmail) return byEmail;
  }
  return null;
}

// Short-lived in-memory store for password-reset codes (keyed by phone number)
const loginOtpStore = new Map();

module.exports = {
  generateJwtToken,
  verifyJwtMiddleware,
  requireAdmin,
  resolveUserFromApiKey,
  loadAuthenticatedUser,
  extractToken,
  loginOtpStore
};
