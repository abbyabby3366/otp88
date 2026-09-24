// Code snippets for the console's "API & Keys" page. Field names here are the
// canonical ones documented at /docs.html; the backend also accepts snake_case aliases.

export const SAMPLE_PAYLOADS = {
  whatsapp: {
    to: '+60123456789',
    channel: 'whatsapp',
    otp: '882910',
    remark: 'login-4028'
  },
  sms: {
    to: '+60123456789',
    channel: 'sms',
    senderName: 'MyApp',
    otp: '882910',
    expiryMinutes: 5,
    remark: 'login-4028'
  },
  email: {
    to: 'user@example.com',
    channel: 'email',
    brandName: 'MyApp',
    brandHandle: 'myapp',
    replyTo: 'support@myapp.com',
    otp: '882910',
    expiryMinutes: 5,
    remark: 'login-4028'
  }
};

export function getSendPayload(channel, phone) {
  const base = SAMPLE_PAYLOADS[channel] || SAMPLE_PAYLOADS.whatsapp;
  if (channel !== 'email' && phone) return { ...base, to: phone };
  return { ...base };
}

export function getCodeSnippet({ origin, apiKey, channel, lang, phone = '+60123456789' }) {
  const url = `${origin}/v1/otp/send`;
  const payloadObj = getSendPayload(channel, phone);
  const jsonStr = JSON.stringify(payloadObj, null, 2);

  if (lang === 'curl') {
    return `curl -X POST ${url} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payloadObj)}'`;
  }

  if (lang === 'node') {
    return `// Node.js 18+ (built-in fetch)
const response = await fetch('${url}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${jsonStr.split('\n').join('\n  ')})
});

const data = await response.json();
if (!data.success) throw new Error(data.error);

// Store data.otpCode against the user's session, then compare it with what they type in.
console.log(data.transactionId, data.otpCode, data.status);`;
  }

  if (lang === 'python') {
    const pyPayload = JSON.stringify(payloadObj, null, 4).replace(/: true/g, ': True').replace(/: false/g, ': False');
    return `# Python 3 (requests)
import requests

response = requests.post(
    "${url}",
    headers={"Authorization": "Bearer ${apiKey}"},
    json=${pyPayload.split('\n').join('\n    ')},
    timeout=15,
)
data = response.json()
if not data["success"]:
    raise RuntimeError(data["error"])

# Store data["otpCode"] against the user's session, then compare it with what they type in.
print(data["transactionId"], data["otpCode"], data["status"])`;
  }

  if (lang === 'php') {
    return `<?php
// PHP 8 (cURL)
$ch = curl_init('${url}');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(${JSON.stringify(payloadObj, null, 4).split('\n').join('\n    ')}),
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ${apiKey}',
        'Content-Type: application/json'
    ],
    CURLOPT_RETURNTRANSFER => true
]);

$data = json_decode(curl_exec($ch), true);
curl_close($ch);

if (!$data['success']) {
    throw new RuntimeException($data['error']);
}
// Store $data['otpCode'] against the user's session, then compare it with what they type in.
echo $data['transactionId'], ' ', $data['status'];`;
  }

  if (lang === 'go') {
    const fields = Object.entries(payloadObj)
      .map(([k, v]) => `\t\t"${k}": ${typeof v === 'string' ? `"${v}"` : v},`)
      .join('\n');
    return `// Go (net/http)
package main

import (
\t"bytes"
\t"encoding/json"
\t"fmt"
\t"net/http"
)

func main() {
\tpayload := map[string]interface{}{
${fields}
\t}
\tbody, _ := json.Marshal(payload)

\treq, _ := http.NewRequest("POST", "${url}", bytes.NewBuffer(body))
\treq.Header.Set("Authorization", "Bearer ${apiKey}")
\treq.Header.Set("Content-Type", "application/json")

\tresp, err := http.DefaultClient.Do(req)
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer resp.Body.Close()

\tvar data map[string]interface{}
\tjson.NewDecoder(resp.Body).Decode(&data)
\tfmt.Println(data["transactionId"], data["otpCode"], data["status"])
}`;
  }

  return '';
}

// Sample webhook payload, matching what the platform actually posts
export function getWebhookSamplePayload({ channel = 'whatsapp', event = 'otp.delivered' }) {
  const costMap = { sms: '0.0210', whatsapp: '0.0075', email: '0.0020' };
  const statusMap = {
    'otp.sent': ['SENT', '0'],
    'otp.delivered': ['DELIVERED', '0'],
    'otp.read': ['READ', '0'],
    'otp.failed': ['FAILED', '1'],
    'otp.expired': ['EXPIRED', '23']
  };
  const [status, errorCode] = statusMap[event] || statusMap['otp.delivered'];
  const recipient = channel === 'email' ? 'user@example.com' : '+60123456789';

  return {
    event,
    msgId: 'msg_live_8820a9bc4',
    channel,
    recipient,
    phoneNumber: recipient,
    status,
    errorCode,
    remark: 'login-4028',
    cost: costMap[channel] || '0.0075',
    currency: 'USD',
    timestamp: new Date().toISOString()
  };
}

// Webhook receiver examples
export function getWebhookReceiverSnippet(lang = 'node') {
  if (lang === 'node') {
    return `// Node.js (Express) webhook receiver
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhooks/otp88', (req, res) => {
  const { event, msgId, channel, recipient, status, errorCode, remark } = req.body;

  console.log(\`[\${event}] \${channel} to \${recipient}: \${status} (ref: \${remark || '-'})\`);

  if (status === 'FAILED' || status === 'EXPIRED') {
    // Offer the user another channel, e.g. resend over SMS or email
  }

  // Always answer 200 quickly; OTP88 retries on non-2xx responses
  res.status(200).json({ received: true });
});

app.listen(3000);`;
  }

  if (lang === 'python') {
    return `# Python (FastAPI) webhook receiver
from fastapi import FastAPI, Request

app = FastAPI()

@app.post("/webhooks/otp88")
async def otp88_webhook(request: Request):
    payload = await request.json()
    print(f"[{payload['event']}] {payload['channel']} to {payload['recipient']}: {payload['status']}")

    if payload["status"] in ("FAILED", "EXPIRED"):
        pass  # offer the user another channel

    return {"received": True}`;
  }

  if (lang === 'php') {
    return `<?php
// PHP webhook receiver
$payload = json_decode(file_get_contents('php://input'), true);

if ($payload) {
    error_log(sprintf('[%s] %s to %s: %s', $payload['event'], $payload['channel'], $payload['recipient'], $payload['status']));
    if (in_array($payload['status'], ['FAILED', 'EXPIRED'], true)) {
        // offer the user another channel
    }
}

http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['received' => true]);`;
  }

  return '';
}
