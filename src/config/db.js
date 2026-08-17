const mongoose = require('mongoose');
const { MONGODB_URI, ADMIN_USERNAME, ADMIN_PASSWORD, getGlobalRates, setGlobalRates, persistRatesToFile } = require('./constants');
const { RateModel, UserModel } = require('../models');

let isDbConnected = false;

function getIsDbConnected() {
  return isDbConnected;
}

// Auto-seed rates and ensure allowed countries exist in MongoDB without overwriting custom pricing
async function seedInitialRates() {
  try {
    const allowedCodes = ['MY', 'SG', 'ID', 'TH', 'VN', 'PH'];
    await RateModel.deleteMany({ code: { $nin: allowedCodes } });

    const globalRates = getGlobalRates();
    for (const r of globalRates) {
      if (!allowedCodes.includes(r.code)) continue;
      const existing = await RateModel.findOne({ code: r.code });
      if (!existing) {
        await RateModel.create(r);
      }
    }

    // Sync in-memory GLOBAL_RATES and rates.json with MongoDB Atlas
    const currentDbRates = await RateModel.find({ code: { $in: allowedCodes } }).lean();
    if (currentDbRates && currentDbRates.length > 0) {
      setGlobalRates(currentDbRates);
      persistRatesToFile(currentDbRates);
    }
    console.log(' Carrier rates successfully verified and synced with MongoDB Atlas & local store.');
  } catch (e) {
    console.error('Error seeding rates to MongoDB:', e.message);
  }
}

// Auto-seed and sync Admin user in MongoDB
async function seedInitialAdmin() {
  try {
    const adminQuery = {
      $or: [
        { email: 'admin' },
        { email: ADMIN_USERNAME.toLowerCase() },
        { name: 'admin' },
        { name: ADMIN_USERNAME }
      ]
    };
    const adminDoc = await UserModel.findOne(adminQuery);
    if (adminDoc) {
      if (adminDoc.role !== 'ADMIN') {
        adminDoc.role = 'ADMIN';
        await adminDoc.save();
        console.log(' Synced and updated admin account role to ADMIN in MongoDB Atlas.');
      }
    } else {
      await UserModel.create({
        name: ADMIN_USERNAME,
        email: ADMIN_USERNAME.toLowerCase(),
        password: ADMIN_PASSWORD,
        role: 'ADMIN',
        balanceUsd: 100.00,
        apiKeyLive: 'otp88_api_' + Math.random().toString(36).substring(2, 16) + '88',
        monthlyVolumeRemaining: 'Unlimited'
      });
      console.log(' Seeded default admin account into MongoDB Atlas.');
    }
  } catch (e) {
    console.error('Error syncing admin user to MongoDB:', e.message);
  }
}

async function connectDb() {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      isDbConnected = true;
      console.log(' MongoDB Atlas Connected successfully to opt88-cluster database!');
      await seedInitialRates();
      await seedInitialAdmin();
    } catch (err) {
      console.warn(' MongoDB Atlas connection warning (running in fallback mode):', err.message);
    }
  } else {
    console.warn(' MONGODB_URI not provided; server running in local fallback mode.');
  }
  return isDbConnected;
}

module.exports = {
  connectDb,
  getIsDbConnected,
  seedInitialRates,
  seedInitialAdmin
};
