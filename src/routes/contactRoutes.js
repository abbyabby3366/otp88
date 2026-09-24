const express = require('express');
const router = express.Router();
const { getIsDbConnected } = require('../config/db');
const { ContactLeadModel } = require('../models');
const { validateBody, PATTERNS } = require('../middleware/validate');
const { contactLimiter } = require('../middleware/rateLimit');

// Lead / quotation form on the marketing pages
router.post(
  '/api/contact',
  contactLimiter,
  validateBody({
    name: { required: true, maxLength: 120 },
    email: { required: true, pattern: PATTERNS.email, patternMessage: 'must be a valid email address', lowercase: true, maxLength: 200 },
    company: { maxLength: 200 },
    monthlyVolume: { maxLength: 50 },
    message: { maxLength: 2000 }
  }),
  async (req, res) => {
    const { name, email, company, monthlyVolume, message } = req.body;
    const leadId = 'LEAD_' + Math.random().toString(36).substring(2, 9).toUpperCase();

    if (getIsDbConnected()) {
      ContactLeadModel.create({
        name,
        email,
        company: company || '',
        monthlyVolume: monthlyVolume || '',
        message: message || '',
        leadId
      }).catch(err => console.error('Error saving lead:', err.message));
    } else {
      console.warn(`[Contact] Lead ${leadId} from ${email} received while database is offline; not persisted.`);
    }

    res.json({
      success: true,
      message: 'Thanks for reaching out. Our team will contact you shortly with pricing and sandbox access.',
      leadId
    });
  }
);

module.exports = router;
