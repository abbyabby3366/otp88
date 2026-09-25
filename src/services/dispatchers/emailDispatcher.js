const { getIsDbConnected } = require('../../config/db');
const { EmailConfigModel } = require('../../models');
const { RESEND_API_KEY, DEFAULT_EMAIL_FROM } = require('../../config/constants');
const { sendOtpEmail, formatTenantSender } = require('../emailService');

async function getEmailConfig() {
  let dbConfig = null;
  if (getIsDbConnected()) {
    try {
      dbConfig = await EmailConfigModel.findOne({ key: 'email_resend_primary' }).lean();
    } catch (e) {
      console.warn('Email config lookup failed, using environment defaults:', e.message);
    }
  }
  return {
    apiKey: dbConfig?.apiKey || RESEND_API_KEY,
    fromEmail: dbConfig?.fromEmail || DEFAULT_EMAIL_FROM,
    replyTo: dbConfig?.replyTo || '',
    brandName: dbConfig?.brandName || 'OTP88',
    logoUrl: dbConfig?.logoUrl || '',
    status: dbConfig?.status || 'ACTIVE',
    ratePerOtp: dbConfig?.ratePerOtp,
    raw: dbConfig
  };
}

/**
 * Sends an OTP email through Resend using the tenant's branded sender.
 * Returns { success, ref, raw, error, latencyMs, fromUsed, subject }.
 */
async function sendEmail({ to, otpCode, subject, brandName, brandHandle, replyTo, explicitFrom, expiryMinutes, logoUrl }) {
  const cfg = await getEmailConfig();

  if (cfg.status !== 'ACTIVE') {
    return { success: false, error: 'Email gateway is paused by the administrator.', latencyMs: 0 };
  }

  const resolvedBrand = (brandName || '').trim() || cfg.brandName;
  const from = formatTenantSender({
    brandName: resolvedBrand,
    brandHandle,
    explicitFrom,
    defaultFrom: cfg.fromEmail
  });
  const effectiveSubject = subject || `${resolvedBrand} verification code: ${otpCode}`;

  const result = await sendOtpEmail({
    to,
    otpCode,
    subject: effectiveSubject,
    senderName: resolvedBrand,
    expiryMinutes,
    apiKey: cfg.apiKey,
    fromEmail: from,
    replyTo: replyTo || cfg.replyTo || undefined,
    logoUrl: logoUrl || cfg.logoUrl || undefined
  });

  return {
    success: result.success,
    ref: result.messageId || null,
    raw: result.response,
    error: result.error,
    latencyMs: result.latencyMs || 0,
    fromUsed: result.fromUsed || from,
    subject: effectiveSubject
  };
}

module.exports = { sendEmail, getEmailConfig };
