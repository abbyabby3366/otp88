const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const { getIsDbConnected } = require('../config/db');
const { UserModel, OtpLogModel, Sms360ConfigModel, WhatsAppConfigModel } = require('../models');
const { detectCountryCode } = require('../utils/format');
const { getOtpChannelCost, deductUserBalanceAndRecordTx } = require('../services/balanceService');

// 3. API: Live Interactive OTP Gateway & Real Upstream Dispatch (Writes to MongoDB + Live Balance Deduction)
router.post(['/api/simulate-otp', '/v1/otp/send'], async (req, res) => {
  const {
    phoneNumber: reqPhoneNumber,
    phone: reqPhone,
    to: reqTo,
    channel = 'whatsapp',
    otp: customOtpDirect,
    otpCode: customOtpCode,
    code: customCode,
    senderName: reqSenderName,
    sender_name: reqSender_name,
    senderId: reqSenderId,
    sender_id: reqSender_id,
    from: reqFrom,
    expiryMinutes: reqExpiryMinutes,
    expiry_minutes: reqExpiry_minutes,
    expirySeconds: reqExpirySeconds,
    expiry_seconds: reqExpiry_seconds,
    remark: reqRemark,
    codeLength = 6
  } = req.body;

  const phoneNumber = reqPhoneNumber || reqPhone || reqTo || '+60123456789';
  const senderName = reqSenderName || reqSender_name || reqSenderId || reqSender_id || reqFrom || 'Alibaba';
  const expiryMinutes = parseInt(reqExpiryMinutes || reqExpiry_minutes || (reqExpirySeconds ? Math.round(reqExpirySeconds / 60) : null) || (reqExpiry_seconds ? Math.round(reqExpiry_seconds / 60) : null) || 5, 10);

  // Use provided OTP code or auto-generate
  let otpCode = customOtpDirect || customOtpCode || customCode;
  if (!otpCode) {
    const min = Math.pow(10, codeLength - 1);
    const max = Math.pow(10, codeLength) - 1;
    otpCode = Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  const isWhatsApp = channel === 'whatsapp';
  const messageText = isWhatsApp
    ? `Your verification code is ${otpCode}.`
    : `Your ${senderName} verification code is ${otpCode}. Valid for ${expiryMinutes} minutes.`;

  // 1. Calculate dynamic cost based on destination country and channel
  const destCountry = detectCountryCode(phoneNumber);
  const { finalChannel, deliveryTimeMs, unitCostNum, unitCost } = await getOtpChannelCost(destCountry, channel);

  // 2. Extract calling user ID from Auth Header or API Key
  let authUserId = null;
  const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
  const isDbConnected = getIsDbConnected();

  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (token.startsWith('otp88_api_') || token.startsWith('otp_live_') || token.startsWith('api_')) {
      if (isDbConnected) {
        try {
          const user = await UserModel.findOne({
            $or: [
              { apiKeyLive: token },
              { apiKeyLive: token.replace('otp88_api_', 'otp_live_') },
              { apiKeyLive: token.replace('otp_live_', 'otp88_api_') },
              { apiKeyLive: token.replace(/^otp88_api_|^otp_live_|^api_/, '') }
            ]
          }).lean();
          if (user) authUserId = user._id.toString();
        } catch (e) {}
      }
    } else {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) authUserId = decoded.id;
      } catch (e) {}
    }
  }

  let upstreamRef = null;
  let upstreamResult = null;

  if (channel === 'sms') {
    // Dispatch real live SMS via Bulk360 API V3.0
    try {
      let dbSmsConfig = null;
      if (isDbConnected) {
        try { dbSmsConfig = await Sms360ConfigModel.findOne({ key: 'sms360_primary' }).lean(); } catch (e) {}
      }
      const user = dbSmsConfig?.appKey;
      const pass = dbSmsConfig?.appSecret;
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      const apiUrl = dbSmsConfig?.apiUrl || 'https://sms.360.my/gw/bulk360/v3_0/send.php';
      if (user && pass) {
        const sendUrl = `${apiUrl}?user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}&from=${encodeURIComponent(senderName)}&to=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(messageText)}&detail=1`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const resp = await fetch(sendUrl, { signal: controller.signal });
        clearTimeout(timeout);
        const rawText = await resp.text();
        try {
          upstreamResult = JSON.parse(rawText);
          if (upstreamResult && (upstreamResult.ref || upstreamResult.code === 200 || upstreamResult.code === '200')) {
            upstreamRef = upstreamResult.ref;
          }
        } catch (pe) {
          upstreamResult = { raw: rawText };
        }
      }
    } catch (gwErr) {
      console.error('Error dispatching live SMS via Bulk360:', gwErr.message);
    }
  } else if (channel === 'whatsapp') {
    try {
      let dbWaConfig = null;
      if (isDbConnected) {
        try { dbWaConfig = await WhatsAppConfigModel.findOne({ key: 'whatsapp_verifyway_primary' }).lean(); } catch (e) {}
      }
      const waApiKey = dbWaConfig?.apiKey;
      const waApiUrl = dbWaConfig?.apiUrl || 'https://api.verifyway.com/api/v1/';
      if (waApiKey) {
        const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber.replace(/[^0-9]/g, '');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const waResp = await fetch(waApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${waApiKey}`
          },
          body: JSON.stringify({
            recipient: cleanPhone,
            type: 'otp',
            channel: 'whatsapp',
            code: otpCode,
            lang: 'en'
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);
        const waData = await waResp.json().catch(() => ({}));
        if (waData && (waData.id || waData.msgid)) {
          upstreamRef = waData.id || waData.msgid;
          upstreamResult = waData;
        }
      }
    } catch (waErr) {
      console.error('Error dispatching WhatsApp OTP:', waErr.message);
    }
  }

  const txId = upstreamRef || ('tx_' + Math.random().toString(36).substring(2, 11));

  // 3. Real Backend Balance Deduction & Transaction Ledger Creation
  const balanceResult = await deductUserBalanceAndRecordTx({
    userId: authUserId,
    amount: unitCostNum,
    type: 'USAGE_OTP',
    category: finalChannel,
    description: `${finalChannel} to ${phoneNumber}`,
    referenceId: txId,
    channel: channel.toUpperCase(),
    recipient: phoneNumber,
    status: 'SENT'
  });

  if (!balanceResult.success) {
    return res.status(402).json({
      success: false,
      error: balanceResult.error,
      currentBalance: balanceResult.currentBalance,
      required: balanceResult.required,
      channel: finalChannel,
      rate: unitCost
    });
  }

  // Save OTP transaction record into MongoDB if connected
  let createdLog = null;
  const finalUserId = authUserId || (balanceResult.user ? balanceResult.user._id.toString() : null);
  if (isDbConnected) {
    try {
      createdLog = await OtpLogModel.create({
        phoneNumber,
        channel: finalChannel,
        otpCode,
        messageText,
        senderId: isWhatsApp ? 'WhatsApp Business' : senderName,
        msgId: txId,
        status: 'SENT',
        latency: `${(deliveryTimeMs / 1000).toFixed(1)}s`,
        cost: unitCost,
        remark: reqRemark || '',
        userId: finalUserId
      });
    } catch (err) {
      console.error('Error saving OTP log to MongoDB:', err.message);
    }
  }

  res.json({
    success: true,
    transactionId: txId,
    phoneNumber,
    otpCode,
    ...(isWhatsApp ? {} : { senderName, senderId: senderName, expiryMinutes }),
    messageText,
    remark: reqRemark || undefined,
    channelUsed: finalChannel,
    latency: `${(deliveryTimeMs / 1000).toFixed(1)}s`,
    cost: unitCost,
    deducted: unitCostNum,
    newBalance: balanceResult.balanceAfter,
    transaction: balanceResult.transaction || undefined,
    status: 'SENT',
    gatewayResponse: upstreamResult || undefined,
    logId: createdLog ? createdLog._id : undefined
  });
});

module.exports = router;
