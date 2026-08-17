const mongoose = require('mongoose');

const Sms360ConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'sms360_primary', unique: true },
  appKey: { type: String, default: 'KGRb4qxdBL' },
  appSecret: { type: String, default: 'NE4Ui9KcgxJJl8Y9NbJKhgCohsk6l71GzzBC1gya' },
  apiKey: { type: String, default: 'KGRb4qxdBL' },
  apiUrl: { type: String, default: 'https://sms.360.my/gw/bulk360/v3_0/send.php' },
  balanceUrl: { type: String, default: 'https://sms.360.my/api/balance/v3_0/getBalance' },
  senderId: { type: String, default: '66688' },
  webhookUrl: { type: String, default: 'https://api.otp88.com/api/webhooks/sms360/dlr' },
  ratePerSms: { type: String, default: '0.0210' },
  currency: { type: String, default: 'MYR' },
  status: { type: String, default: 'ACTIVE' },
  autoFallback: { type: Boolean, default: true }
}, { timestamps: true });

const Sms360ConfigModel = mongoose.models.Sms360Config || mongoose.model('Sms360Config', Sms360ConfigSchema);

module.exports = Sms360ConfigModel;
