const express = require('express');
const router = express.Router();
const { ADMIN_USERNAME, getGlobalRates, setGlobalRates } = require('../../config/constants');
const { getIsDbConnected } = require('../../config/db');
const { UserModel, RateModel, WhatsAppConfigModel, EmailConfigModel } = require('../../models');
const { verifyJwtMiddleware, requireAdmin } = require('../../middleware/auth');
const { validateBody, PATTERNS } = require('../../middleware/validate');
const { hashPassword } = require('../../services/passwordService');

const requireDb = (req, res, next) => {
  if (!getIsDbConnected()) {
    return res.status(503).json({ success: false, error: 'Database unavailable. Please try again shortly.' });
  }
  next();
};

const toNumberOrUndefined = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = parseFloat(v);
  return isNaN(n) ? undefined : n;
};

// --- Carrier rate management ---
router.post(
  '/api/admin/rates',
  verifyJwtMiddleware,
  requireAdmin,
  validateBody({
    countryCode: { maxLength: 5 },
    whatsapp: { type: 'number', min: 0, max: 10 },
    telegram: { type: 'number', min: 0, max: 10 },
    email: { type: 'number', min: 0, max: 10 },
    sms: { type: 'number', min: 0, max: 10 },
    smsRates: { type: 'object' },
    isGlobal: { type: 'boolean' }
  }),
  async (req, res) => {
    const { countryCode, whatsapp, telegram, email, sms, smsRates, isGlobal } = req.body;
    const wNum = toNumberOrUndefined(whatsapp);
    const tNum = toNumberOrUndefined(telegram);
    const eNum = toNumberOrUndefined(email);
    const sNum = toNumberOrUndefined(sms);
    const clearSms = sms === null || req.body.sms === '';
    const isAll = Boolean(isGlobal) || !countryCode || String(countryCode).toUpperCase() === 'ALL';
    const code = isAll ? null : String(countryCode).toUpperCase();

    try {
      if (getIsDbConnected()) {
        const updateData = {};
        if (wNum !== undefined) updateData.whatsapp = wNum;
        if (tNum !== undefined) updateData.telegram = tNum;
        if (eNum !== undefined) updateData.email = eNum;

        if (isAll) {
          if (Object.keys(updateData).length > 0) await RateModel.updateMany({}, { $set: updateData });
          if (smsRates && typeof smsRates === 'object') {
            for (const [cCode, val] of Object.entries(smsRates)) {
              const parsed = toNumberOrUndefined(val);
              await RateModel.updateOne({ code: String(cCode).toUpperCase() }, { $set: { sms: parsed === undefined ? null : parsed } });
            }
          } else if (sNum !== undefined) {
            await RateModel.updateOne({ code: 'MY' }, { $set: { sms: sNum } });
          }
        } else {
          if (sNum !== undefined) updateData.sms = sNum;
          else if (clearSms) updateData.sms = null;
          await RateModel.findOneAndUpdate({ code }, { $set: updateData }, { new: true, upsert: true });
        }

        // Keep the WhatsApp gateway's displayed rate in step with the carrier table
        if (wNum !== undefined) {
          await WhatsAppConfigModel.updateMany({}, { $set: { ratePerOtp: wNum.toFixed(4) } })
            .catch(e => console.warn('Could not sync WhatsApp gateway rate:', e.message));
        }

        // Keep the Email gateway's displayed rate in step with the carrier table
        if (eNum !== undefined) {
          await EmailConfigModel.updateMany({}, { $set: { ratePerOtp: eNum.toFixed(4) } })
            .catch(e => console.warn('Could not sync Email gateway rate:', e.message));
        }

        const updatedRates = await RateModel.find().lean();
        if (updatedRates.length > 0) setGlobalRates(updatedRates);
        return res.json({ success: true, message: 'Carrier rates saved.', rates: getGlobalRates() });
      }

      // No database: update the in-memory table only
      const modifiedRates = getGlobalRates().map(r => {
        const item = { ...r };
        const applies = isAll || r.code === code;
        if (applies) {
          if (wNum !== undefined) item.whatsapp = wNum;
          if (tNum !== undefined) item.telegram = tNum;
          if (eNum !== undefined) item.email = eNum;
        }
        if (isAll && smsRates && typeof smsRates === 'object' && r.code in smsRates) {
          const parsed = toNumberOrUndefined(smsRates[r.code]);
          item.sms = parsed === undefined ? null : parsed;
        } else if (isAll && r.code === 'MY' && sNum !== undefined) {
          item.sms = sNum;
        } else if (!isAll && applies) {
          if (sNum !== undefined) item.sms = sNum;
          else if (clearSms) item.sms = null;
        }
        return item;
      });
      setGlobalRates(modifiedRates);
      return res.json({ success: true, message: 'Carrier rates saved in memory (database offline).', rates: getGlobalRates() });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }
);

// --- User management ---
router.get('/api/admin/users', verifyJwtMiddleware, requireAdmin, async (req, res) => {
  try {
    if (!getIsDbConnected()) return res.json({ success: true, users: [] });
    const users = await UserModel.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, users: [] });
  }
});

router.post(
  '/api/admin/users',
  verifyJwtMiddleware,
  requireAdmin,
  requireDb,
  validateBody({
    name: { maxLength: 100 },
    email: { required: true, pattern: PATTERNS.email, patternMessage: 'must be a valid email address', lowercase: true, maxLength: 200 },
    role: { enum: ['ADMIN', 'USER'] },
    balanceUsd: { type: 'number', min: 0, max: 1000000 },
    remark: { maxLength: 500 },
    password: { minLength: 6, maxLength: 200, trim: false },
    phone: { pattern: PATTERNS.phone, patternMessage: 'must be a valid phone number' }
  }),
  async (req, res) => {
    const { name, email, role = 'USER', balanceUsd = 0, remark = '', password, phone } = req.body;
    try {
      const existing = await UserModel.findOne({ email }).lean();
      if (existing) return res.status(409).json({ success: false, error: 'A user with this email already exists.' });

      const newUser = await UserModel.create({
        name: name || email.split('@')[0],
        email,
        phone: phone || undefined,
        role,
        balanceUsd,
        apiKeyLive: 'otp88_api_' + Math.random().toString(36).substring(2, 16) + '88',
        remark,
        password: password ? await hashPassword(password) : undefined,
        monthlyVolumeRemaining: '100,000'
      });
      const { password: _omit, ...safeUser } = newUser.toObject();
      res.json({ success: true, user: safeUser });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  }
);

router.put(
  '/api/admin/users/:id',
  verifyJwtMiddleware,
  requireAdmin,
  requireDb,
  validateBody({
    name: { maxLength: 100 },
    email: { pattern: PATTERNS.email, patternMessage: 'must be a valid email address', lowercase: true, maxLength: 200 },
    role: { enum: ['ADMIN', 'USER'] },
    status: { enum: ['ACTIVE', 'PAUSED', 'SUSPENDED'] },
    balanceUsd: { type: 'number', min: 0, max: 1000000 },
    password: { minLength: 6, maxLength: 200, trim: false },
    phone: { pattern: PATTERNS.phone, patternMessage: 'must be a valid phone number' },
    remark: { maxLength: 500 }
  }),
  async (req, res) => {
    const { id } = req.params;
    if (!PATTERNS.objectId.test(id)) return res.status(400).json({ success: false, error: 'Invalid user id.' });
    const { name, email, role, balanceUsd, status, password, phone, remark } = req.body;
    try {
      const updateFields = {};
      if (name !== undefined) updateFields.name = name;
      if (email !== undefined) updateFields.email = email;
      if (role !== undefined) updateFields.role = role;
      if (balanceUsd !== undefined) updateFields.balanceUsd = balanceUsd;
      if (status !== undefined) updateFields.status = status;
      if (phone !== undefined) updateFields.phone = phone;
      if (remark !== undefined) updateFields.remark = remark;
      if (password) updateFields.password = await hashPassword(password);

      const updatedUser = await UserModel.findByIdAndUpdate(id, { $set: updateFields }, { new: true }).select('-password');
      if (!updatedUser) return res.status(404).json({ success: false, error: 'User not found' });
      res.json({ success: true, message: 'User updated', user: updatedUser });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  }
);

router.delete('/api/admin/users/:id', verifyJwtMiddleware, requireAdmin, requireDb, async (req, res) => {
  const { id } = req.params;
  if (!PATTERNS.objectId.test(id)) return res.status(400).json({ success: false, error: 'Invalid user id.' });
  try {
    if (id === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot delete the account you are signed in with.' });
    }
    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (user.role === 'ADMIN' && user.email === ADMIN_USERNAME.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'The root administrator account cannot be deleted.' });
    }
    await UserModel.findByIdAndDelete(id);
    res.json({ success: true, message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
