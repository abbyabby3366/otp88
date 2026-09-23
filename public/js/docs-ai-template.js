/* ==========================================================================
   OTP88 Full Markdown Documentation Generator for AI / LLM Context
   ========================================================================== */

function generateFullDocsMarkdown() {
  const baseUrl = (typeof getApiBaseUrl === 'function') ? getApiBaseUrl() : 'http://localhost:8884/v1';
  const apiKey = (typeof getApiKey === 'function') ? getApiKey() : 'otp88_api_99882200aabbcc';
  const origin = (typeof getApiOrigin === 'function') ? getApiOrigin() : 'http://localhost:8884';

  return `# OTP88 Multi-Channel OTP Platform — Complete API Reference (v1)

> Developer reference for integrating OTP88 verification into any software application.
> Optimized for AI coding assistants and developers.

---

## 1. Base URL & Protocol
- **Base URL:** \`${baseUrl}\`
- **Current Server Origin:** \`${origin}\`
- **Protocol:** HTTPS (or HTTP for local testing)
- **Data Format:** JSON (\`Content-Type: application/json\`)

---

## 2. Authentication
Include your API Key in the HTTP \`Authorization\` header as a Bearer token:
\`\`\`http
Authorization: Bearer ${apiKey}
\`\`\`
*(Key prefixes: \`otp88_api_\` or \`otp_live_\`)*

---

## 3. Endpoints

### 3.1 Dispatch OTP (\`POST /v1/otp/send\`)
Dispatches a one-time verification passcode using your chosen channel or waterfall fallback.

- **Endpoint:** \`${baseUrl}/otp/send\` (or \`/api/simulate-otp\`)
- **Method:** \`POST\`
- **Headers:**
  - \`Authorization: Bearer <API_KEY>\`
  - \`Content-Type: application/json\`

#### Parameters:
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| \`to\` | string | **Yes** | — | Recipient phone in E.164 format (e.g. \`+60123456789\`) or email address (e.g. \`user@example.com\`) |
| \`channel_strategy\` | string | No | \`waterfall\` | Routing: \`waterfall\`, \`whatsapp\`, \`email\`, \`telegram\`, \`sms\`, \`voice\` |
| \`channels\` | string[] | No | \`["whatsapp","email","sms"]\` | Priority order for waterfall failover |
| \`sender_name\` | string | No | \`FlashOTP\` | Sender ID / Brand header (e.g. \`Alibaba\`) |
| \`otp\` | string | No | Auto-gen | Specific code. If omitted, a secure 6-digit code is generated |
| \`expiryMinutes\` | number | No | \`5\` | Validity duration in minutes |
| \`remark\` | string | No | \`\` | Tracking tag or order reference |

#### Sample Request:
\`\`\`json
{
  "to": "+60123456789",
  "channel_strategy": "waterfall",
  "channels": ["whatsapp", "telegram", "sms"],
  "sender_name": "Alibaba",
  "otp": "882910",
  "expiryMinutes": 5,
  "remark": "User login #4028"
}
\`\`\`

#### Success Response (\`200 OK\`):
\`\`\`json
{
  "success": true,
  "transactionId": "tx_live_8820a9bc4",
  "phoneNumber": "+60123456789",
  "otpCode": "882049",
  "channelUsed": "WhatsApp",
  "latency": "0.8s",
  "cost": "0.0500",
  "status": "SENT"
}
\`\`\`

---

### 3.2 Verify OTP Token (\`POST /v1/otp/verify\`)
Validates a user-entered passcode against the transaction record.

- **Endpoint:** \`${baseUrl}/otp/verify\`
- **Method:** \`POST\`
- **Headers:** \`Authorization: Bearer <API_KEY>\`, \`Content-Type: application/json\`

#### Request Payload:
\`\`\`json
{
  "transaction_id": "tx_live_8820a9bc4",
  "code": "882049"
}
\`\`\`

#### Response (\`200 OK\`):
\`\`\`json
{
  "success": true,
  "verified": true,
  "transactionId": "tx_live_8820a9bc4",
  "status": "VERIFIED",
  "message": "OTP verification successful"
}
\`\`\`

---

### 3.3 Query Delivery Status (\`GET /v1/otp/status\`)
Retrieve delivery state, carrier latency, and cost for a transaction.

- **Endpoint:** \`${baseUrl}/otp/status?transaction_id=tx_live_8820a9bc4\`
- **Method:** \`GET\`
- **Headers:** \`Authorization: Bearer <API_KEY>\`

#### Response (\`200 OK\`):
\`\`\`json
{
  "success": true,
  "transactionId": "tx_live_8820a9bc4",
  "phoneNumber": "+60123456789",
  "channel": "WHATSAPP",
  "status": "DELIVERED",
  "cost": "0.0500",
  "latency": "0.8s",
  "createdAt": "2026-09-17T09:45:00.000Z"
}
\`\`\`

---

## 4. Webhooks & DLR Events
Receive asynchronous callbacks when message state changes:

\`\`\`json
{
  "event": "otp.delivered",
  "msgId": "tx_live_8820a9bc4",
  "channel": "whatsapp",
  "phoneNumber": "+60123456789",
  "status": "DELIVERED",
  "cost": "0.0500",
  "currency": "USD",
  "latency": "0.8s",
  "timestamp": "2026-09-17T09:45:00.000Z"
}
\`\`\`
Status values: \`SENT\`, \`DELIVERED\`, \`READ\`, \`UNDELIVERED\`, \`FAILED\`, \`EXPIRED\`.

---

## 5. Error Codes
| HTTP Status | Error Status | Description |
|---|---|---|
| \`200 OK\` | \`SUCCESS\` | Dispatched / verified successfully |
| \`400 Bad Request\` | \`INVALID_PARAMETER\` | Missing parameter (\`to\`, \`code\`) |
| \`401 Unauthorized\` | \`INVALID_API_KEY\` | Missing or invalid API key |
| \`402 Payment Required\` | \`INSUFFICIENT_BALANCE\` | Insufficient balance for route |
| \`404 Not Found\` | \`RECORD_NOT_FOUND\` | Transaction ID not found |
| \`429 Too Many Requests\` | \`RATE_LIMIT_EXCEEDED\` | Rate limit exceeded |
| \`500 Server Error\` | \`GATEWAY_ERROR\` | Upstream carrier failure |

---

## 6. Integration Examples

### cURL
\`\`\`bash
curl -X POST ${baseUrl}/otp/send \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "+60123456789", "channel_strategy": "waterfall", "channels": ["whatsapp", "telegram", "sms"], "otp": "882910"}'
\`\`\`

### Node.js (Axios)
\`\`\`javascript
const axios = require('axios');
const res = await axios.post('${baseUrl}/otp/send', {
  to: '+60123456789',
  channel_strategy: 'waterfall',
  channels: ['whatsapp', 'telegram', 'sms'],
  otp: '882910'
}, {
  headers: { 'Authorization': 'Bearer ${apiKey}' }
});
console.log(res.data);
\`\`\`

### Python (Requests)
\`\`\`python
import requests
res = requests.post('${baseUrl}/otp/send', json={
    'to': '+60123456789',
    'channel_strategy': 'waterfall',
    'channels': ['whatsapp', 'telegram', 'sms'],
    'otp': '882910'
}, headers={'Authorization': 'Bearer ${apiKey}'})
print(res.json())
\`\`\`
`;
}

// Copy full documentation formatted for AI / LLMs
function copyFullDocsToAI(buttonElement) {
  const markdown = generateFullDocsMarkdown();
  navigator.clipboard.writeText(markdown).then(() => {
    const originalHtml = buttonElement ? buttonElement.innerHTML : '';
    if (buttonElement) {
      buttonElement.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary-emerald)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied for AI!</span>';
      buttonElement.style.borderColor = 'var(--primary-emerald)';
      buttonElement.style.color = 'var(--text-emerald)';
    }

    if (window.showToast) {
      window.showToast('Full API Docs copied to clipboard (ready for AI prompts)!');
    }

    setTimeout(() => {
      if (buttonElement && originalHtml) {
        buttonElement.innerHTML = originalHtml;
        buttonElement.style.borderColor = '';
        buttonElement.style.color = '';
      }
    }, 3000);
  }).catch(() => {
    if (window.showToast) {
      window.showToast('Failed to copy to clipboard', 'error');
    }
  });
}

window.generateFullDocsMarkdown = generateFullDocsMarkdown;
window.copyFullDocsToAI = copyFullDocsToAI;
