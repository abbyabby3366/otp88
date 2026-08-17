const mongoose = require('mongoose');

const WebhookLogSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  msgId: { type: String, index: true },
  event: { type: String, required: true },
  channel: { type: String },
  targetUrl: { type: String, required: true },
  httpStatus: { type: Number },
  statusText: { type: String },
  payload: { type: Object },
  attempts: { type: Number, default: 1 },
  success: { type: Boolean, default: false },
  latencyMs: { type: Number, default: 0 },
  error: { type: String }
}, { timestamps: true });

const WebhookLogModel = mongoose.models.WebhookLog || mongoose.model('WebhookLog', WebhookLogSchema);

module.exports = WebhookLogModel;
