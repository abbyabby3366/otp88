const dns = require('dns');
const mongoose = require('mongoose');
const { MONGODB_URI, ADMIN_USERNAME, ADMIN_PASSWORD, setGlobalRates, DEFAULT_GLOBAL_CARRIER_RATES } = require('./constants');
const { RateModel, UserModel } = require('../models');
const { hashPassword, isHashed } = require('../services/passwordService');

let isDbConnected = false;

function getIsDbConnected() {
  return isDbConnected;
}

/**
 * Seeds the default carrier rates only when the collection is empty, then loads the
 * stored rates into memory. Existing rows are never modified or deleted here.
 */
async function seedInitialRates() {
  try {
    const count = await RateModel.countDocuments();
    if (count === 0) {
      await RateModel.insertMany(DEFAULT_GLOBAL_CARRIER_RATES);
      console.log(' Seeded default carrier rates.');
    }
    const currentDbRates = await RateModel.find().lean();
    if (currentDbRates.length > 0) setGlobalRates(currentDbRates);
  } catch (e) {
    console.error('Error seeding rates:', e.message);
  }
}

/**
 * Ensures the administrator account exists with the ADMIN role and a hashed password.
 */
async function seedInitialAdmin() {
  try {
    const adminDoc = await UserModel.findOne({
      $or: [{ email: ADMIN_USERNAME.toLowerCase() }, { name: ADMIN_USERNAME }, { email: 'admin' }, { name: 'admin' }]
    });
    if (adminDoc) {
      let changed = false;
      if (adminDoc.role !== 'ADMIN') { adminDoc.role = 'ADMIN'; changed = true; }
      if (adminDoc.password && !isHashed(adminDoc.password)) {
        adminDoc.password = await hashPassword(adminDoc.password);
        changed = true;
      }
      if (changed) {
        await adminDoc.save();
        console.log(' Updated administrator account.');
      }
    } else {
      await UserModel.create({
        name: ADMIN_USERNAME,
        email: ADMIN_USERNAME.toLowerCase(),
        password: await hashPassword(ADMIN_PASSWORD),
        role: 'ADMIN',
        balanceUsd: 100.0,
        apiKeyLive: 'otp88_api_' + Math.random().toString(36).substring(2, 16) + '88',
        monthlyVolumeRemaining: 'Unlimited'
      });
      console.log(' Seeded administrator account.');
    }
  } catch (e) {
    console.error('Error syncing admin user:', e.message);
  }
}

async function connectDb() {
  if (!MONGODB_URI) {
    console.warn(' MONGODB_URI not provided; API keys, billing and sign-in are unavailable until it is set.');
    return false;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    isDbConnected = true;
    console.log(' MongoDB connected.');
    await seedInitialRates();
    await seedInitialAdmin();
  } catch (err) {
    if (err.message && err.message.includes('querySrv') && MONGODB_URI.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        await mongoose.connect(MONGODB_URI);
        isDbConnected = true;
        console.log(' MongoDB connected (via public DNS fallback).');
        await seedInitialRates();
        await seedInitialAdmin();
        return isDbConnected;
      } catch (retryErr) {
        console.warn(' MongoDB connection failed:', retryErr.message);
        return false;
      }
    }
    console.warn(' MongoDB connection failed:', err.message);
  }
  return isDbConnected;
}

module.exports = {
  connectDb,
  getIsDbConnected,
  seedInitialRates,
  seedInitialAdmin
};
