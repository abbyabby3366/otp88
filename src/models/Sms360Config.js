const mongoose = require('mongoose');

// Bulk360 (SMS360) gateway settings. Credentials are never defaulted here;
// they come from the admin console or the SMS360_APP_KEY / SMS360_APP_SECRET env vars.
const Sms360ConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'sms360_primary', unique: true },
  appKey: { type: String, default: '' },
  appSecret: { type: String, default: '' },
  apiKey: { type: String, default: '' },
  apiUrl: { type: String, default: 'https://sms.360.my/gw/bulk360/v3_0/send.php' },
  balanceUrl: { type: String, default: 'https://sms.360.my/api/balance/v3_0/getBalance' },
  senderId: { type: String, default: '66688' },
  webhookUrl: { type: String, default: '/api/webhooks/sms360/dlr' },
  ratePerSms: { type: String, default: '0.0210' },
  currency: { type: String, default: 'USD' },
  status: { type: String, default: 'ACTIVE' },
  autoFallback: { type: Boolean, default: true }
}, { timestamps: true });

const Sms360ConfigModel = mongoose.models.Sms360Config || mongoose.model('Sms360Config', Sms360ConfigSchema);

module.exports = Sms360ConfigModel;
