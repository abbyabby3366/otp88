const express = require('express');
const router = express.Router();
const { getIsDbConnected } = require('../config/db');
const { ContactLeadModel } = require('../models');

// 4. API: Contact & Quotation Submissions
router.post('/api/contact', async (req, res) => {
  const { name, email, company, monthlyVolume, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required.' });
  }

  const leadId = 'LEAD_' + Math.random().toString(36).substring(2, 9).toUpperCase();

  if (getIsDbConnected()) {
    ContactLeadModel.create({
      name,
      email,
      company: company || '',
      monthlyVolume: monthlyVolume || '',
      message: message || '',
      leadId
    }).catch(err => console.error('Error saving lead to MongoDB:', err.message));
  }

  res.json({
    success: true,
    message: 'Thank you for reaching out to OTP88! A dedicated CPaaS engineer will contact you within 15 minutes with customized pricing & free test credits.',
    leadId
  });
});

module.exports = router;
