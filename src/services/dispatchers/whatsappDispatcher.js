const { getIsDbConnected } = require('../../config/db');
const { WhatsAppConfigModel } = require('../../models');
const { VERIFYWAY_API_KEY, VERIFYWAY_API_URL } = require('../../config/constants');
const { normalizePhoneNumber } = require('../../utils/format');

const REQUEST_TIMEOUT_MS = 8000;

async function getWhatsAppConfig() {
  let dbConfig = null;
  if (getIsDbConnected()) {
    try {
      dbConfig = await WhatsAppConfigModel.findOne({ key: 'whatsapp_verifyway_primary' }).lean();
    } catch (e) {
      console.warn('WhatsApp config lookup failed, using environment defaults:', e.message);
    }
  }
  return {
    apiKey: dbConfig?.apiKey || VERIFYWAY_API_KEY,
    apiUrl: dbConfig?.apiUrl || VERIFYWAY_API_URL,
    lang: dbConfig?.lang || 'en',
    fallback: dbConfig?.fallback || 'no',
    status: dbConfig?.status || 'ACTIVE',
    ratePerOtp: dbConfig?.ratePerOtp,
    raw: dbConfig
  };
}

/**
 * Sends an OTP through VerifyWay's WhatsApp channel.
 * Returns { success, ref, raw, error, latencyMs }.
 */
async function sendWhatsApp({ to, otpCode, lang, fallback, apiKey }) {
  const startedAt = Date.now();
  const cfg = await getWhatsAppConfig();
  const key = apiKey || cfg.apiKey;

  if (cfg.status !== 'ACTIVE') {
    return { success: false, error: 'WhatsApp gateway is paused by the administrator.', latencyMs: 0 };
  }
  if (!key) {
    return { success: false, error: 'WhatsApp gateway is not configured (missing VerifyWay API key).', latencyMs: 0 };
  }

  const recipient = normalizePhoneNumber(to);
  if (!recipient) {
    return { success: false, error: 'A valid recipient phone number is required.', latencyMs: 0 };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const resp = await fetch(cfg.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        recipient,
        type: 'otp',
        channel: 'whatsapp',
        code: String(otpCode),
        lang: lang || cfg.lang,
        fallback: fallback || cfg.fallback
      }),
      signal: controller.signal
    });
    clearTimeout(timer);
    const text = await resp.text();
    let raw;
    try { raw = JSON.parse(text); } catch (e) { raw = { raw: text }; }

    const ref = raw?.message_id || raw?.id || raw?.msgid || raw?.messageId || null;
    const okFlag = raw?.status === 'success' || raw?.status === 200 || raw?.code === 200;
    const accepted = resp.ok && (Boolean(ref) || okFlag);
    const latencyMs = Date.now() - startedAt;

    if (!accepted) {
      return {
        success: false,
        error: raw?.message || raw?.error || raw?.raw || `VerifyWay returned HTTP ${resp.status}`,
        raw,
        latencyMs
      };
    }
    return { success: true, ref: ref ? String(ref) : null, raw, latencyMs };
  } catch (err) {
    return {
      success: false,
      error: err.name === 'AbortError' ? 'VerifyWay request timed out.' : err.message,
      latencyMs: Date.now() - startedAt
    };
  }
}

module.exports = { sendWhatsApp, getWhatsAppConfig };
