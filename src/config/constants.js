const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 8884;
const JWT_SECRET = process.env.JWT_SECRET || 'otp88_jwt_secret_key_secure_2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const MONGODB_URI = process.env.MONGODB_URI;

// Global Rates Fallback & Disk Persistence
let GLOBAL_RATES = [];
try {
  GLOBAL_RATES = require('../../data/rates.json');
} catch (e) {
  GLOBAL_RATES = [];
}

function persistRatesToFile(rates) {
  try {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(dataDir, 'rates.json'), JSON.stringify(rates, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist rates to data/rates.json:', err.message);
  }
}

function setGlobalRates(newRates) {
  GLOBAL_RATES = newRates;
}

function getGlobalRates() {
  return GLOBAL_RATES;
}

// Global Gateway In-Memory / Fallback Configs
let SMS360_CONFIG = {
  appKey: 'KGRb4qxdBL',
  appSecret: 'NE4Ui9KcgxJJl8Y9NbJKhgCohsk6l71GzzBC1gya',
  apiKey: 'KGRb4qxdBL',
  apiUrl: 'https://sms.360.my/gw/bulk360/v3_0/send.php',
  balanceUrl: 'https://sms.360.my/api/balance/v3_0/getBalance',
  senderId: '66688',
  webhookUrl: 'https://api.otp88.com/api/webhooks/sms360/dlr',
  ratePerSms: '0.0210',
  currency: 'MYR',
  status: 'ACTIVE',
  autoFallback: true
};

let WHATSAPP_CONFIG = {
  apiKey: '',
  apiUrl: 'https://api.verifyway.com/api/v1/',
  channel: 'whatsapp',
  fallback: 'no',
  lang: 'en',
  webhookUrl: 'https://api.otp88.com/api/webhooks/whatsapp/dlr',
  ratePerOtp: '0.0075',
  currency: 'MYR',
  status: 'ACTIVE'
};

function getSms360Config() {
  return SMS360_CONFIG;
}

function setSms360Config(cfg) {
  SMS360_CONFIG = { ...SMS360_CONFIG, ...cfg };
  return SMS360_CONFIG;
}

function getWhatsAppConfig() {
  return WHATSAPP_CONFIG;
}

function setWhatsAppConfig(cfg) {
  WHATSAPP_CONFIG = { ...WHATSAPP_CONFIG, ...cfg };
  return WHATSAPP_CONFIG;
}

module.exports = {
  PORT,
  JWT_SECRET,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  MONGODB_URI,
  getGlobalRates,
  setGlobalRates,
  persistRatesToFile,
  getSms360Config,
  setSms360Config,
  getWhatsAppConfig,
  setWhatsAppConfig
};
