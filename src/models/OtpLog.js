const mongoose = require('mongoose');

const OtpLogSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  channel: { type: String, required: true },
  otpCode: { type: String },
  messageText: { type: String },
  senderId: { type: String },
  segments: { type: Number, default: 1 },
  latency: { type: String },
  cost: { type: String },
  status: { type: String, default: 'SENT' },
  msgId: { type: String, index: true },
  errorCode: { type: String, default: '0' },
  remark: { type: String, default: '' },
  userId: { type: String }
}, { timestamps: true });

const OtpLogModel = mongoose.models.OtpLog || mongoose.model('OtpLog', OtpLogSchema);

module.exports = OtpLogModel;
