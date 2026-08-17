const mongoose = require('mongoose');

const RateSchema = new mongoose.Schema({
  country: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  dialCode: { type: String, required: true },
  flag: { type: String, default: '🌐' },
  whatsapp: { type: Number, default: 0.0075 },
  telegram: { type: Number, default: 0.0035 },
  sms: { type: Number, default: null }, // SMS supported only for Malaysia initially
  avgLatency: { type: String, default: '0.8s' },
  successRate: { type: String, default: '99.98%' },
  directRoutes: [String]
}, { timestamps: true });

const RateModel = mongoose.models.Rate || mongoose.model('Rate', RateSchema);

module.exports = RateModel;
