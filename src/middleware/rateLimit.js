const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { extractToken } = require('./auth');

const jsonHandler = (message) => (req, res) => {
  res.status(429).json({ success: false, error: message, retryAfterSeconds: Math.ceil((res.getHeader('Retry-After') || 60)) });
};

// General ceiling for all JSON endpoints, per client IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonHandler('Too many requests. Please slow down.')
});

// Sign-in, registration and password reset: tight per-IP limit against brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonHandler('Too many authentication attempts. Please wait 15 minutes and try again.')
});

// OTP sending: limited per API key (or session token) rather than per IP
const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => extractToken(req) || ipKeyGenerator(req.ip),
  handler: jsonHandler('OTP send rate limit exceeded (120 per minute). Please retry shortly.')
});

// Public lead form
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonHandler('Too many submissions from this network. Please try again later.')
});

module.exports = { apiLimiter, authLimiter, sendLimiter, contactLimiter };
