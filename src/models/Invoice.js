const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  invoiceId: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  amount: { type: String, required: true },
  method: { type: String, required: true },
  status: { type: String, default: 'PAID' }
}, { timestamps: true });

const InvoiceModel = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);

module.exports = InvoiceModel;
