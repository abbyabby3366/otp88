const express = require('express');
const router = express.Router();
const { ADMIN_USERNAME, ADMIN_PASSWORD } = require('../config/constants');
const { getIsDbConnected } = require('../config/db');
const { UserModel, OtpAuditLogModel } = require('../models');
const { generateJwtToken, loginOtpStore } = require('../middleware/auth');
const { normalizePhoneNumber } = require('../utils/format');
const { hashPassword, verifyPassword } = require('../services/passwordService');
const { dispatchOtp } = require('../services/dispatchers');
const { authLimiter } = require('../middleware/rateLimit');
const { validateBody, PATTERNS } = require('../middleware/validate');

const RESET_CODE_TTL_MS = 5 * 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;

function newApiKey() {
  return 'otp88_api_' + Math.random().toString(36).substring(2, 16) + '88';
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    phone: user.phone,
    name: user.name || user.email,
    role: user.role || 'USER',
    balanceUsd: user.balanceUsd ?? 0,
    apiKeyLive: user.apiKeyLive,
    webhookUrl: user.webhookUrl || '',
    emailBrandHandle: user.emailBrandHandle || '',
    emailBrandName: user.emailBrandName || '',
    emailReplyTo: user.emailReplyTo || '',
    remark: user.remark || '',
    monthlyVolumeRemaining: user.monthlyVolumeRemaining || '100,000'
  };
}

function tokenFor(user) {
  return generateJwtToken({
    id: user._id.toString(),
    email: user.email,
    phone: user.phone,
    name: user.name,
    role: user.role || 'USER'
  });
}

const adminQuery = () => ({
  $or: [{ email: ADMIN_USERNAME.toLowerCase() }, { name: ADMIN_USERNAME }, { email: 'admin' }, { name: 'admin' }]
});

// --- Sign in with username / email / phone + password ---
router.post('/api/auth/login', authLimiter, validateBody({
  identifier: { maxLength: 200 }, username: { maxLength: 200 }, email: { maxLength: 200 }, phone: { maxLength: 40 },
  password: { required: true, maxLength: 200, trim: false }
}), async (req, res) => {
  const { email, username, phone, identifier, password } = req.body;
  const input = (identifier || username || phone || email || '').trim();
  if (!input || !password) {
    return res.status(400).json({ success: false, error: 'Username/Phone and password are required.' });
  }

  const cleanInput = input.toLowerCase();
  const isDbConnected = getIsDbConnected();

  // Administrator sign-in with the credentials from the environment
  const isAdminMatch = (cleanInput === ADMIN_USERNAME.toLowerCase() || cleanInput === 'admin') && password === ADMIN_PASSWORD;
  if (isAdminMatch) {
    let adminDbUser = null;
    if (isDbConnected) {
      try {
        adminDbUser = await UserModel.findOne(adminQuery());
        if (adminDbUser) {
          let changed = false;
          if (adminDbUser.role !== 'ADMIN') { adminDbUser.role = 'ADMIN'; changed = true; }
          if (!adminDbUser.apiKeyLive) { adminDbUser.apiKeyLive = newApiKey(); changed = true; }
          if (changed) await adminDbUser.save();
        }
      } catch (e) {
        console.error('Admin lookup error:', e.message);
      }
    }

    const token = generateJwtToken({
      id: adminDbUser ? adminDbUser._id.toString() : 'admin_root_01',
      username: ADMIN_USERNAME,
      email: ADMIN_USERNAME,
      role: 'ADMIN'
    });

    return res.json({
      success: true,
      message: 'Welcome back, Administrator.',
      token,
      user: adminDbUser ? publicUser(adminDbUser) : {
        id: 'admin_root_01',
        email: ADMIN_USERNAME,
        name: ADMIN_USERNAME,
        role: 'ADMIN',
        balanceUsd: 0,
        apiKeyLive: '',
        monthlyVolumeRemaining: 'Unlimited'
      }
    });
  }

  if (!isDbConnected) {
    return res.status(503).json({ success: false, error: 'Sign-in is temporarily unavailable. Please try again shortly.' });
  }

  try {
    const sanitizedPhone = input.replace(/[\s\-()]/g, '');
    const escapedInput = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await UserModel.findOne({
      $or: [
        { email: cleanInput },
        { name: new RegExp(`^${escapedInput}$`, 'i') },
        { phone: input },
        { phone: sanitizedPhone },
        { phone: normalizePhoneNumber(sanitizedPhone) }
      ]
    });

    const invalid = () => res.status(401).json({ success: false, error: 'Invalid username or password.' });
    if (!user || !user.password) return invalid();

    const check = await verifyPassword(password, user.password);
    if (!check.ok) return invalid();

    if (user.status && user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, error: `Your account is ${user.status.toLowerCase()}. Please contact support.` });
    }

    // Upgrade legacy plaintext passwords on first successful login
    if (check.needsRehash) {
      user.password = await hashPassword(password);
      await user.save();
    }

    return res.json({
      success: true,
      message: 'Signed in successfully.',
      token: tokenFor(user),
      user: publicUser(user)
    });
  } catch (e) {
    console.error('Login error:', e.message);
    return res.status(500).json({ success: false, error: 'Sign-in failed. Please try again.' });
  }
});

// --- Create an account ---
router.post('/api/auth/register', authLimiter, validateBody({
  username: { maxLength: 100 }, email: { maxLength: 200 },
  password: { required: true, minLength: 6, maxLength: 200, trim: false },
  phoneNumber: { required: true, pattern: PATTERNS.phone, patternMessage: 'must be a valid phone number' }
}), async (req, res) => {
  const { username, email, password, phoneNumber } = req.body;
  const userIdentifier = (username || email || '').trim();
  const phone = normalizePhoneNumber((phoneNumber || '').trim());

  if (!userIdentifier) return res.status(400).json({ success: false, error: 'Username or Email is required.' });
  if (!password || String(password).length < 6) return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
  if (!phone) return res.status(400).json({ success: false, error: 'Phone number is required.' });
  if (userIdentifier.toLowerCase() === ADMIN_USERNAME.toLowerCase() || userIdentifier.toLowerCase() === 'admin') {
    return res.status(400).json({ success: false, error: 'That username is reserved.' });
  }

  if (!getIsDbConnected()) {
    return res.status(503).json({ success: false, error: 'Registration is temporarily unavailable. Please try again shortly.' });
  }

  try {
    const existing = await UserModel.findOne({ $or: [{ email: userIdentifier.toLowerCase() }, { phone }] });
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this username/email or phone number already exists.' });
    }
    const user = await UserModel.create({
      name: userIdentifier.includes('@') ? userIdentifier.split('@')[0] : userIdentifier,
      email: userIdentifier.toLowerCase(),
      phone,
      password: await hashPassword(password),
      role: 'USER',
      balanceUsd: 0,
      apiKeyLive: newApiKey(),
      monthlyVolumeRemaining: '100,000'
    });

    return res.json({
      success: true,
      message: 'Account created successfully. Welcome to OTP88.',
      token: tokenFor(user),
      user: publicUser(user)
    });
  } catch (e) {
    console.error('Registration error:', e.message);
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
});

// --- Password reset, step 1: send a code to the registered phone number ---
router.post('/api/auth/reset-password/send-otp', authLimiter, validateBody({
  phoneNumber: { required: true, pattern: PATTERNS.phone, patternMessage: 'must be a valid phone number' }
}), async (req, res) => {
  const { phoneNumber: rawPhone } = req.body;
  if (!rawPhone) {
    return res.status(400).json({ success: false, error: 'Registered phone number is required.' });
  }
  if (!getIsDbConnected()) {
    return res.status(503).json({ success: false, error: 'Password reset is temporarily unavailable. Please try again shortly.' });
  }

  const phoneNumber = normalizePhoneNumber(rawPhone);
  // The response is the same whether or not the number is registered, so accounts cannot be enumerated.
  const genericResponse = {
    success: true,
    message: `If ${phoneNumber} is registered, a verification code has been sent to it.`,
    phoneNumber,
    expiresInSeconds: RESET_CODE_TTL_MS / 1000
  };

  try {
    const user = await UserModel.findOne({ phone: { $in: [phoneNumber, String(rawPhone).trim()] } });
    if (!user) return res.json(genericResponse);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const result = await dispatchOtp('whatsapp', { to: phoneNumber, otpCode: code });
    const delivered = result.success
      ? result
      : await dispatchOtp('sms', { to: phoneNumber, otpCode: code, messageText: `RM0 OTP88: Your password reset code is ${code}. Valid for 5 minutes.` });

    if (!delivered.success) {
      console.error('Password reset code could not be delivered:', delivered.error);
      return res.status(502).json({ success: false, error: 'We could not deliver a verification code right now. Please try again later.' });
    }

    loginOtpStore.set('reset_' + phoneNumber, { code, expiresAt: Date.now() + RESET_CODE_TTL_MS, attempts: 0 });

    OtpAuditLogModel.create({
      auditId: 'AUD_' + Math.floor(1000 + Math.random() * 9000),
      target: phoneNumber,
      channel: result.success ? 'WHATSAPP' : 'SMS',
      action: 'PASSWORD_RESET_DISPATCH',
      actor: 'USER_SELF_SERVICE',
      status: 'SENT',
      latency: `${((delivered.latencyMs || 0) / 1000).toFixed(2)}s`,
      time: new Date().toTimeString().split(' ')[0],
      msgId: delivered.ref || undefined
    }).catch(e => console.error('Error logging password reset dispatch:', e.message));

    return res.json(genericResponse);
  } catch (e) {
    console.error('Password reset send error:', e.message);
    return res.status(500).json({ success: false, error: 'Password reset failed. Please try again.' });
  }
});

// --- Password reset, step 2: verify the code and set the new password ---
router.post('/api/auth/reset-password/verify', authLimiter, validateBody({
  phoneNumber: { required: true, pattern: PATTERNS.phone, patternMessage: 'must be a valid phone number' },
  otpCode: { required: true, pattern: PATTERNS.otp, patternMessage: 'must be 4 to 8 digits' },
  newPassword: { required: true, minLength: 6, maxLength: 200, trim: false }
}), async (req, res) => {
  const { phoneNumber: rawPhone, otpCode, newPassword } = req.body;
  if (!rawPhone || !otpCode || !newPassword) {
    return res.status(400).json({ success: false, error: 'Phone number, OTP code, and new password are required.' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
  }
  if (!getIsDbConnected()) {
    return res.status(503).json({ success: false, error: 'Password reset is temporarily unavailable. Please try again shortly.' });
  }

  const phoneNumber = normalizePhoneNumber(rawPhone);
  const key = 'reset_' + phoneNumber;
  const stored = loginOtpStore.get(key);

  if (!stored || stored.expiresAt < Date.now()) {
    loginOtpStore.delete(key);
    return res.status(400).json({ success: false, error: 'Invalid or expired code. Please request a new one.' });
  }
  if (stored.code !== String(otpCode).trim()) {
    stored.attempts = (stored.attempts || 0) + 1;
    if (stored.attempts >= MAX_RESET_ATTEMPTS) loginOtpStore.delete(key);
    return res.status(400).json({ success: false, error: 'Invalid or expired code. Please request a new one.' });
  }
  loginOtpStore.delete(key);

  try {
    const user = await UserModel.findOneAndUpdate(
      { phone: { $in: [phoneNumber, String(rawPhone).trim()] } },
      { password: await hashPassword(newPassword) }
    );
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired code. Please request a new one.' });
    }
    OtpAuditLogModel.create({
      auditId: 'AUD_' + Math.floor(1000 + Math.random() * 9000),
      target: phoneNumber,
      channel: 'SYSTEM',
      action: 'PASSWORD_RESET_COMPLETED',
      actor: phoneNumber,
      status: 'SUCCESS',
      latency: '0.1s',
      time: new Date().toTimeString().split(' ')[0]
    }).catch(() => {});

    return res.json({ success: true, message: 'Password has been reset. You can now sign in with your new password.' });
  } catch (e) {
    console.error('Password reset error:', e.message);
    return res.status(500).json({ success: false, error: 'Password reset failed. Please try again.' });
  }
});

module.exports = router;
