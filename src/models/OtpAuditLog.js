const mongoose = require('mongoose');

const OtpAuditLogSchema = new mongoose.Schema({
  auditId: { type: String, required: true },
  target: { type: String, required: true },
  channel: { type: String, required: true },
  action: { type: String, required: true },
  actor: { type: String, required: true },
  status: { type: String, default: 'SENT' },
  latency: { type: String, default: '0.8s' },
  time: { type: String },
  msgId: { type: String, index: true }
}, { timestamps: true });

const OtpAuditLogModel = mongoose.models.OtpAuditLog || mongoose.model('OtpAuditLog', OtpAuditLogSchema);

module.exports = OtpAuditLogModel;
