const express = require('express');
const router = express.Router();
const { getIsDbConnected } = require('../config/db');
const { getGlobalRates } = require('../config/constants');
const { RateModel } = require('../models');

// 1. API: Get Global Rates & Country List (Live MongoDB or Local Storage)
router.get('/api/rates', async (req, res) => {
  const { search } = req.query;
  const globalRates = getGlobalRates();
  try {
    let query = {};
    if (search) {
      const q = search.trim();
      query = {
        $or: [
          { country: { $regex: q, $options: 'i' } },
          { code: { $regex: q, $options: 'i' } },
          { dialCode: { $regex: q, $options: 'i' } }
        ]
      };
    }
    if (getIsDbConnected()) {
      const results = await RateModel.find(query).lean();
      if (results && results.length > 0) {
        return res.json({
          success: true,
          total: results.length,
          data: results,
          source: 'mongodb-atlas'
        });
      }
    }

    let fallbackData = Array.isArray(globalRates) ? globalRates : [];
    if (search) {
      const q = search.trim().toLowerCase();
      fallbackData = fallbackData.filter(r =>
        (r.country && r.country.toLowerCase().includes(q)) ||
        (r.code && r.code.toLowerCase().includes(q)) ||
        (r.dialCode && r.dialCode.toLowerCase().includes(q))
      );
    }
    res.json({
      success: true,
      total: fallbackData.length,
      data: fallbackData,
      source: 'local-file'
    });
  } catch (err) {
    res.json({ success: true, total: globalRates.length, data: globalRates, source: 'local-file' });
  }
});

// 2. API: Dynamic Cost & Savings Calculator
router.post('/api/calculate-cost', (req, res) => {
  const globalRates = getGlobalRates();
  const {
    countryCode = 'MY',
    monthlyVolume = 50000,
    whatsappPct = 60,
    telegramPct = 15,
    smsPct = 20,
    voicePct = 5
  } = req.body;

  const rateInfo = globalRates.find(r => r.code === countryCode) || globalRates[0] || {
    country: 'Malaysia',
    whatsapp: 0.0075,
    telegram: 0.0035,
    sms: 0.0210,
    voice: 0.0240,
    legacySms: 0.0450
  };
  const vol = Math.max(1000, parseInt(monthlyVolume, 10) || 50000);

  // Normalize percentages
  const totalPct = whatsappPct + telegramPct + smsPct + voicePct || 100;
  const wRatio = whatsappPct / totalPct;
  const tRatio = telegramPct / totalPct;
  const sRatio = smsPct / totalPct;
  const vRatio = voicePct / totalPct;

  // Volume tier discount
  let discountPct = 0;
  if (vol >= 1000000) discountPct = 0.20;
  else if (vol >= 500000) discountPct = 0.15;
  else if (vol >= 100000) discountPct = 0.10;
  else if (vol >= 25000) discountPct = 0.05;

  const costWhatsApp = vol * wRatio * (rateInfo.whatsapp || 0.0075);
  const costTelegram = vol * tRatio * (rateInfo.telegram || 0.0035);
  const costSms = vol * sRatio * (rateInfo.sms || 0.0210);
  const costVoice = vol * vRatio * (rateInfo.voice || 0.0240);

  const rawTotal = costWhatsApp + costTelegram + costSms + costVoice;
  const totalOtp88Cost = rawTotal * (1 - discountPct);

  // Compare with traditional Legacy SMS
  const legacySmsRate = rateInfo.legacySms || 0.0450;
  const legacySmsCost = vol * legacySmsRate;
  const monthlySavings = Math.max(0, legacySmsCost - totalOtp88Cost);
  const savingsPct = Math.round((monthlySavings / legacySmsCost) * 100);

  res.json({
    success: true,
    country: rateInfo.country,
    currency: 'USD',
    volume: vol,
    discountTier: `${Math.round(discountPct * 100)}%`,
    breakdown: {
      whatsapp: {
        volume: Math.round(vol * wRatio),
        rate: rateInfo.whatsapp || 0.0075,
        subtotal: parseFloat(costWhatsApp.toFixed(2))
      },
      telegram: {
        volume: Math.round(vol * tRatio),
        rate: rateInfo.telegram || 0.0035,
        subtotal: parseFloat(costTelegram.toFixed(2))
      },
      sms: {
        volume: Math.round(vol * sRatio),
        rate: rateInfo.sms || 0.0210,
        subtotal: parseFloat(costSms.toFixed(2))
      },
      voice: {
        volume: Math.round(vol * vRatio),
        rate: rateInfo.voice || 0.0240,
        subtotal: parseFloat(costVoice.toFixed(2))
      }
    },
    totalMonthlyCost: parseFloat(totalOtp88Cost.toFixed(2)),
    legacySmsCost: parseFloat(legacySmsCost.toFixed(2)),
    monthlySavings: parseFloat(monthlySavings.toFixed(2)),
    annualSavings: parseFloat((monthlySavings * 12).toFixed(2)),
    savingsPercentage: savingsPct
  });
});

module.exports = router;
