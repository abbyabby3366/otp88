import React, { useState, useEffect, useMemo } from 'react';

// Code snippet helper for REST API calls (send / verify)
function getCodeSnippet({ origin, apiKey, channel, lang, action, phone = '+60123456789' }) {
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
function getWebhookSamplePayload({ channel = 'whatsapp', event = 'otp.delivered' }) {
  const costMap = { sms: '0.0210', telegram: '0.0035', whatsapp: '0.0500' };

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
    errorDescription = 'Network rejection: destination mobile number is invalid, barred, or unreachable.';
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
    phoneNumber: '+60123456789',
    status,
    errorCode,
    remark: 'Login verification #1024',
    errorDescription,
    cost: costMap[channel] || '0.0500',
    currency: 'USD',
    latency,
    timestamp: new Date().toISOString()
  };
}

// Webhook listener code snippet generator
function getWebhookReceiverSnippet(lang = 'node') {
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

// API & Keys Integration Spreadsheet View
function ApiView({ t, session, setSession, jwtToken, revealedApiKey, setRevealedApiKey, copyToClipboard, showToast }) {
  const currentOrigin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'http://localhost:8884';

  const [selectedChannel, setSelectedChannel] = useState('whatsapp');
  const [selectedLang, setSelectedLang] = useState('curl');
  const [selectedAction, setSelectedAction] = useState('send');

  // Collapsible sections state
  const [isApiCodeOpen, setIsApiCodeOpen] = useState(true);

  const rawKey = session?.apiKeyLive || 'otp88_api_88a90184bcedf41';
  const apiKey = useMemo(() => {
    if (rawKey.startsWith('otp_live_')) {
      return 'otp88_api_' + rawKey.slice(9);
    }
    if (!rawKey.startsWith('otp88_api_') && !rawKey.startsWith('api_')) {
      return 'otp88_api_' + rawKey;
    }
    return rawKey;
  }, [rawKey]);

  // Display value: show 'otp88_api_' prefix followed by masked dots before reveal
  const displayKeyValue = useMemo(() => {
    if (revealedApiKey) {
      return apiKey;
    }
    const suffixLength = Math.max(16, apiKey.length - 10);
    return 'otp88_api_' + '•'.repeat(suffixLength);
  }, [apiKey, revealedApiKey]);

  const activeSnippet = useMemo(() => {
    return getCodeSnippet({
      origin: currentOrigin,
      apiKey,
      channel: selectedChannel,
      lang: selectedLang,
      action: selectedAction
    });
  }, [currentOrigin, apiKey, selectedChannel, selectedLang, selectedAction]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 1. API Key Card */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '10px', background: '#FFFFFF' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          {t.prodApiKey || 'API Key'}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            className="sheets-input sheets-input-code"
            readOnly
            value={displayKeyValue}
            style={{ fontWeight: '700', letterSpacing: revealedApiKey ? 'normal' : '1px' }}
          />
          <button
            type="button"
            className="sheets-btn"
            onClick={() => setRevealedApiKey(!revealedApiKey)}
            style={{ minWidth: '85px' }}
          >
            {revealedApiKey ? 'Hide Key' : 'Reveal Key'}
          </button>
          <button
            type="button"
            className="sheets-btn sheets-btn-primary"
            onClick={() => copyToClipboard(apiKey, 'API Key')}
          >
            {t.copyKey || 'Copy Key'}
          </button>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
          {t.apiKeyDesc || 'Include this secret key in the Authorization: Bearer <API_KEY> header to authenticate your API requests.'}
        </div>
      </div>

      {/* 2. API Code Examples & Channel Selectors Card (Collapsible) */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div
          onClick={() => setIsApiCodeOpen(!isApiCodeOpen)}
          style={{
            background: '#F8FAFC',
            padding: '8px 12px',
            borderBottom: isApiCodeOpen ? '1px solid var(--border-subtle)' : 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', transition: 'transform 0.2s ease', transform: isApiCodeOpen ? 'rotate(90deg)' : 'rotate(0deg)', fontSize: '10px' }}>
              ▶
            </span>
            <span>{t.quickstartCode || 'API Code Examples'}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
              ({selectedAction === 'send' ? `POST ${currentOrigin}/v1/otp/send` : `POST ${currentOrigin}/v1/otp/verify`})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                type="button"
                className={`sheets-btn ${selectedAction === 'send' ? 'sheets-btn-primary' : ''}`}
                style={{ fontSize: '10px', padding: '2px 8px' }}
                onClick={() => setSelectedAction('send')}
              >
                Send OTP
              </button>
              <button
                type="button"
                className={`sheets-btn ${selectedAction === 'verify' ? 'sheets-btn-primary' : ''}`}
                style={{ fontSize: '10px', padding: '2px 8px' }}
                onClick={() => setSelectedAction('verify')}
              >
                Verify OTP
              </button>
            </div>
            <button
              type="button"
              className="sheets-btn"
              onClick={() => setIsApiCodeOpen(!isApiCodeOpen)}
              style={{ fontSize: '10px', padding: '2px 8px' }}
            >
              {isApiCodeOpen ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isApiCodeOpen && (
          <>
            {/* Channel & Language Controls */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px', background: '#FAFAFA' }}>
              {selectedAction === 'send' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', width: '65px' }}>Channel:</span>
                  {[
                    { id: 'whatsapp', label: 'WhatsApp OTP' },
                    { id: 'sms', label: 'SMS OTP' },
                    { id: 'telegram', label: 'Telegram OTP' }
                  ].map(ch => (
                    <button
                      key={ch.id}
                      type="button"
                      className={`sheets-btn ${selectedChannel === ch.id ? 'sheets-btn-primary' : ''}`}
                      onClick={() => setSelectedChannel(ch.id)}
                      style={{ fontSize: '10px', padding: '3px 8px' }}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', width: '65px' }}>Language:</span>
                {[
                  { id: 'curl', label: 'cURL' },
                  { id: 'node', label: 'Node.js' },
                  { id: 'python', label: 'Python' },
                  { id: 'php', label: 'PHP' },
                  { id: 'go', label: 'Go' }
                ].map(lang => (
                  <button
                    key={lang.id}
                    type="button"
                    className={`sheets-btn ${selectedLang === lang.id ? 'sheets-btn-primary' : ''}`}
                    onClick={() => setSelectedLang(lang.id)}
                    style={{ fontSize: '10px', padding: '3px 8px' }}
                  >
                    {lang.label}
                  </button>
                ))}

                <div style={{ marginLeft: 'auto' }}>
                  <button
                    type="button"
                    className="sheets-btn"
                    onClick={() => copyToClipboard(activeSnippet, `${selectedChannel.toUpperCase()} ${selectedLang.toUpperCase()} example`)}
                    style={{ fontSize: '10px', padding: '3px 10px', fontWeight: '700' }}
                  >
                    Copy Code
                  </button>
                </div>
              </div>
            </div>

            {/* Code View */}
            <div style={{ padding: '12px', background: '#0F172A' }}>
              <pre style={{ margin: 0, color: '#38BDF8', fontFamily: 'var(--font-code)', fontSize: '11px', lineHeight: 1.5, overflowX: 'auto' }}>
                {activeSnippet}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.ApiView = ApiView;
}

export default ApiView;
