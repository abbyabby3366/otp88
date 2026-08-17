const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const rateRoutes = require('./rateRoutes');
const authRoutes = require('./authRoutes');
const otpRoutes = require('./otpRoutes');
const logRoutes = require('./logRoutes');
const metricsRoutes = require('./metricsRoutes');
const webhookRoutes = require('./webhookRoutes');
const adminRoutes = require('./adminRoutes');
const billingRoutes = require('./billingRoutes');
const userRoutes = require('./userRoutes');
const contactRoutes = require('./contactRoutes');
const staticRoutes = require('./staticRoutes');

// Mount API routes
router.use(healthRoutes);
router.use(rateRoutes);
router.use(authRoutes);
router.use(otpRoutes);
router.use(logRoutes);
router.use(metricsRoutes);
router.use(webhookRoutes);
router.use(adminRoutes);
router.use(billingRoutes);
router.use(userRoutes);
router.use(contactRoutes);

// Mount SPA and Static Fallback routes last
router.use(staticRoutes);

module.exports = router;
