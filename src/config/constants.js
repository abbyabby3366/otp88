const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 8884;
const JWT_SECRET = process.env.JWT_SECRET || 'otp88_jwt_secret_key_secure_2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const MONGODB_URI = process.env.MONGODB_URI;

// Default Global Carrier Rates
const DEFAULT_GLOBAL_CARRIER_RATES = [
  { country: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾', whatsapp: 0.05, telegram: 0.0035, sms: 0.0210, voice: 0.0240, avgLatency: '1.4s', successRate: '99.96%', directRoutes: ['Celcom', 'Digi', 'Maxis', 'U Mobile'] },
  { country: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬', whatsapp: 0.05, telegram: 0.0035, sms: null, voice: 0.0280, avgLatency: '1.2s', successRate: '99.99%', directRoutes: ['Singtel', 'StarHub', 'M1'] },
  { country: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩', whatsapp: 0.05, telegram: 0.0035, sms: null, voice: 0.0320, avgLatency: '1.6s', successRate: '99.91%', directRoutes: ['Telkomsel', 'Indosat', 'XL Axiata'] },
  { country: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭', whatsapp: 0.05, telegram: 0.0035, sms: null, voice: 0.0270, avgLatency: '1.5s', successRate: '99.94%', directRoutes: ['AIS', 'TrueMove H', 'DTAC'] },
  { country: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳', whatsapp: 0.05, telegram: 0.0035, sms: null, voice: 0.0310, avgLatency: '1.7s', successRate: '99.92%', directRoutes: ['Viettel', 'Vinaphone', 'MobiFone'] },
  { country: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭', whatsapp: 0.05, telegram: 0.0035, sms: null, voice: 0.0300, avgLatency: '1.8s', successRate: '99.90%', directRoutes: ['Globe', 'Smart', 'DITO'] }
];

let GLOBAL_RATES = DEFAULT_GLOBAL_CARRIER_RATES;

function setGlobalRates(newRates) {
  GLOBAL_RATES = newRates;
}

function getGlobalRates() {
  return GLOBAL_RATES;
}

module.exports = {
  PORT,
  JWT_SECRET,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  MONGODB_URI,
  DEFAULT_GLOBAL_CARRIER_RATES,
  getGlobalRates,
  setGlobalRates
};
