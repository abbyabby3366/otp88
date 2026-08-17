const express = require('express');
const router = express.Router();
const path = require('path');

const publicDir = path.join(__dirname, '../../public');

// 1. Marketing & Landing Page Routes serve the high-converting Landing Page (index.html)
router.get([
  '/', '/index.html', '/home', '/landing', '/marketing'
], (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// 2. React Application & Auth/Console Routes serve the React Console (login.html)
router.get([
  '/login', '/login.html', '/register', '/forgot', '/reset',
  '/dashboard', '/logs', '/otp-logs', '/services', '/rates',
  '/api', '/keys', '/billing', '/users', '/admin', '/admin/dashboard',
  '/admin/users', '/admin/logs', '/admin-logs', '/admin/rates', '/admin/api', '/admin/keys',
  '/admin/billing', '/admin/invoices', '/admin/topup',
  '/sms360', '/admin/sms360', '/admin-sms360', '/whatsapp-otp', '/admin/whatsapp-otp', '/console'
], (req, res) => {
  res.sendFile(path.join(publicDir, 'login.html'));
});

// Fallback for unknown HTML routes -> serve index.html
router.get('*', (req, res, next) => {
  if (req.path.includes('.')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

module.exports = router;
