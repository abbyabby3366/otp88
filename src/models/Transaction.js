const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  txId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String },
  userEmail: { type: String },
  type: { type: String, default: 'USAGE_OTP' }, // 'USAGE_OTP' | 'TOPUP' | 'ADMIN_CREDIT'
  category: { type: String, default: 'WhatsApp OTP' },
  description: { type: String, required: true },
  referenceId: { type: String, index: true },
  channel: { type: String },
  recipient: { type: String },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number },
  balanceAfter: { type: Number },
  status: { type: String, default: 'DELIVERED' },
  date: { type: String },
  time: { type: String }
}, { timestamps: true });

const TransactionModel = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

module.exports = TransactionModel;
