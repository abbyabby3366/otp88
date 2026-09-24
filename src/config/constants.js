const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const PORT = process.env.PORT || 8884;

// Secrets & admin credentials. Defaults exist only for local development.
const DEFAULT_JWT_SECRET = 'otp88_dev_only_jwt_secret';
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
const MONGODB_URI = process.env.MONGODB_URI;

// Upstream provider credentials (env only; admin-saved DB config takes precedence at runtime)
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_DOMAIN_ID = process.env.RESEND_DOMAIN_ID || '';
const DEFAULT_EMAIL_FROM = process.env.EMAIL_FROM || 'OTP88 <noreply@otp88.top>';
const EMAIL_SENDER_DOMAIN = process.env.EMAIL_SENDER_DOMAIN || 'otp88.top';
const SMS360_APP_KEY = process.env.SMS360_APP_KEY || '';
const SMS360_APP_SECRET = process.env.SMS360_APP_SECRET || '';
const SMS360_SENDER_ID = process.env.SMS360_SENDER_ID || '66688';
const SMS360_SEND_URL = process.env.SMS360_SEND_URL || 'https://sms.360.my/gw/bulk360/v3_0/send.php';
const SMS360_BALANCE_URL = process.env.SMS360_BALANCE_URL || 'https://sms.360.my/api/balance/v3_0/getBalance';
const VERIFYWAY_API_KEY = process.env.VERIFYWAY_API_KEY || '';
const VERIFYWAY_API_URL = process.env.VERIFYWAY_API_URL || 'https://api.verifyway.com/api/v1/';

// Shared secret that upstream providers must include when calling our DLR webhooks
const DLR_WEBHOOK_SECRET = process.env.DLR_WEBHOOK_SECRET || '';

// Browser origins allowed to call the API cross-origin (comma separated). Same-origin is always allowed.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

// Channels the platform can actually deliver through today
const SUPPORTED_CHANNELS = ['whatsapp', 'sms', 'email'];

// Single source of truth for per-OTP fallback rates (USD)
const DEFAULT_CHANNEL_RATES = {
  whatsapp: 0.0075,
  telegram: 0.0035,
  sms: 0.0210,
  voice: 0.0240,
  email: 0.0020
};

// Default Global Carrier Rates (USD)
const DEFAULT_GLOBAL_CARRIER_RATES = [
  { country: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾', whatsapp: DEFAULT_CHANNEL_RATES.whatsapp, telegram: DEFAULT_CHANNEL_RATES.telegram, sms: DEFAULT_CHANNEL_RATES.sms, voice: 0.0240, avgLatency: '1.4s', successRate: '99.96%', directRoutes: ['Celcom', 'Digi', 'Maxis', 'U Mobile'] },
  { country: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬', whatsapp: DEFAULT_CHANNEL_RATES.whatsapp, telegram: DEFAULT_CHANNEL_RATES.telegram, sms: null, voice: 0.0280, avgLatency: '1.2s', successRate: '99.99%', directRoutes: ['Singtel', 'StarHub', 'M1'] },
  { country: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩', whatsapp: DEFAULT_CHANNEL_RATES.whatsapp, telegram: DEFAULT_CHANNEL_RATES.telegram, sms: null, voice: 0.0320, avgLatency: '1.6s', successRate: '99.91%', directRoutes: ['Telkomsel', 'Indosat', 'XL Axiata'] },
  { country: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭', whatsapp: DEFAULT_CHANNEL_RATES.whatsapp, telegram: DEFAULT_CHANNEL_RATES.telegram, sms: null, voice: 0.0270, avgLatency: '1.5s', successRate: '99.94%', directRoutes: ['AIS', 'TrueMove H', 'DTAC'] },
  { country: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳', whatsapp: DEFAULT_CHANNEL_RATES.whatsapp, telegram: DEFAULT_CHANNEL_RATES.telegram, sms: null, voice: 0.0310, avgLatency: '1.7s', successRate: '99.92%', directRoutes: ['Viettel', 'Vinaphone', 'MobiFone'] },
  { country: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭', whatsapp: DEFAULT_CHANNEL_RATES.whatsapp, telegram: DEFAULT_CHANNEL_RATES.telegram, sms: null, voice: 0.0300, avgLatency: '1.8s', successRate: '99.90%', directRoutes: ['Globe', 'Smart', 'DITO'] }
];

let GLOBAL_RATES = DEFAULT_GLOBAL_CARRIER_RATES;

function setGlobalRates(newRates) {
  GLOBAL_RATES = newRates;
}

function getGlobalRates() {
  return GLOBAL_RATES;
}

// Refuse to boot in production with development secrets.
function assertProductionConfig() {
  if (!IS_PRODUCTION) return;
  const problems = [];
  if (JWT_SECRET === DEFAULT_JWT_SECRET) problems.push('JWT_SECRET is not set');
  if (ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD) problems.push('ADMIN_PASSWORD is not set or still the default');
  if (!MONGODB_URI) problems.push('MONGODB_URI is not set');
  if (problems.length) {
    console.error('Refusing to start in production:\n - ' + problems.join('\n - '));
    process.exit(1);
  }
  if (!DLR_WEBHOOK_SECRET) {
    console.warn('DLR_WEBHOOK_SECRET is not set. Provider delivery reports are accepted without a token (recommended to set later).');
  }
}

module.exports = {
  IS_PRODUCTION,
  PORT,
  JWT_SECRET,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  MONGODB_URI,
  RESEND_API_KEY,
  RESEND_DOMAIN_ID,
  DEFAULT_EMAIL_FROM,
  EMAIL_SENDER_DOMAIN,
  SMS360_APP_KEY,
  SMS360_APP_SECRET,
  SMS360_SENDER_ID,
  SMS360_SEND_URL,
  SMS360_BALANCE_URL,
  VERIFYWAY_API_KEY,
  VERIFYWAY_API_URL,
  DLR_WEBHOOK_SECRET,
  ALLOWED_ORIGINS,
  SUPPORTED_CHANNELS,
  DEFAULT_CHANNEL_RATES,
  DEFAULT_GLOBAL_CARRIER_RATES,
  getGlobalRates,
  setGlobalRates,
  assertProductionConfig
};
