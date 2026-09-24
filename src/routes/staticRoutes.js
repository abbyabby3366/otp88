const express = require('express');
const router = express.Router();
const path = require('path');

const publicDir = path.join(__dirname, '../../public');

// Marketing pages live in public/*.html and are served by express.static.
// The landing page also answers a few friendly aliases.
router.get(['/', '/index.html', '/home', '/landing'], (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Every console route (login, dashboard, admin pages) is handled by the React app.
const CONSOLE_PREFIXES = [
  '/login', '/register', '/forgot', '/reset', '/console',
  '/dashboard', '/otp-logs', '/services', '/rates', '/pricing-console',
  '/api-keys', '/keys', '/webhooks', '/webhook-logs', '/billing', '/users',
  '/sms360', '/sms-otp', '/whatsapp-otp', '/email-otp',
  '/admin'
];

function isConsolePath(pathname) {
  const clean = pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (clean === '/api') return true; // the console's "API & Keys" page
  if (clean.startsWith('/api/') || clean.startsWith('/v1/')) return false; // JSON endpoints
  return CONSOLE_PREFIXES.some(p => clean === p || clean.startsWith(p + '/'));
}

router.get('*', (req, res, next) => {
  if (req.path.includes('.')) return next(); // static assets
  if (isConsolePath(req.path)) {
    return res.sendFile(path.join(publicDir, 'login.html'));
  }
  if (req.path.startsWith('/api/') || req.path.startsWith('/v1/')) {
    return res.status(404).json({ success: false, error: `Unknown endpoint ${req.method} ${req.path}` });
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Unknown JSON endpoints on other methods
router.all(['/api/*', '/v1/*'], (req, res) => {
  res.status(404).json({ success: false, error: `Unknown endpoint ${req.method} ${req.path}` });
});

module.exports = router;
