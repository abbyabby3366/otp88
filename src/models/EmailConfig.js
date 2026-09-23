const mongoose = require('mongoose');

const EmailConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'email_resend_primary', unique: true },
  apiKey: { type: String, default: '' },
  fromEmail: { type: String, default: 'OTP88 <noreply@otp88.top>' },
  replyTo: { type: String, default: '' },
  subjectTemplate: { type: String, default: 'Your OTP88 Verification Code: {{otpCode}}' },
  ratePerOtp: { type: String, default: '0.0020' },
  currency: { type: String, default: 'USD' },
  status: { type: String, default: 'ACTIVE' },
  brandName: { type: String, default: 'OTP88' },
  supportEmail: { type: String, default: 'support@otp88.top' }
}, { timestamps: true });

const EmailConfigModel = mongoose.models.EmailConfig || mongoose.model('EmailConfig', EmailConfigSchema);

module.exports = EmailConfigModel;
