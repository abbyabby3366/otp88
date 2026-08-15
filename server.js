const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8884;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Global Rates Database
const GLOBAL_RATES = [
  {
    country: 'Malaysia',
    code: 'MY',
    dialCode: '+60',
    flag: '🇲🇾',
    whatsapp: 0.0075,
    telegram: 0.0035,
    sms: 0.0210,
    voice: 0.0240,
    legacySms: 0.0380,
    avgLatency: '1.4s',
    successRate: '99.96%',
    directRoutes: ['Celcom', 'Digi', 'Maxis', 'U Mobile']
  },
  {
    country: 'Singapore',
    code: 'SG',
    dialCode: '+65',
    flag: '🇸🇬',
    whatsapp: 0.0080,
    telegram: 0.0035,
    sms: 0.0240,
    voice: 0.0280,
    legacySms: 0.0450,
    avgLatency: '1.2s',
    successRate: '99.99%',
    directRoutes: ['Singtel', 'StarHub', 'M1']
  },
  {
    country: 'Indonesia',
    code: 'ID',
    dialCode: '+62',
    flag: '🇮🇩',
    whatsapp: 0.0070,
    telegram: 0.0035,
    sms: 0.0280,
    voice: 0.0320,
    legacySms: 0.0490,
    avgLatency: '1.6s',
    successRate: '99.91%',
    directRoutes: ['Telkomsel', 'Indosat', 'XL Axiata']
  },
  {
    country: 'Thailand',
    code: 'TH',
    dialCode: '+66',
    flag: '🇹🇭',
    whatsapp: 0.0085,
    telegram: 0.0035,
    sms: 0.0220,
    voice: 0.0270,
    legacySms: 0.0390,
    avgLatency: '1.5s',
    successRate: '99.94%',
    directRoutes: ['AIS', 'TrueMove H', 'DTAC']
  },
  {
    country: 'Vietnam',
    code: 'VN',
    dialCode: '+84',
    flag: '🇻🇳',
    whatsapp: 0.0090,
    telegram: 0.0035,
    sms: 0.0260,
    voice: 0.0310,
    legacySms: 0.0460,
    avgLatency: '1.7s',
    successRate: '99.92%',
    directRoutes: ['Viettel', 'Vinaphone', 'MobiFone']
  },
  {
    country: 'Philippines',
    code: 'PH',
    dialCode: '+63',
    flag: '🇵🇭',
    whatsapp: 0.0080,
    telegram: 0.0035,
    sms: 0.0250,
    voice: 0.0300,
    legacySms: 0.0440,
    avgLatency: '1.8s',
    successRate: '99.90%',
    directRoutes: ['Globe', 'Smart', 'DITO']
  },
  {
    country: 'United States',
    code: 'US',
    dialCode: '+1',
    flag: '🇺🇸',
    whatsapp: 0.0065,
    telegram: 0.0035,
    sms: 0.0085,
    voice: 0.0120,
    legacySms: 0.0195,
    avgLatency: '1.1s',
    successRate: '99.98%',
    directRoutes: ['AT&T', 'Verizon', 'T-Mobile']
  },
  {
    country: 'United Kingdom',
    code: 'GB',
    dialCode: '+44',
    flag: '🇬🇧',
    whatsapp: 0.0075,
    telegram: 0.0035,
    sms: 0.0290,
    voice: 0.0340,
    legacySms: 0.0520,
    avgLatency: '1.3s',
    successRate: '99.97%',
    directRoutes: ['EE', 'Vodafone', 'O2', 'Three']
  },
  {
    country: 'Australia',
    code: 'AU',
    dialCode: '+61',
    flag: '🇦🇺',
    whatsapp: 0.0080,
    telegram: 0.0035,
    sms: 0.0380,
    voice: 0.0420,
    legacySms: 0.0680,
    avgLatency: '1.4s',
    successRate: '99.95%',
    directRoutes: ['Telstra', 'Optus', 'TPG']
  },
  {
    country: 'India',
    code: 'IN',
    dialCode: '+91',
    flag: '🇮🇳',
    whatsapp: 0.0040,
    telegram: 0.0030,
    sms: 0.0065,
    voice: 0.0090,
    legacySms: 0.0150,
    avgLatency: '1.3s',
    successRate: '99.93%',
    directRoutes: ['Jio', 'Airtel', 'Vi']
  },
  {
    country: 'United Arab Emirates',
    code: 'AE',
    dialCode: '+971',
    flag: '🇦🇪',
    whatsapp: 0.0095,
    telegram: 0.0035,
    sms: 0.0390,
    voice: 0.0450,
    legacySms: 0.0720,
    avgLatency: '1.5s',
    successRate: '99.96%',
    directRoutes: ['e& (Etisalat)', 'du']
  },
  {
    country: 'Japan',
    code: 'JP',
    dialCode: '+81',
    flag: '🇯🇵',
    whatsapp: 0.0085,
    telegram: 0.0035,
    sms: 0.0480,
    voice: 0.0550,
    legacySms: 0.0890,
    avgLatency: '1.2s',
    successRate: '99.99%',
    directRoutes: ['NTT Docomo', 'KDDI', 'SoftBank']
  }
];

// 1. API: Get Global Rates & Country List
app.get('/api/rates', (req, res) => {
  const { search, channel } = req.query;
  let results = [...GLOBAL_RATES];

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      r =>
        r.country.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.dialCode.includes(q)
    );
  }

  res.json({
    success: true,
    total: results.length,
    data: results
  });
});

// 2. API: Dynamic Cost & Savings Calculator
app.post('/api/calculate-cost', (req, res) => {
  const {
    countryCode = 'MY',
    monthlyVolume = 50000,
    whatsappPct = 60,
    telegramPct = 15,
    smsPct = 20,
    voicePct = 5
  } = req.body;

  const rateInfo = GLOBAL_RATES.find(r => r.code === countryCode) || GLOBAL_RATES[0];
  const vol = Math.max(1000, parseInt(monthlyVolume, 10) || 50000);

  // Normalize percentages
  const totalPct = whatsappPct + telegramPct + smsPct + voicePct || 100;
  const wRatio = whatsappPct / totalPct;
  const tRatio = telegramPct / totalPct;
  const sRatio = smsPct / totalPct;
  const vRatio = voicePct / totalPct;

  // Volume tier discount
  let discountPct = 0;
  if (vol >= 1000000) discountPct = 0.20;
  else if (vol >= 500000) discountPct = 0.15;
  else if (vol >= 100000) discountPct = 0.10;
  else if (vol >= 25000) discountPct = 0.05;

  const costWhatsApp = vol * wRatio * rateInfo.whatsapp;
  const costTelegram = vol * tRatio * rateInfo.telegram;
  const costSms = vol * sRatio * rateInfo.sms;
  const costVoice = vol * vRatio * rateInfo.voice;

  const rawTotal = costWhatsApp + costTelegram + costSms + costVoice;
  const totalOtp88Cost = rawTotal * (1 - discountPct);

  // Compare with traditional Legacy SMS
  const legacySmsCost = vol * rateInfo.legacySms;
  const monthlySavings = Math.max(0, legacySmsCost - totalOtp88Cost);
  const savingsPct = Math.round((monthlySavings / legacySmsCost) * 100);

  res.json({
    success: true,
    country: rateInfo.country,
    currency: 'USD',
    volume: vol,
    discountTier: `${Math.round(discountPct * 100)}%`,
    breakdown: {
      whatsapp: {
        volume: Math.round(vol * wRatio),
        rate: rateInfo.whatsapp,
        subtotal: parseFloat(costWhatsApp.toFixed(2))
      },
      telegram: {
        volume: Math.round(vol * tRatio),
        rate: rateInfo.telegram,
        subtotal: parseFloat(costTelegram.toFixed(2))
      },
      sms: {
        volume: Math.round(vol * sRatio),
        rate: rateInfo.sms,
        subtotal: parseFloat(costSms.toFixed(2))
      },
      voice: {
        volume: Math.round(vol * vRatio),
        rate: rateInfo.voice,
        subtotal: parseFloat(costVoice.toFixed(2))
      }
    },
    totalMonthlyCost: parseFloat(totalOtp88Cost.toFixed(2)),
    legacySmsCost: parseFloat(legacySmsCost.toFixed(2)),
    monthlySavings: parseFloat(monthlySavings.toFixed(2)),
    annualSavings: parseFloat((monthlySavings * 12).toFixed(2)),
    savingsPercentage: savingsPct
  });
});

// 3. API: Live Interactive OTP Simulator
app.post('/api/simulate-otp', (req, res) => {
  const {
    phoneNumber = '+60123456789',
    channel = 'waterfall',
    senderId = 'OTP88_AUTH',
    codeLength = 6
  } = req.body;

  // Generate real 6-digit or requested digit OTP
  const min = Math.pow(10, codeLength - 1);
  const max = Math.pow(10, codeLength) - 1;
  const otpCode = Math.floor(min + Math.random() * (max - min + 1)).toString();
  const txId = 'tx_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

  const steps = [];
  let finalChannel = channel;
  let deliveryTimeMs = 1240;

  if (channel === 'waterfall') {
    steps.push({
      step: 1,
      channel: 'WhatsApp Official API',
      action: 'Checking WhatsApp account status & routing template...',
      status: 'DELIVERED',
      latency: '820ms',
      cost: '$0.0075'
    });
    finalChannel = 'WhatsApp';
    deliveryTimeMs = 820;
  } else if (channel === 'telegram') {
    steps.push({
      step: 1,
      channel: 'Telegram Gateway',
      action: 'Broadcasting via Telegram Bot Token...',
      status: 'DELIVERED',
      latency: '640ms',
      cost: '$0.0035'
    });
    deliveryTimeMs = 640;
  } else if (channel === 'sms') {
    steps.push({
      step: 1,
      channel: 'Direct Telco Tier-1 SMS',
      action: `Binding to SS7/SMPP gateway with Sender ID "${senderId}"...`,
      status: 'DELIVERED',
      latency: '1420ms',
      cost: '$0.0210'
    });
    deliveryTimeMs = 1420;
  } else if (channel === 'voice') {
    steps.push({
      step: 1,
      channel: 'High-Definition Voice OTP',
      action: 'Synthesizing dual-language voice prompt and dialing...',
      status: 'ANSWERED & READ',
      latency: '2100ms',
      cost: '$0.0240'
    });
    deliveryTimeMs = 2100;
  }

  res.json({
    success: true,
    transactionId: txId,
    phoneNumber,
    otpCode,
    senderId,
    channelUsed: finalChannel,
    latency: `${deliveryTimeMs}ms`,
    antiFraudCheck: {
      status: 'PASSED',
      riskScore: 3,
      aitDetected: false,
      ipCountryMatch: true
    },
    steps,
    expiresInSeconds: 300,
    messageContent: `[OTP88] Your verification code is ${otpCode}. Valid for 5 minutes. Never share this code with anyone.`
  });
});

// 4. API: Contact & Quotation Submissions
app.post('/api/contact', (req, res) => {
  const { name, email, company, monthlyVolume, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required.' });
  }

  res.json({
    success: true,
    message: 'Thank you for reaching out to OTP88! A dedicated CPaaS engineer will contact you within 15 minutes with customized pricing & free test credits.',
    leadId: 'LEAD_' + Math.random().toString(36).substring(2, 9).toUpperCase()
  });
});

// 5. API: Live CPaaS Edge Network Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ALL_SYSTEMS_OPERATIONAL',
    uptime: '99.989%',
    edgeNodes: [
      { node: 'AP-SOUTHEAST-1 (Singapore)', ping: '12ms', status: 'Optimal' },
      { node: 'AP-SOUTHEAST-2 (Kuala Lumpur)', ping: '14ms', status: 'Optimal' },
      { node: 'AP-EAST-1 (Hong Kong)', ping: '28ms', status: 'Optimal' },
      { node: 'US-WEST-1 (Silicon Valley)', ping: '74ms', status: 'Optimal' },
      { node: 'EU-CENTRAL-1 (Frankfurt)', ping: '88ms', status: 'Optimal' }
    ],
    activeChannels: {
      whatsapp: 'Operational (Latency 0.8s)',
      telegram: 'Operational (Latency 0.6s)',
      smsDirect: 'Operational (Latency 1.4s)',
      voiceOtp: 'Operational (Latency 2.1s)'
    }
  });
});

// Fallback to index.html for unknown HTML routes
app.get('*', (req, res, next) => {
  if (req.path.includes('.')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`====================================================`);
    console.log(`🚀 OTP88 Platform Server running on port ${port}`);
    console.log(`🌐 Open: http://localhost:${port}`);
    console.log(`====================================================`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(parseInt(PORT, 10));
