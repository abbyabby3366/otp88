const { RESEND_API_KEY, DEFAULT_EMAIL_FROM } = require('../config/constants');

/**
 * Generates modern, responsive HTML email template for OTP delivery
 */
function renderOtpEmailHtml({ otpCode, brandName = 'OTP88', expiryMinutes = 5, recipient = '' }) {
  const currentYear = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B0F19; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" style="max-width: 520px; background: #131B2E; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);">
          <!-- Header Bar -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid #1E293B;">
              <table role="presentation" align="center" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-right: 10px; vertical-align: middle;">
                    <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #10B981, #06B6D4); display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 36px; color: #060913; font-weight: 900; font-size: 18px;">
                      ⚡
                    </div>
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">
                      OTP<span style="color: #10B981;">88</span>
                    </span>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 14px; font-size: 13px; color: #94A3B8; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 600;">
                One-Time Authentication Passcode
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1; line-height: 1.6;">
                Use the verification code below to complete your authentication request. This code is confidential.
              </p>

              <!-- OTP Code Display Box -->
              <div style="margin: 28px 0; padding: 22px 16px; background: #0B1120; border: 1px solid #334155; border-radius: 12px; text-align: center;">
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #34D399; text-shadow: 0 0 12px rgba(52, 211, 153, 0.35); padding-left: 10px;">
                  ${otpCode}
                </div>
              </div>

              <!-- Expiry Badge -->
              <div style="display: inline-block; padding: 6px 14px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 20px; font-size: 12px; font-weight: 600; color: #FBBF24; margin-bottom: 24px;">
                ⏱ Valid for ${expiryMinutes} minutes
              </div>

              <!-- Security Warning -->
              <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid #1E293B; border-radius: 8px; padding: 14px 16px; text-align: left; font-size: 12px; color: #94A3B8; line-height: 1.5;">
                <strong style="color: #E2E8F0;">Security Tip:</strong> Never share this code with anyone. OTP88 or its representatives will never ask for your verification code.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px 28px 32px; background: #0F172A; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748B; line-height: 1.5;">
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
 * e.g. brandName = 'SuperApp', brandHandle = 'superapp' -> 'SuperApp <superapp@otp88.top>'
 */
function formatTenantSender({ brandName, brandHandle, explicitFrom, defaultFrom = DEFAULT_EMAIL_FROM }) {
  if (explicitFrom && explicitFrom.includes('@')) {
    const match = explicitFrom.match(/^(?:([^<]+)<)?([^>]+)>?$/);
    if (match) {
      const namePart = (match[1] || brandName || 'OTP88').trim();
      const addrPart = match[2].trim();
      if (addrPart.endsWith('@otp88.top')) {
        return `${namePart} <${addrPart}>`;
      }
      let cleanHandle = addrPart.split('@')[0].toLowerCase();
      cleanHandle = cleanHandle.replace(/\.otp88\.top$/i, '').replace(/[^a-z0-9_-]/g, '');
      if (cleanHandle) {
        return `${namePart} <${cleanHandle}@otp88.top>`;
      }
    }
  }

  if (brandHandle) {
    let cleanHandle = brandHandle.trim().toLowerCase();
    cleanHandle = cleanHandle.replace(/@otp88\.top$/i, '').replace(/\.otp88\.top$/i, '');
    cleanHandle = cleanHandle.replace(/[^a-z0-9_-]/g, '');
    const name = brandName ? brandName.trim() : 'OTP88';
    if (cleanHandle) {
      return `${name} <${cleanHandle}@otp88.top>`;
    }
  }

  if (brandName && brandName.trim()) {
    return `${brandName.trim()} <noreply@otp88.top>`;
  }

  return defaultFrom || 'OTP88 <noreply@otp88.top>';
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
  replyTo
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
    recipient: cleanRecipient
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

/**
 * Checks live domain status on Resend
 */
async function getResendDomainStatus(apiKey = RESEND_API_KEY, domainId = '110c5fe9-6024-4406-81fb-d7fb1061ca27') {
  try {
    const res = await fetch(`https://api.resend.com/domains/${domainId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey || RESEND_API_KEY}`
      }
    });
    if (!res.ok) {
      return { success: false, error: `Resend domains query failed with status ${res.status}` };
    }
    const data = await res.json();
    return { success: true, domain: data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  renderOtpEmailHtml,
  renderOtpEmailText,
  formatTenantSender,
  sendOtpEmail,
  getResendDomainStatus
};
