/* ==========================================================================
   Full API reference as Markdown, for pasting into an AI assistant.
   Kept in step with /docs.html and the backend at src/routes/otpRoutes.js.
   ========================================================================== */

function generateFullDocsMarkdown() {
  const baseUrl = (typeof getApiBaseUrl === 'function') ? getApiBaseUrl() : 'https://your-otp88-host/v1';
  const apiKey = (typeof getApiKey === 'function') ? getApiKey() : 'otp88_api_YOUR_API_KEY';

  return `# OTP88 API Reference (v1)

OTP88 sends one-time passcodes over WhatsApp, SMS and Email through a single endpoint.
You generate or supply the code, OTP88 delivers it and returns the code to you, and you
compare it with what the user types in. Delivery updates arrive on your webhook.

## Base URL and format
- Base URL: \`${baseUrl}\`
- JSON request and response bodies (\`Content-Type: application/json\`)
- Authentication: \`Authorization: Bearer ${apiKey}\` (API keys start with \`otp88_api_\`; find yours in the console under API & Keys)
- Rate limit: 120 sends per minute per API key. Exceeding it returns HTTP 429.

## POST /v1/otp/send
Sends one OTP. The balance is charged only when the provider accepts the message; failed deliveries are refunded automatically.

### Request fields
| Field | Type | Required | Description |
|---|---|---|---|
| \`to\` | string | yes | Phone number in international format (\`+60123456789\`), or an email address for the email channel. Local Malaysian numbers such as \`0123456789\` are accepted. |
| \`channel\` | string | yes | \`whatsapp\`, \`sms\` or \`email\`. If omitted and \`to\` is an email address, \`email\` is assumed. |
| \`otp\` | string | no | 4 to 8 digits. If omitted, a 6-digit code is generated for you. |
| \`codeLength\` | number | no | Length of the generated code, 4 to 8. Default 6. |
| \`senderName\` | string | no | Brand name shown in the SMS text and the email subject. Default \`FlashOTP\`. WhatsApp uses the provider's approved template. |
| \`expiryMinutes\` | number | no | Validity shown in the message. Default 5. OTP88 does not enforce expiry; your application does. |
| \`remark\` | string | no | Free-text reference (order id, session id). Stored with the log and echoed in webhooks. |
| \`brandName\` | string | email | Display name of the email sender. Falls back to the brand saved in the console. |
| \`brandHandle\` | string | email | Mailbox on the platform domain, e.g. \`myapp\` becomes \`myapp@otp88.top\`. Falls back to the handle saved in the console, then \`noreply\`. |
| \`replyTo\` | string | email | Reply-To address for the email. |
| \`subject\` | string | email | Custom subject. Default: \`<brandName> verification code: <otp>\`. |

Aliases still accepted for older integrations: \`phoneNumber\`, \`phone\`, \`email\`, \`recipient\` (for \`to\`); \`otpCode\`, \`code\` (for \`otp\`); \`sender_name\`, \`senderId\` (for \`senderName\`); \`expiry_minutes\`, \`expirySeconds\` (for \`expiryMinutes\`); \`brand_name\`, \`brand_handle\`, \`reply_to\`.

### Example request (SMS)
\`\`\`json
{
  "to": "+60123456789",
  "channel": "sms",
  "senderName": "MyApp",
  "otp": "882910",
  "expiryMinutes": 5,
  "remark": "login-4028"
}
\`\`\`

### Example request (Email)
\`\`\`json
{
  "to": "user@example.com",
  "channel": "email",
  "brandName": "MyApp",
  "brandHandle": "myapp",
  "replyTo": "support@myapp.com",
  "otp": "882910",
  "expiryMinutes": 5
}
\`\`\`

### Success response (HTTP 200)
\`\`\`json
{
  "success": true,
  "transactionId": "78-1633193001.0602",
  "to": "+60123456789",
  "phoneNumber": "+60123456789",
  "channel": "sms",
  "channelUsed": "SMS",
  "otpCode": "882910",
  "expiryMinutes": 5,
  "senderName": "MyApp",
  "messageText": "RM0 MyApp: Your verification code is 882910. Valid for 5 minutes.",
  "remark": "login-4028",
  "status": "SENT",
  "latency": "0.42s",
  "cost": "$0.0210",
  "deducted": 0.021,
  "newBalance": 48.979,
  "gatewayResponse": { "code": 200, "ref": "78-1633193001.0602" }
}
\`\`\`
For the email channel the response contains \`email\`, \`from\` (the sender actually used) and \`subject\` instead of \`phoneNumber\` and \`senderName\`.

### Verifying the code
There is no verify endpoint. Store \`otpCode\` (and \`transactionId\`) against the user's session on your server, then compare it with the code the user submits. Enforce your own expiry using \`expiryMinutes\`.

### Error responses
All errors have the shape \`{ "success": false, "error": "human readable message" }\`.

| HTTP | Meaning |
|---|---|
| 400 | Missing or invalid field. The message names the field. |
| 401 | Missing or invalid API key, or no billing account linked to the key. |
| 402 | Insufficient balance. The response also has \`currentBalance\` and \`required\`. |
| 403 | Account paused or suspended. |
| 429 | Rate limit exceeded. Retry after the \`Retry-After\` header. |
| 502 | The upstream provider rejected the message. Nothing was charged. \`gatewayResponse\` holds the provider's reply. |
| 503 | Database or account service temporarily unavailable. Retry shortly. |

## Webhooks
Set your webhook URL in the console (Webhooks page). OTP88 POSTs a JSON event when a message is sent and again when the provider reports delivery. Reply with any 2xx status within 6 seconds; failures are retried twice (after 2s and 6s).

Request headers: \`X-OTP88-Event\` (the event name) and \`X-OTP88-Delivery-Attempt\` (1 to 3).

\`\`\`json
{
  "event": "otp.delivered",
  "msgId": "78-1633193001.0602",
  "channel": "sms",
  "recipient": "+60123456789",
  "phoneNumber": "+60123456789",
  "status": "DELIVERED",
  "errorCode": "0",
  "remark": "login-4028",
  "cost": "0.0210",
  "currency": "USD",
  "timestamp": "2026-09-24T09:45:00.000Z"
}
\`\`\`

Events: \`otp.sent\`, \`otp.delivered\`, \`otp.read\` (WhatsApp only), \`otp.failed\`, \`otp.expired\`, \`otp.pending\`.
\`recipient\` holds the phone number or email address; \`phoneNumber\` carries the same value for older integrations.
Email deliveries report \`otp.sent\` when Resend accepts the message; there is no per-message delivery receipt for email.

## Channels and pricing
| Channel | Coverage | Price (USD per OTP) |
|---|---|---|
| WhatsApp | Global | from $0.0075 |
| SMS | Malaysia (+60) | $0.0210 |
| Email | Global | $0.0020 |

Live rates are available without authentication at \`GET ${baseUrl.replace('/v1', '')}/api/rates\`.

## Quick example (cURL)
\`\`\`bash
curl -X POST ${baseUrl}/otp/send \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "+60123456789", "channel": "whatsapp", "remark": "login-4028"}'
\`\`\`
`;
}

function copyFullDocsToAI(buttonElement) {
  const markdown = generateFullDocsMarkdown();
  navigator.clipboard.writeText(markdown).then(() => {
    const originalHtml = buttonElement ? buttonElement.innerHTML : '';
    if (buttonElement) {
      buttonElement.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary-emerald)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied</span>';
    }
    if (window.showToast) window.showToast('API reference copied as Markdown.');
    setTimeout(() => {
      if (buttonElement && originalHtml) buttonElement.innerHTML = originalHtml;
    }, 2500);
  }).catch(() => {
    if (window.showToast) window.showToast('Could not copy to clipboard', 'error');
  });
}

window.generateFullDocsMarkdown = generateFullDocsMarkdown;
window.copyFullDocsToAI = copyFullDocsToAI;
