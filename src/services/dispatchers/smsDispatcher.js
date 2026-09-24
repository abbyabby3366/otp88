const { getIsDbConnected } = require('../../config/db');
const { Sms360ConfigModel } = require('../../models');
const {
  SMS360_APP_KEY,
  SMS360_APP_SECRET,
  SMS360_SENDER_ID,
  SMS360_SEND_URL,
  SMS360_BALANCE_URL
} = require('../../config/constants');

const REQUEST_TIMEOUT_MS = 8000;

/**
 * Resolves Bulk360 gateway settings: admin-saved DB config first, env vars second.
 */
async function getSmsConfig() {
  let dbConfig = null;
  if (getIsDbConnected()) {
    try {
      dbConfig = await Sms360ConfigModel.findOne({ key: 'sms360_primary' }).lean();
    } catch (e) {
      console.warn('SMS config lookup failed, using environment defaults:', e.message);
    }
  }
  return {
    appKey: dbConfig?.appKey || SMS360_APP_KEY,
    appSecret: dbConfig?.appSecret || SMS360_APP_SECRET,
    senderId: dbConfig?.senderId || SMS360_SENDER_ID,
    sendUrl: dbConfig?.apiUrl || SMS360_SEND_URL,
    balanceUrl: dbConfig?.balanceUrl || SMS360_BALANCE_URL,
    status: dbConfig?.status || 'ACTIVE',
    ratePerSms: dbConfig?.ratePerSms,
    raw: dbConfig
  };
}

/**
 * Sends one SMS through Bulk360 v3.0.
 * Returns { success, ref, raw, error, latencyMs }.
 */
async function sendSms({ to, messageText, senderId, appKey, appSecret }) {
  const startedAt = Date.now();
  const cfg = await getSmsConfig();
  const user = appKey || cfg.appKey;
  const pass = appSecret || cfg.appSecret;
  const from = senderId || cfg.senderId;

  if (cfg.status !== 'ACTIVE') {
    return { success: false, error: 'SMS gateway is paused by the administrator.', latencyMs: 0 };
  }
  if (!user || !pass) {
    return { success: false, error: 'SMS gateway is not configured (missing Bulk360 app key or secret).', latencyMs: 0 };
  }

  const digits = String(to || '').replace(/[^0-9]/g, '');
  if (!digits) {
    return { success: false, error: 'A valid recipient phone number is required.', latencyMs: 0 };
  }

  const params = new URLSearchParams({
    user,
    pass,
    from,
    to: digits,
    text: messageText,
    detail: '1'
  });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const resp = await fetch(`${cfg.sendUrl}?${params.toString()}`, { signal: controller.signal });
    clearTimeout(timer);
    const text = await resp.text();
    let raw;
    try { raw = JSON.parse(text); } catch (e) { raw = { raw: text }; }

    const code = raw && (raw.code !== undefined ? String(raw.code) : '');
    const accepted = resp.ok && (Boolean(raw?.ref) || code === '200');
    const latencyMs = Date.now() - startedAt;

    if (!accepted) {
      return {
        success: false,
        error: raw?.desc || raw?.message || raw?.raw || `Bulk360 returned HTTP ${resp.status}`,
        raw,
        latencyMs
      };
    }
    return { success: true, ref: raw.ref ? String(raw.ref) : null, raw, latencyMs };
  } catch (err) {
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Bulk360 request timed out.' : err.message,
      latencyMs: Date.now() - startedAt
    };
  }
}

module.exports = { sendSms, getSmsConfig };
