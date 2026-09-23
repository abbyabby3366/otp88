// Code snippet helpers for OTP88 Developer API & Webhooks

export function getCodeSnippet({ origin, apiKey, channel, lang, action, phone = '+60123456789' }) {
  const isVerify = action === 'verify';
  const url = isVerify ? `${origin}/v1/otp/verify` : `${origin}/v1/otp/send`;

  let payloadObj = {};
  if (isVerify) {
    payloadObj = {
      transaction_id: 'tx_live_8820a9bc4',
      code: '882910'
    };
  } else {
    if (channel === 'whatsapp') {
      payloadObj = {
        phoneNumber: phone,
        channel: 'whatsapp',
        otp: '882910'
      };
    } else if (channel === 'telegram') {
      payloadObj = {
        phoneNumber: phone,
        channel: 'telegram',
        senderName: 'Alibaba',
        otp: '882910',
        expiryMinutes: 5
      };
    } else if (channel === 'email') {
      payloadObj = {
        email: 'user@example.com',
        channel: 'email',
        brand_name: 'SuperApp',
        brand_handle: 'superapp',
        otp: '882910',
        expiryMinutes: 5
      };
    } else {
      payloadObj = {
        phoneNumber: phone,
        channel: 'sms',
        senderName: 'Alibaba',
        otp: '882910',
        expiryMinutes: 5
      };
    }
  }

  const jsonStr = JSON.stringify(payloadObj, null, 2);

  if (lang === 'curl') {
    return `curl -X POST ${url} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payloadObj)}'`;
  }

  if (lang === 'node') {
    return `// Node.js (v18+ fetch / axios)
async function sendOtp() {
  const res = await fetch('${url}', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ${apiKey}',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(${jsonStr})
  });

  const data = await res.json();
  console.log('OTP Response:', data);
}

sendOtp();`;
  }

  if (lang === 'python') {
    const pyPayload = JSON.stringify(payloadObj, null, 4)
      .replace(/: true/g, ': True')
      .replace(/: false/g, ': False');
    return `# Python 3 (requests)
import requests

url = "${url}"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = ${pyPayload}

response = requests.post(url, json=payload, headers=headers)
print("Status:", response.status_code)
print("Response:", response.json())`;
  }

  if (lang === 'php') {
    return `<?php
// PHP cURL Example
$ch = curl_init('${url}');

$payload = json_encode(${JSON.stringify(payloadObj, null, 4)});

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ${apiKey}',
        'Content-Type: application/json'
    ],
    CURLOPT_RETURNTRANSFER => true
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`;
  }

  if (lang === 'go') {
    return `// Go (net/http)
package main

import (
\t"bytes"
\t"encoding/json"
\t"fmt"
\t"io"
\t"net/http"
)

func main() {
\tpayload := map[string]interface{}{
${Object.entries(payloadObj).map(([k, v]) => `\t\t"${k}": ${Array.isArray(v) ? `[]string{${v.map(x => `"${x}"`).join(', ')}}` : typeof v === 'string' ? `"${v}"` : v},`).join('\n')}
\t}
\tbody, _ := json.Marshal(payload)

\treq, _ := http.NewRequest("POST", "${url}", bytes.NewBuffer(body))
\treq.Header.Set("Authorization", "Bearer ${apiKey}")
\treq.Header.Set("Content-Type", "application/json")

\tclient := &http.Client{}
\tresp, err := client.Do(req)
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer resp.Body.Close()

\trespBody, _ := io.ReadAll(resp.Body)
\tfmt.Println("Response:", string(respBody))
}`;
  }

  return '';
}

// Generate sample webhook payload object across all status events
export function getWebhookSamplePayload({ channel = 'whatsapp', event = 'otp.delivered' }) {
  const costMap = { sms: '0.0210', telegram: '0.0035', whatsapp: '0.0500', email: '0.0020' };

  let status = 'DELIVERED';
  let errorCode = '0';
  let errorDescription = undefined;
  let latency = '0.8s';

  if (event === 'otp.delivered') {
    status = 'DELIVERED';
    errorCode = '0';
    latency = '0.8s';
  } else if (event === 'otp.read') {
    status = 'READ';
    errorCode = '0';
    latency = '1.4s';
  } else if (event === 'otp.undelivered') {
    status = 'UNDELIVERED';
    errorCode = '20';
    errorDescription = 'Subscriber handset is unreachable, offline, or out of cellular network coverage.';
    latency = '30.0s';
  } else if (event === 'otp.failed') {
    status = 'FAILED';
    errorCode = '1';
    errorDescription = 'Network rejection: destination recipient is invalid or unreachable.';
    latency = '0.4s';
  } else if (event === 'otp.expired') {
    status = 'EXPIRED';
    errorCode = '23';
    errorDescription = 'OTP code validity period exceeded before recipient acknowledgment.';
    latency = '300.0s';
  } else if (event === 'otp.sent') {
    status = 'SENT';
    errorCode = '0';
    latency = '0.2s';
  }

  return {
    event,
    msgId: 'msg_live_8820a9bc4',
    channel,
    phoneNumber: channel === 'email' ? 'user@example.com' : '+60123456789',
    status,
    errorCode,
    remark: 'Login verification #1024',
    errorDescription,
    cost: costMap[channel] || '0.0020',
    currency: 'USD',
    latency,
    timestamp: new Date().toISOString()
  };
}

// Webhook listener code snippet generator
export function getWebhookReceiverSnippet(lang = 'node') {
  if (lang === 'node') {
    return `// Node.js (Express) Webhook Listener
const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/webhooks/otp88', (req, res) => {
  const { event, msgId, channel, phoneNumber, status, errorCode, remark } = req.body;
  
  console.log(\`Received [\${event}] for \${channel} to \${phoneNumber}: Status = \${status} (Remark: \${remark || 'N/A'})\`);

  if (status === 'DELIVERED') {
    // Handset received OTP successfully
  } else if (status === 'READ') {
    // Handset opened & read message (WhatsApp Blue Tick)
  } else if (status === 'UNDELIVERED' || status === 'FAILED' || status === 'EXPIRED') {
    // Delivery failed -> trigger multi-channel waterfall fallback
  }

  // Acknowledge receipt with HTTP 200 OK immediately
  res.status(200).json({ received: true });
});

app.listen(3000, () => console.log('Webhook server listening on port 3000'));`;
  }

  if (lang === 'python') {
    return `# Python (FastAPI) Webhook Listener
from fastapi import FastAPI, Request

app = FastAPI()

@app.post("/api/webhooks/otp88")
async def handle_otp88_webhook(request: Request):
    payload = await request.json()
    event = payload.get("event")
    channel = payload.get("channel")
    status = payload.get("status")
    remark = payload.get("remark")
    
    print(f"Received [{event}] on {channel}: status={status}, remark={remark}")
    
    # Return 200 OK
    return {"received": True}`;
  }

  if (lang === 'php') {
    return `<?php
// PHP Webhook Listener
$rawBody = file_get_contents('php://input');
$event = json_decode($rawBody, true);

if ($event) {
    $channel = $event['channel'] ?? 'unknown';
    $status = $event['status'] ?? 'unknown';
    $remark = $event['remark'] ?? '';
    error_log("OTP88 Webhook: channel={$channel}, status={$status}, remark={$remark}");
}

// Acknowledge receipt with HTTP 200
http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['received' => true]);
?>`;
  }

  return '';
}
