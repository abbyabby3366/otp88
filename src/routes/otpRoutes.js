const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const { getIsDbConnected } = require('../config/db');
const { UserModel, OtpLogModel, Sms360ConfigModel, WhatsAppConfigModel, EmailConfigModel } = require('../models');
const { detectCountryCode, normalizePhoneNumber } = require('../utils/format');
const { getOtpChannelCost, deductUserBalanceAndRecordTx } = require('../services/balanceService');
const { forwardDlrToClientWebhook } = require('../services/webhookService');
const { sendOtpEmail, formatTenantSender } = require('../services/emailService');
const { RESEND_API_KEY, DEFAULT_EMAIL_FROM } = require('../config/constants');

// 3. API: Live Interactive OTP Gateway & Real Upstream Dispatch (Writes to MongoDB + Live Balance Deduction)
router.post(['/api/simulate-otp', '/v1/otp/send'], async (req, res) => {
  const {
    phoneNumber: reqPhoneNumber,
    phone: reqPhone,
    to: reqTo,
    email: reqEmail,
    recipient: reqRecipient,
    subject: reqSubject,
    channel = 'whatsapp',
    otp: customOtpDirect,
    otpCode: customOtpCode,
    code: customCode,
    senderName: reqSenderName,
    sender_name: reqSender_name,
    senderId: reqSenderId,
    sender_id: reqSender_id,
    from: reqFrom,
    brand_handle: reqBrandHandle,
    brandHandle: reqBrandHandleCamel,
    sender_handle: reqSenderHandle,
    brand_name: reqBrandName,
    brandName: reqBrandNameCamel,
    reply_to: reqReplyTo,
    replyTo: reqReplyToCamel,
    expiryMinutes: reqExpiryMinutes,
    expiry_minutes: reqExpiry_minutes,
    expirySeconds: reqExpirySeconds,
    expiry_seconds: reqExpiry_seconds,
    remark: reqRemark,
    codeLength = 6
  } = req.body;

  const cleanChannel = (channel || 'whatsapp').toLowerCase();
  const rawTarget = reqEmail || reqRecipient || reqPhoneNumber || reqPhone || reqTo || '';
  const isEmail = cleanChannel.includes('email') || (rawTarget && rawTarget.includes('@'));
  const destinationTarget = isEmail
    ? rawTarget.trim().toLowerCase()
    : normalizePhoneNumber(rawTarget || '+60123456789');
  const phoneNumber = destinationTarget;
  const senderName = reqSenderName || reqSender_name || reqSenderId || reqSender_id || reqFrom || (isEmail ? 'OTP88' : 'FlashOTP');
  const expiryMinutes = parseInt(reqExpiryMinutes || reqExpiry_minutes || (reqExpirySeconds ? Math.round(reqExpirySeconds / 60) : null) || (reqExpiry_seconds ? Math.round(reqExpiry_seconds / 60) : null) || 5, 10);

  // Use provided OTP code or auto-generate
  let otpCode = customOtpDirect || customOtpCode || customCode;
  if (!otpCode) {
    const min = Math.pow(10, codeLength - 1);
    const max = Math.pow(10, codeLength) - 1;
    otpCode = Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  const isWhatsApp = cleanChannel.includes('whatsapp');
  let messageText = '';
  if (isEmail) {
    messageText = `Your ${senderName} verification code is ${otpCode}. Valid for ${expiryMinutes} minutes.`;
  } else if (isWhatsApp) {
    messageText = `Your verification code is ${otpCode}.`;
  } else if (cleanChannel.includes('sms')) {
    messageText = `RM0 ${senderName}: Your verification code is ${otpCode}. Valid for ${expiryMinutes} minutes.`;
  } else {
    messageText = `Your ${senderName} verification code is ${otpCode}. Valid for ${expiryMinutes} minutes.`;
  }

  // 1. Calculate dynamic cost based on destination country and channel
  const destCountry = isEmail ? 'GLOBAL' : detectCountryCode(phoneNumber);
  const { finalChannel, deliveryTimeMs, unitCostNum, unitCost } = await getOtpChannelCost(destCountry, isEmail ? 'email' : channel);

  // 2. Extract calling user ID from Auth Header or API Key
  let authUserId = null;
  let authUser = null;
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
          if (user) {
            authUser = user;
            authUserId = user._id.toString();
          }
        } catch (e) {}
      }
    } else {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) {
          authUserId = decoded.id;
          if (isDbConnected) {
            try { authUser = await UserModel.findById(authUserId).lean(); } catch (e) {}
          }
        }
      } catch (e) {}
    }
  }

  let upstreamRef = null;
  let upstreamResult = null;

  if (cleanChannel === 'sms') {
    // Dispatch real live SMS via Bulk360 API V3.0
    try {
      let dbSmsConfig = null;
      if (isDbConnected) {
        try { dbSmsConfig = await Sms360ConfigModel.findOne({ key: 'sms360_primary' }).lean(); } catch (e) {}
      }
      const user = dbSmsConfig?.appKey || 'KGRb4qxdBL';
      const pass = dbSmsConfig?.appSecret || 'NE4Ui9KcgxJJl8Y9NbJKhgCohsk6l71GzzBC1gya';
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      const apiUrl = dbSmsConfig?.apiUrl || 'https://sms.360.my/gw/bulk360/v3_0/send.php';
      const fromShortcode = dbSmsConfig?.senderId || '66688';

      if (user && pass) {
        const sendUrl = `${apiUrl}?user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}&from=${encodeURIComponent(fromShortcode)}&to=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(messageText)}&detail=1`;

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
  } else if ((channel || '').toLowerCase().includes('whatsapp')) {
    try {
      let dbWaConfig = null;
      if (isDbConnected) {
        try { dbWaConfig = await WhatsAppConfigModel.findOne({ key: 'whatsapp_verifyway_primary' }).lean(); } catch (e) {}
      }
      const waApiKey = dbWaConfig?.apiKey || '2764$2VWVFaAlG71xyEW5Q2WOn5FTnwc0QOJVI3H2';
      const waApiUrl = dbWaConfig?.apiUrl || 'https://api.verifyway.com/api/v1/';
      console.log('📱 Dispatching WhatsApp OTP to VerifyWay:', { cleanPhone: normalizePhoneNumber(phoneNumber), waApiKey: waApiKey ? (waApiKey.slice(0, 8) + '...') : 'missing', waApiUrl });
      if (waApiKey) {
        const cleanPhone = normalizePhoneNumber(phoneNumber);
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
        console.log('📱 VerifyWay Raw Response:', waData);
        if (waData && (waData.message_id || waData.id || waData.msgid || waData.messageId)) {
          upstreamRef = waData.message_id || waData.id || waData.msgid || waData.messageId;
          upstreamResult = waData;
        }
      }
    } catch (waErr) {
      console.error('❌ Error dispatching WhatsApp OTP:', waErr.message);
    }
  } else if (isEmail || cleanChannel === 'email') {
    try {
      let dbEmailConfig = null;
      if (isDbConnected) {
        try { dbEmailConfig = await EmailConfigModel.findOne({ key: 'email_resend_primary' }).lean(); } catch (e) {}
      }
      const effectiveApiKey = dbEmailConfig?.apiKey || RESEND_API_KEY;
      const defaultFrom = dbEmailConfig?.fromEmail || DEFAULT_EMAIL_FROM;

      // Custom Tenant Sub-Alias: resolve brand handle, name, and sender
      const resolvedBrandHandle = reqBrandHandle || reqBrandHandleCamel || reqSenderHandle || authUser?.emailBrandHandle;
      const resolvedBrandName = reqBrandName || reqBrandNameCamel || reqSenderName || reqSender_name || authUser?.emailBrandName || 'OTP88';
      const resolvedReplyTo = reqReplyTo || reqReplyToCamel || authUser?.emailReplyTo || dbEmailConfig?.replyTo;

      const formattedFrom = formatTenantSender({
        brandName: resolvedBrandName,
        brandHandle: resolvedBrandHandle,
        explicitFrom: reqFrom,
        defaultFrom
      });

      const effectiveSubject = reqSubject || `${resolvedBrandName} Verification Code: ${otpCode}`;

      console.log('📧 Dispatching Email OTP via Resend to:', destinationTarget, 'From:', formattedFrom);
      const emailResult = await sendOtpEmail({
        to: destinationTarget,
        otpCode,
        subject: effectiveSubject,
        senderName: resolvedBrandName,
        expiryMinutes,
        apiKey: effectiveApiKey,
        fromEmail: formattedFrom,
        replyTo: resolvedReplyTo
      });

      if (emailResult.messageId) {
        upstreamRef = emailResult.messageId;
      }
      upstreamResult = emailResult.response || { status: emailResult.success ? 'sent' : 'failed', fromUsed: emailResult.fromUsed };
    } catch (emlErr) {
      console.error('❌ Error dispatching Email OTP via Resend:', emlErr.message);
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
        senderId: isEmail ? (senderName || 'OTP88 Email') : (isWhatsApp ? 'WhatsApp Business' : senderName),
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

  // Trigger client webhook notification for the dispatched OTP
  forwardDlrToClientWebhook({
    msgId: txId,
    phoneNumber,
    channel: finalChannel,
    status: 'DELIVERED',
    errorCode: '0',
    cost: unitCost,
    userId: finalUserId
  });

  res.json({
    success: true,
    transactionId: txId,
    ...(isEmail ? { email: destinationTarget, recipient: destinationTarget } : { phoneNumber }),
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
