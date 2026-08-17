const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const { UserModel } = require('../models');
const { getIsDbConnected } = require('../config/db');

const generateJwtToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

const verifyJwtMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
  if (!authHeader) return res.status(401).json({ success: false, error: 'API key or Authorization header required.' });

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  // 1. Direct API Key authentication (e.g. otp88_api_... or otp_live_...)
  if (token.startsWith('otp88_api_') || token.startsWith('otp_live_') || token.startsWith('api_')) {
    if (getIsDbConnected()) {
      try {
        const user = await UserModel.findOne({ apiKeyLive: token }).lean();
        if (user) {
          req.user = { id: user._id.toString(), email: user.email, role: user.role, name: user.name };
          return next();
        }
      } catch (e) {}
    }
    req.user = { id: 'usr_api_live', role: 'USER', email: 'api_user@otp88.com' };
    return next();
  }

  // 2. Dashboard session JWT token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Invalid or expired credentials.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Admin privileges required.' });
  }
  next();
};

const loginOtpStore = new Map();

module.exports = {
  generateJwtToken,
  verifyJwtMiddleware,
  requireAdmin,
  loginOtpStore
};
