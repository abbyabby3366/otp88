const mongoose = require('mongoose');

const WhatsAppConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'whatsapp_verifyway_primary', unique: true },
  apiKey: { type: String, default: '' },
  apiUrl: { type: String, default: 'https://api.verifyway.com/api/v1/' },
  channel: { type: String, default: 'whatsapp' },
  fallback: { type: String, default: 'no' },
  lang: { type: String, default: 'en' },
  webhookUrl: { type: String, default: 'https://api.otp88.com/api/webhooks/whatsapp/dlr' },
  ratePerOtp: { type: String, default: '0.0075' },
  currency: { type: String, default: 'MYR' },
  status: { type: String, default: 'ACTIVE' }
}, { timestamps: true });

const WhatsAppConfigModel = mongoose.models.WhatsAppConfig || mongoose.model('WhatsAppConfig', WhatsAppConfigSchema);

module.exports = WhatsAppConfigModel;
