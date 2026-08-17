const express = require('express');
const router = express.Router();

const adminUserRoutes = require('./admin/adminUserRoutes');
const adminSms360Routes = require('./admin/adminSms360Routes');
const adminWhatsAppRoutes = require('./admin/adminWhatsAppRoutes');

router.use(adminUserRoutes);
router.use(adminSms360Routes);
router.use(adminWhatsAppRoutes);

module.exports = router;
