const { SUPPORTED_CHANNELS } = require('../../config/constants');
const { sendSms } = require('./smsDispatcher');
const { sendWhatsApp } = require('./whatsappDispatcher');
const { sendEmail } = require('./emailDispatcher');

// Display labels stored in logs and returned to API callers
const CHANNEL_LABELS = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'Email'
};

/**
 * Normalises a caller-supplied channel value to one of SUPPORTED_CHANNELS, or null.
 */
function normalizeChannel(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return null;
  if (v.includes('whatsapp') || v === 'wa') return 'whatsapp';
  if (v === 'sms' || v.includes('sms')) return 'sms';
  if (v.includes('email') || v === 'mail') return 'email';
  return SUPPORTED_CHANNELS.includes(v) ? v : null;
}

/**
 * Dispatches an OTP over the given channel. Every dispatcher returns the same shape:
 * { success, ref, raw, error, latencyMs }.
 */
async function dispatchOtp(channel, params) {
  switch (channel) {
    case 'sms': return sendSms(params);
    case 'whatsapp': return sendWhatsApp(params);
    case 'email': return sendEmail(params);
    default:
      return { success: false, error: `Unsupported channel "${channel}".`, latencyMs: 0 };
  }
}

module.exports = { dispatchOtp, normalizeChannel, CHANNEL_LABELS };
