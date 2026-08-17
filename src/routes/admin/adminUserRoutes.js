const express = require('express');
const router = express.Router();
const {
  ADMIN_USERNAME,
  getGlobalRates,
  setGlobalRates,
  setWhatsAppConfig
} = require('../../config/constants');
const { getIsDbConnected } = require('../../config/db');
const { UserModel, RateModel, WhatsAppConfigModel } = require('../../models');
const { verifyJwtMiddleware, requireAdmin } = require('../../middleware/auth');

// --- Admin Carrier Rates Adjustment ---

router.post('/api/admin/rates', verifyJwtMiddleware, requireAdmin, async (req, res) => {
  const { countryCode, whatsapp, telegram, sms, smsRates, isGlobal } = req.body;
  
  const wNum = (whatsapp !== undefined && whatsapp !== '') ? parseFloat(whatsapp) : undefined;
  const tNum = (telegram !== undefined && telegram !== '') ? parseFloat(telegram) : undefined;
  const sNum = (sms !== undefined && sms !== '') ? parseFloat(sms) : undefined;

  let globalRates = getGlobalRates();

  try {
    const isAll = isGlobal || !countryCode || countryCode === 'ALL';

    if (getIsDbConnected()) {
      const updateData = {};
      if (wNum !== undefined && !isNaN(wNum)) updateData.whatsapp = wNum;
      if (tNum !== undefined && !isNaN(tNum)) updateData.telegram = tNum;

      if (isAll) {
        if (Object.keys(updateData).length > 0) {
          await RateModel.updateMany({}, { $set: updateData });
        }

        if (smsRates && typeof smsRates === 'object') {
          for (const [cCode, val] of Object.entries(smsRates)) {
            const parsedSms = (val !== null && val !== undefined && val !== '' && !isNaN(parseFloat(val)))
              ? parseFloat(val)
              : null;
            await RateModel.updateOne({ code: cCode.toUpperCase() }, { $set: { sms: parsedSms } });
          }
        } else if (sNum !== undefined && !isNaN(sNum)) {
          await RateModel.updateOne({ code: 'MY' }, { $set: { sms: sNum } });
        }
      } else {
        const code = countryCode.toUpperCase();
        if (sNum !== undefined && !isNaN(sNum)) {
          updateData.sms = sNum;
        } else if (sms === null || sms === '') {
          updateData.sms = null;
        }
        await RateModel.findOneAndUpdate(
          { code },
          { $set: updateData },
          { new: true, upsert: true }
        );
      }

      if (wNum !== undefined && !isNaN(wNum)) {
        setWhatsAppConfig({ ratePerOtp: String(wNum) });
        try {
          await WhatsAppConfigModel.updateMany({}, { $set: { ratePerOtp: String(wNum) } });
        } catch (e) {}
      }

      const updatedRates = await RateModel.find().lean();
      if (updatedRates && updatedRates.length > 0) {
        setGlobalRates(updatedRates);
      }

      return res.json({ success: true, message: 'Carrier rates successfully updated and saved in database.', rates: getGlobalRates() });
    } else {
      const modifiedRates = globalRates.map(r => {
        const item = { ...r };
        if (isAll || r.code === countryCode.toUpperCase()) {
          if (wNum !== undefined && !isNaN(wNum)) item.whatsapp = wNum;
          if (tNum !== undefined && !isNaN(tNum)) item.telegram = tNum;
        }
        if (isAll && smsRates && typeof smsRates === 'object') {
          if (r.code in smsRates) {
            const val = smsRates[r.code];
            item.sms = (val !== null && val !== undefined && val !== '' && !isNaN(parseFloat(val)))
              ? parseFloat(val)
              : null;
          }
        } else if (r.code === 'MY' && sNum !== undefined && !isNaN(sNum)) {
          item.sms = sNum;
        } else if (!isAll && r.code === countryCode.toUpperCase()) {
          if (sNum !== undefined && !isNaN(sNum)) item.sms = sNum;
          else if (sms === null || sms === '') item.sms = null;
        }
        return item;
      });
      setGlobalRates(modifiedRates);
      if (wNum !== undefined && !isNaN(wNum)) {
        setWhatsAppConfig({ ratePerOtp: String(wNum) });
      }
      return res.json({ success: true, message: 'Carrier rates saved successfully in memory.', rates: getGlobalRates() });
    }
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// --- Admin: User Management APIs ---

router.get('/api/admin/users', verifyJwtMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await UserModel.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, users: [] });
  }
});

router.post('/api/admin/users', verifyJwtMiddleware, requireAdmin, async (req, res) => {
  const { name, email, role = 'USER', balanceUsd = 50.00, remark = '' } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email is required.' });
  try {
    const newUser = await UserModel.create({
      name: name || email.split('@')[0],
      email: email.trim().toLowerCase(),
      role,
      balanceUsd: parseFloat(balanceUsd) || 50.00,
      apiKeyLive: 'otp88_api_' + Math.random().toString(36).substring(2, 16) + '88',
      remark: (remark || '').trim(),
      monthlyVolumeRemaining: '100,000'
    });
    res.json({ success: true, user: newUser });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/api/admin/users/:id', verifyJwtMiddleware, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, role, balanceUsd, status, password, phone, remark } = req.body;
  try {
    const updateFields = {};
    if (name !== undefined) updateFields.name = name.trim();
    if (email !== undefined) updateFields.email = email.trim().toLowerCase();
    if (role !== undefined) updateFields.role = role;
    if (balanceUsd !== undefined) updateFields.balanceUsd = parseFloat(balanceUsd);
    if (status !== undefined) updateFields.status = status;
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (remark !== undefined) updateFields.remark = remark.trim();
    if (password && password.trim().length > 0) {
      updateFields.password = password.trim();
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete('/api/admin/users/:id', verifyJwtMiddleware, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    if (id === req.user.id || id === 'admin_root_01') {
      return res.status(400).json({ success: false, error: 'Cannot delete the primary root admin account.' });
    }
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (user.role === 'ADMIN' && user.email === ADMIN_USERNAME.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'Cannot delete the default root admin.' });
    }
    await UserModel.findByIdAndDelete(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
