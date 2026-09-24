const express = require('express');
const router = express.Router();
const { getIsDbConnected } = require('../config/db');
const { SUPPORTED_CHANNELS } = require('../config/constants');
const { OtpLogModel } = require('../models');
const { verifyJwtMiddleware, loadAuthenticatedUser } = require('../middleware/auth');
const { detectCountryCode, normalizePhoneNumber } = require('../utils/format');
const { getOtpChannelCost, deductUserBalanceAndRecordTx, refundUserBalance } = require('../services/balanceService');
const { forwardDlrToClientWebhook } = require('../services/webhookService');
const { dispatchOtp, normalizeChannel, CHANNEL_LABELS } = require('../services/dispatchers');
const { sendLimiter } = require('../middleware/rateLimit');

const DEFAULT_SENDER_NAME = 'FlashOTP';
const DEFAULT_EXPIRY_MINUTES = 5;

// Picks the first defined value from a list of request-body aliases.
function pick(body, ...keys) {
  for (const k of keys) {
    if (body[k] !== undefined && body[k] !== null && body[k] !== '') return body[k];
  }
  return undefined;
}

function generateOtp(length) {
  const len = Math.min(8, Math.max(4, parseInt(length, 10) || 6));
  const min = Math.pow(10, len - 1);
  const max = Math.pow(10, len) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

/**
 * Reads the request body into one canonical shape. Canonical names are camelCase;
 * the snake_case and legacy aliases documented in the API reference are accepted too.
 */
function parseSendRequest(body = {}) {
  const channel = normalizeChannel(pick(body, 'channel', 'channel_strategy'));
  const rawTo = pick(body, 'to', 'email', 'recipient', 'phoneNumber', 'phone_number', 'phone');
  const looksLikeEmail = typeof rawTo === 'string' && rawTo.includes('@');

  const expiryMinutesRaw = pick(body, 'expiryMinutes', 'expiry_minutes');
  const expirySecondsRaw = pick(body, 'expirySeconds', 'expiry_seconds');
  let expiryMinutes = parseInt(expiryMinutesRaw, 10);
  if (isNaN(expiryMinutes) && expirySecondsRaw) expiryMinutes = Math.round(parseInt(expirySecondsRaw, 10) / 60);
  if (isNaN(expiryMinutes) || expiryMinutes <= 0) expiryMinutes = DEFAULT_EXPIRY_MINUTES;

  return {
    channel: channel || (looksLikeEmail ? 'email' : null),
    rawTo: typeof rawTo === 'string' ? rawTo.trim() : rawTo,
    otp: pick(body, 'otp', 'otpCode', 'otp_code', 'code'),
    codeLength: pick(body, 'codeLength', 'code_length'),
    senderName: pick(body, 'senderName', 'sender_name', 'senderId', 'sender_id'),
    brandName: pick(body, 'brandName', 'brand_name'),
    brandHandle: pick(body, 'brandHandle', 'brand_handle', 'senderHandle', 'sender_handle'),
    replyTo: pick(body, 'replyTo', 'reply_to'),
    from: pick(body, 'from'),
    subject: pick(body, 'subject'),
    remark: pick(body, 'remark', 'reference'),
    expiryMinutes
  };
}

function buildMessageText({ channel, senderName, otpCode, expiryMinutes }) {
  if (channel === 'whatsapp') return `Your verification code is ${otpCode}.`;
  if (channel === 'sms') return `RM0 ${senderName}: Your verification code is ${otpCode}. Valid for ${expiryMinutes} minutes.`;
  return `Your ${senderName} verification code is ${otpCode}. Valid for ${expiryMinutes} minutes.`;
}

async function writeOtpLog(fields) {
  if (!getIsDbConnected()) return null;
  try {
    return await OtpLogModel.create(fields);
  } catch (err) {
    console.error('Error saving OTP log:', err.message);
    return null;
  }
}

/**
 * POST /v1/otp/send
 * Sends a one-time passcode over WhatsApp, SMS or Email.
 * Requires an API key (Authorization: Bearer otp88_api_...) or a console session token.
 */
router.post('/v1/otp/send', verifyJwtMiddleware, sendLimiter, async (req, res) => {
  const input = parseSendRequest(req.body);

  // 1. Validate the request
  if (!input.channel) {
    return res.status(400).json({
      success: false,
      error: `Unsupported or missing "channel". Supported channels: ${SUPPORTED_CHANNELS.join(', ')}.`,
      supportedChannels: SUPPORTED_CHANNELS
    });
  }
  if (!input.rawTo) {
    return res.status(400).json({ success: false, error: 'Recipient "to" is required (phone number in E.164 format, or an email address for the email channel).' });
  }

  const isEmail = input.channel === 'email';
  let destination;
  if (isEmail) {
    destination = String(input.rawTo).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) {
      return res.status(400).json({ success: false, error: 'A valid recipient email address is required for the email channel.' });
    }
  } else {
    destination = normalizePhoneNumber(input.rawTo);
    if (!destination || destination.replace(/\D/g, '').length < 7) {
      return res.status(400).json({ success: false, error: 'A valid recipient phone number is required (e.g. +60123456789).' });
    }
  }

  let otpCode = input.otp !== undefined ? String(input.otp).trim() : '';
  if (otpCode && !/^\d{4,8}$/.test(otpCode)) {
    return res.status(400).json({ success: false, error: '"otp" must be 4 to 8 digits when supplied.' });
  }
  if (!otpCode) otpCode = generateOtp(input.codeLength);

  const senderName = (input.senderName || (isEmail ? input.brandName : '') || DEFAULT_SENDER_NAME).toString().trim();
  const messageText = buildMessageText({ channel: input.channel, senderName, otpCode, expiryMinutes: input.expiryMinutes });

  // 2. Resolve the billing account
  const account = await loadAuthenticatedUser(req);
  if (!account) {
    return res.status(getIsDbConnected() ? 401 : 503).json({
      success: false,
      error: getIsDbConnected() ? 'No billing account is linked to these credentials.' : 'Account service unavailable. Please retry shortly.'
    });
  }
  if (account.status && account.status !== 'ACTIVE') {
    return res.status(403).json({ success: false, error: `Account is ${account.status.toLowerCase()}. Contact support.` });
  }
  const accountId = account._id.toString();

  // 3. Price the message and reserve the balance atomically
  const destCountry = isEmail ? 'GLOBAL' : detectCountryCode(destination);
  const cost = await getOtpChannelCost(destCountry, input.channel);
  const channelLabel = CHANNEL_LABELS[input.channel] || cost.finalChannel;
  const reservationRef = 'otp_' + Math.random().toString(36).substring(2, 12);

  const billing = await deductUserBalanceAndRecordTx({
    userId: accountId,
    amount: cost.unitCostNum,
    type: 'USAGE_OTP',
    category: `${channelLabel} OTP`,
    description: `${channelLabel} OTP to ${destination}`,
    referenceId: reservationRef,
    channel: input.channel.toUpperCase(),
    recipient: destination,
    status: 'SENT'
  });

  if (!billing.success) {
    const status = billing.code === 'INSUFFICIENT_BALANCE' ? 402 : (billing.code === 'DB_UNAVAILABLE' ? 503 : 401);
    return res.status(status).json({
      success: false,
      error: billing.error,
      currentBalance: billing.currentBalance,
      required: billing.required,
      channel: input.channel,
      rate: cost.unitCost
    });
  }

  // 4. Deliver through the upstream provider
  const dispatch = await dispatchOtp(input.channel, {
    to: destination,
    otpCode,
    messageText,
    senderName,
    expiryMinutes: input.expiryMinutes,
    subject: input.subject,
    brandName: input.brandName || (isEmail ? input.senderName : undefined) || account.emailBrandName || undefined,
    brandHandle: input.brandHandle || account.emailBrandHandle || undefined,
    replyTo: input.replyTo || account.emailReplyTo || undefined,
    explicitFrom: input.from
  });

  const transactionId = dispatch.ref || reservationRef;
  const latency = `${((dispatch.latencyMs || 0) / 1000).toFixed(2)}s`;

  if (!dispatch.success) {
    // Refund the reservation and keep a FAILED record for the customer's logs
    const refund = await refundUserBalance({
      userId: accountId,
      amount: cost.unitCostNum,
      referenceId: reservationRef,
      channel: channelLabel,
      recipient: destination,
      reason: dispatch.error
    });
    await writeOtpLog({
      phoneNumber: destination,
      channel: channelLabel,
      otpCode,
      messageText,
      senderId: senderName,
      msgId: transactionId,
      status: 'FAILED',
      errorCode: 'GATEWAY_ERROR',
      latency,
      cost: '$0.0000',
      remark: input.remark || '',
      userId: accountId
    });
    console.error(`[OTP Send] ${channelLabel} to ${destination} failed: ${dispatch.error}`);
    return res.status(502).json({
      success: false,
      error: `Delivery failed: ${dispatch.error || 'upstream gateway error'}. Your balance was not charged.`,
      channel: input.channel,
      transactionId,
      status: 'FAILED',
      newBalance: refund ? refund.balanceAfter : billing.balanceBefore,
      gatewayResponse: dispatch.raw || undefined
    });
  }

  // 5. Record the successful dispatch and notify the customer's webhook
  const createdLog = await writeOtpLog({
    phoneNumber: destination,
    channel: channelLabel,
    otpCode,
    messageText,
    senderId: isEmail ? (dispatch.fromUsed || senderName) : senderName,
    msgId: transactionId,
    status: 'SENT',
    errorCode: '0',
    latency,
    cost: cost.unitCost,
    remark: input.remark || '',
    userId: accountId
  });

  forwardDlrToClientWebhook({
    msgId: transactionId,
    phoneNumber: destination,
    channel: input.channel,
    status: 'SENT',
    errorCode: '0',
    cost: cost.unitCostNum.toFixed(4),
    userId: accountId
  });

  res.json({
    success: true,
    transactionId,
    to: destination,
    ...(isEmail ? { email: destination } : { phoneNumber: destination }),
    channel: input.channel,
    channelUsed: channelLabel,
    otpCode,
    expiryMinutes: input.expiryMinutes,
    ...(isEmail ? { from: dispatch.fromUsed, subject: dispatch.subject } : { senderName }),
    messageText,
    remark: input.remark || undefined,
    status: 'SENT',
    latency,
    cost: cost.unitCost,
    deducted: cost.unitCostNum,
    newBalance: billing.balanceAfter,
    gatewayResponse: dispatch.raw || undefined,
    logId: createdLog ? createdLog._id : undefined
  });
});

module.exports = router;
module.exports.parseSendRequest = parseSendRequest;
module.exports.buildMessageText = buildMessageText;
module.exports.generateOtp = generateOtp;
