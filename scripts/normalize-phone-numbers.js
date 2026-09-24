/**
 * One-off maintenance script: rewrites historical OTP log and audit records so every
 * phone number is stored in international format (+60...).
 *
 * Usage:  node scripts/normalize-phone-numbers.js
 * Requires MONGODB_URI in the environment (or .env).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../src/config/constants');
const { OtpLogModel, OtpAuditLogModel } = require('../src/models');
const { normalizePhoneNumber } = require('../src/utils/format');

async function run() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);

  let updated = 0;
  const logs = await OtpLogModel.find({ phoneNumber: { $exists: true, $ne: null, $not: /^\+|@/ } }).lean();
  for (const log of logs) {
    const normalized = normalizePhoneNumber(log.phoneNumber);
    if (normalized && normalized !== log.phoneNumber) {
      await OtpLogModel.updateOne({ _id: log._id }, { $set: { phoneNumber: normalized } });
      updated++;
    }
  }

  const audits = await OtpAuditLogModel.find({ target: { $exists: true, $ne: null, $not: /^\+|@/ } }).lean();
  for (const aud of audits) {
    if (!/[0-9]{7,}/.test(aud.target)) continue;
    const normalized = normalizePhoneNumber(aud.target);
    if (normalized && normalized !== aud.target) {
      await OtpAuditLogModel.updateOne({ _id: aud._id }, { $set: { target: normalized } });
      updated++;
    }
  }

  console.log(`Normalized ${updated} record(s).`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
