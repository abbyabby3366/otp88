const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, sparse: true },
  phone: { type: String, sparse: true },
  password: { type: String },
  name: { type: String },
  role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
  status: { type: String, enum: ['ACTIVE', 'PAUSED', 'SUSPENDED'], default: 'ACTIVE' },
  balanceUsd: { type: Number, default: 50.00 },
  apiKeyLive: { type: String },
  webhookUrl: { type: String, default: '' },
  remark: { type: String, default: '' },
  monthlyVolumeRemaining: { type: String, default: '100,000' }
}, { timestamps: true });

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = UserModel;
