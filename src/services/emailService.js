const { RESEND_API_KEY, RESEND_DOMAIN_ID, DEFAULT_EMAIL_FROM, EMAIL_SENDER_DOMAIN } = require('../config/constants');
const { escapeRegex } = require('../utils/format');

// Matches a trailing "@otp88.top" or ".otp88.top" so handles can be pasted in either form
const DOMAIN_SUFFIX_RE = new RegExp('(@|\\.)' + escapeRegex(EMAIL_SENDER_DOMAIN) + '$', 'i');

/**
 * Generates modern, responsive HTML email template for OTP delivery
 */
function renderOtpEmailHtml({ otpCode, brandName = 'OTP88', expiryMinutes = 5, recipient = '', logoUrl = '' }) {
  const currentYear = new Date().getFullYear();

  let resolvedLogoUrl = logoUrl ? logoUrl.trim() : '';
  if (resolvedLogoUrl) {
    if (resolvedLogoUrl.includes('/uploads/logos/')) {
      const filename = resolvedLogoUrl.split('/uploads/logos/').pop().split('?')[0];
      resolvedLogoUrl = `https://ap-south-1.linodeobjects.com/x.neuronwww.com/otp88/logos/${filename}`;
    } else if (resolvedLogoUrl.startsWith('/')) {
      const baseUrl = (process.env.APP_BASE_URL || 'https://otp88.top').replace(/\/$/, '');
      resolvedLogoUrl = `${baseUrl}${resolvedLogoUrl}`;
    }
  }

  let brandHeaderHtml = '';
  if (resolvedLogoUrl) {
    brandHeaderHtml = `
      <table role="presentation" align="center" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
        <tr>
          <td align="center" style="vertical-align: middle;">
            <img src="${resolvedLogoUrl}" alt="${brandName}" style="max-height: 48px; max-width: 220px; height: auto; display: block; margin: 0 auto; object-fit: contain; border: 0;" />
          </td>
        </tr>
      </table>
    `;
  } else if (brandName && brandName.trim().toUpperCase() !== 'OTP88') {
    brandHeaderHtml = `
      <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #0F172A;" class="email-text-title">
        ${brandName.trim()}
      </div>
    `;
  } else {
    brandHeaderHtml = `
      <table role="presentation" align="center" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding-right: 10px; vertical-align: middle;">
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; width: 36px; height: 36px;">
              <defs>
                <linearGradient id="emailShieldGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#10B981"/>
                  <stop offset="50%" stop-color="#06B6D4"/>
                  <stop offset="100%" stop-color="#3B82F6"/>
                </linearGradient>
                <linearGradient id="emailShieldBg" x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#0F172A"/>
                  <stop offset="100%" stop-color="#020617"/>
                </linearGradient>
                <linearGradient id="emailBoltGrad" x1="12" y1="8" x2="28" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#34D399"/>
                  <stop offset="100%" stop-color="#38BDF8"/>
                </linearGradient>
              </defs>
              <path d="M20 3L34 8V18C34 26.5 28 34 20 37C12 34 6 26.5 6 18V8L20 3Z" fill="url(#emailShieldBg)" stroke="url(#emailShieldGrad)" stroke-width="2" stroke-linejoin="round"/>
              <path d="M22 8L12 21H19L17 32L28 19H21L22 8Z" fill="url(#emailBoltGrad)" stroke="#060913" stroke-width="0.8" stroke-linejoin="round"/>
            </svg>
          </td>
          <td style="vertical-align: middle;">
            <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #0F172A;" class="email-text-title">
              OTP<span style="color: #10B981;">88</span>
            </span>
          </td>
        </tr>
      </table>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} Verification Code</title>
  <style>
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #0B0F19 !important; }
      .email-card { background-color: #131B2E !important; border-color: #1E293B !important; }
      .email-text-title { color: #FFFFFF !important; }
      .email-text-body { color: #94A3B8 !important; }
      .email-code-box { background-color: #0B1120 !important; border-color: #334155 !important; }
      .email-code-text { color: #34D399 !important; }
      .email-tip-box { background-color: #0F172A !important; border-color: #1E293B !important; }
      .email-tip-title { color: #E2E8F0 !important; }
      .email-tip-text { color: #94A3B8 !important; }
      .email-footer-text { color: #64748B !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;" class="email-bg">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 16px;" class="email-bg">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" style="max-width: 480px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);" class="email-card">
          <!-- Header Bar -->
          <tr>
            <td style="padding: 28px 32px 24px 32px; text-align: center; border-bottom: 1px solid #F1F5F9;">
              ${brandHeaderHtml}
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center;">
              <h1 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #0F172A; letter-spacing: -0.3px;" class="email-text-title">
                Your Verification Code
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;" class="email-text-body">
                Use the verification code below to complete your authentication request. This code is confidential.
              </p>

              <!-- OTP Code Display Box -->
              <div style="margin: 22px 0 18px 0; padding: 20px 16px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; text-align: center;" class="email-code-box">
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0F172A; padding-left: 10px;" class="email-code-text">
                  ${otpCode}
                </div>
              </div>

              <!-- Expiry Badge with SVG Clock Icon -->
              <div style="display: inline-block; padding: 6px 14px; background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 20px; font-size: 12px; font-weight: 600; color: #92400E; margin-bottom: 22px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="display: inline-table; vertical-align: middle;">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 5px;">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#92400E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </td>
                    <td style="vertical-align: middle; font-size: 12px; font-weight: 600; color: #92400E;">
                      Valid for ${expiryMinutes} minutes
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Security Warning with SVG Lock Icon -->
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; text-align: left; font-size: 12px; color: #64748B; line-height: 1.5;" class="email-tip-box">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                  <tr>
                    <td style="width: 18px; vertical-align: top; padding-top: 1px; padding-right: 8px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </td>
                    <td style="vertical-align: top;">
                      <strong style="color: #0F172A;" class="email-tip-title">Security Tip:</strong> <span class="email-tip-text">Never share this code with anyone. ${brandName} or its representatives will never ask for your verification code.</span>
                      <div style="margin-top: 6px; font-size: 11px; color: #94A3B8;">
                        If you did not request this verification, please safely ignore this email.
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 32px 24px 32px; background: #F8FAFC; border-top: 1px solid #F1F5F9; text-align: center;" class="email-tip-box">
              <p style="margin: 0; font-size: 11px; color: #94A3B8; line-height: 1.6;" class="email-footer-text">
                This is an automated security email sent to ${recipient || 'your registered address'}.<br>
                &copy; ${currentYear} OTP88 CPaaS Platform. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates clean plaintext fallback
 */
function renderOtpEmailText({ otpCode, brandName = 'OTP88', expiryMinutes = 5 }) {
  return `${brandName} One-Time Passcode (OTP)\n\n` +
    `Your verification code is: ${otpCode}\n\n` +
    `Valid for ${expiryMinutes} minutes.\n\n` +
    `Never share this code with anyone. If you did not request this code, please ignore this email.\n\n` +
    `© ${new Date().getFullYear()} OTP88 Platform.`;
}

/**
 * Resolves and formats a custom tenant sub-alias sender
 * e.g. brandName = 'SuperApp', brandHandle = 'superapp' -> 'SuperApp <superapp@<EMAIL_SENDER_DOMAIN>>'
 */
function formatTenantSender({ brandName, brandHandle, explicitFrom, defaultFrom = DEFAULT_EMAIL_FROM }) {
  if (explicitFrom && explicitFrom.includes('@')) {
    const match = explicitFrom.match(/^(?:([^<]+)<)?([^>]+)>?$/);
    if (match) {
      const namePart = (match[1] || brandName || 'OTP88').trim();
      const addrPart = match[2].trim();
      if (addrPart.endsWith('@' + EMAIL_SENDER_DOMAIN)) {
        return `${namePart} <${addrPart}>`;
      }
      let cleanHandle = addrPart.split('@')[0].toLowerCase();
      cleanHandle = cleanHandle.replace(DOMAIN_SUFFIX_RE, '').replace(/[^a-z0-9_-]/g, '');
      if (cleanHandle) {
        return `${namePart} <${cleanHandle}@${EMAIL_SENDER_DOMAIN}>`;
      }
    }
  }

  if (brandHandle) {
    let cleanHandle = brandHandle.trim().toLowerCase();
    cleanHandle = cleanHandle.replace(DOMAIN_SUFFIX_RE, '');
    cleanHandle = cleanHandle.replace(/[^a-z0-9_-]/g, '');
    const name = brandName ? brandName.trim() : 'OTP88';
    if (cleanHandle) {
      return `${name} <${cleanHandle}@${EMAIL_SENDER_DOMAIN}>`;
    }
  }

  if (brandName && brandName.trim()) {
    return `${brandName.trim()} <noreply@${EMAIL_SENDER_DOMAIN}>`;
  }

  return defaultFrom || DEFAULT_EMAIL_FROM;
}

/**
 * Dispatches an Email OTP via Resend API
 */
async function sendOtpEmail({
  to,
  otpCode,
  subject,
  senderName = 'OTP88',
  senderHandle,
  expiryMinutes = 5,
  apiKey,
  fromEmail,
  replyTo,
  logoUrl
}) {
  const startT = Date.now();
  const cleanRecipient = (to || '').trim();
  if (!cleanRecipient || !cleanRecipient.includes('@')) {
    return {
      success: false,
      error: 'Valid recipient email address is required.',
      latencyMs: 0,
      latency: '0.0s'
    };
  }

  const effectiveApiKey = apiKey || RESEND_API_KEY;
  if (!effectiveApiKey) {
    return {
      success: false,
      error: 'Resend API key is missing. Please configure it in settings.',
      latencyMs: 0,
      latency: '0.0s'
    };
  }

  const primaryFrom = formatTenantSender({
    brandName: senderName,
    brandHandle: senderHandle,
    explicitFrom: fromEmail,
    defaultFrom: DEFAULT_EMAIL_FROM
  });
  const effectiveSubject = subject || `${senderName} Verification Code: ${otpCode}`;

  const htmlContent = renderOtpEmailHtml({
    otpCode,
    brandName: senderName,
    expiryMinutes,
    recipient: cleanRecipient,
    logoUrl
  });

  const textContent = renderOtpEmailText({
    otpCode,
    brandName: senderName,
    expiryMinutes
  });

  const makePayload = (fromAddress) => ({
    from: fromAddress,
    to: [cleanRecipient],
    subject: effectiveSubject,
    html: htmlContent,
    text: textContent,
    ...(replyTo ? { reply_to: replyTo } : {})
  });

  let lastResponse = null;
  let fromUsed = primaryFrom;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${effectiveApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(makePayload(primaryFrom)),
      signal: controller.signal
    });

    clearTimeout(timeout);
    lastResponse = await resp.json().catch(() => ({}));

    // If custom domain is not yet verified on Resend, gracefully try onboarding fallback
    if (!resp.ok && lastResponse?.message?.includes('domain is not verified')) {
      console.warn(`⚠️ [EmailService] Domain not verified yet on Resend. Trying sandbox fallback 'onboarding@resend.dev'...`);
      fromUsed = `${senderName} <onboarding@resend.dev>`;

      const fallbackController = new AbortController();
      const fbTimeout = setTimeout(() => fallbackController.abort(), 8000);

      resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(makePayload(fromUsed)),
        signal: fallbackController.signal
      });

      clearTimeout(fbTimeout);
      lastResponse = await resp.json().catch(() => ({}));
    }

    const durationMs = Date.now() - startT;
    const latencyStr = `${(durationMs / 1000).toFixed(2)}s`;

    if (resp.ok && (lastResponse?.id || lastResponse?.name !== 'validation_error')) {
      return {
        success: true,
        messageId: lastResponse.id || ('msg_resend_' + Math.random().toString(36).substring(2, 11)),
        latencyMs: durationMs,
        latency: latencyStr,
        response: lastResponse,
        fromUsed
      };
    } else {
      return {
        success: false,
        error: lastResponse?.message || `Resend returned HTTP ${resp.status}`,
        latencyMs: durationMs,
        latency: latencyStr,
        response: lastResponse,
        fromUsed
      };
    }
  } catch (err) {
    const durationMs = Date.now() - startT;
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Resend API connection timed out (8s limit)' : err.message,
      latencyMs: durationMs,
      latency: `${(durationMs / 1000).toFixed(2)}s`,
      fromUsed
    };
  }
}

const RESEND_API = 'https://api.resend.com';

async function resendGet(apiKey, path) {
  const res = await fetch(`${RESEND_API}${path}`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
  if (!res.ok) throw new Error(`Resend returned HTTP ${res.status} for ${path}`);
  return res.json();
}

/**
 * Finds the Resend domain record for our sending domain. Uses RESEND_DOMAIN_ID when set,
 * otherwise lists the account's domains and matches EMAIL_SENDER_DOMAIN by name.
 */
async function resolveResendDomain(apiKey, domainId = RESEND_DOMAIN_ID) {
  if (!apiKey) return { success: false, error: 'Resend API key is not configured' };
  try {
    if (domainId) {
      return { success: true, domain: await resendGet(apiKey, `/domains/${domainId}`) };
    }
    const list = await resendGet(apiKey, '/domains');
    const domains = Array.isArray(list?.data) ? list.data : [];
    const match = domains.find(d => String(d.name || '').toLowerCase() === EMAIL_SENDER_DOMAIN.toLowerCase());
    if (!match) {
      return { success: false, error: `${EMAIL_SENDER_DOMAIN} is not added to this Resend account yet` };
    }
    return { success: true, domain: await resendGet(apiKey, `/domains/${match.id}`) };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Reads the sending domain's verification status from Resend.
 */
async function getResendDomainStatus(apiKey = RESEND_API_KEY, domainId = RESEND_DOMAIN_ID) {
  return resolveResendDomain(apiKey, domainId);
}

/**
 * Asks Resend to re-scan the domain's DNS records, then returns the fresh status.
 */
async function triggerResendDomainVerification(apiKey = RESEND_API_KEY, domainId = RESEND_DOMAIN_ID) {
  const resolved = await resolveResendDomain(apiKey, domainId);
  if (!resolved.success) return resolved;
  try {
    const res = await fetch(`${RESEND_API}/domains/${resolved.domain.id}/verify`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    if (!res.ok) return { success: false, error: `Resend verification request failed with status ${res.status}` };
  } catch (e) {
    return { success: false, error: e.message };
  }
  return resolveResendDomain(apiKey, resolved.domain.id);
}

module.exports = {
  renderOtpEmailHtml,
  renderOtpEmailText,
  formatTenantSender,
  sendOtpEmail,
  getResendDomainStatus,
  triggerResendDomainVerification
};
