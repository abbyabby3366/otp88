const mongoose = require('mongoose');

const ContactLeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String },
  monthlyVolume: { type: String },
  message: { type: String },
  leadId: { type: String }
}, { timestamps: true });

const ContactLeadModel = mongoose.models.ContactLead || mongoose.model('ContactLead', ContactLeadSchema);

module.exports = ContactLeadModel;
