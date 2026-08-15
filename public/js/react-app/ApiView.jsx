import React, { useState, useEffect, useMemo } from 'react';

// Code snippet helper for multiple channels and languages
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
    if (channel === 'sms') {
      payloadObj = {
        phoneNumber: phone,
        channel: 'sms',
        senderName: 'Alibaba',
        otp: '882910'
      };
    } else if (channel === 'telegram') {
      payloadObj = {
        phoneNumber: phone,
        channel: 'telegram',
        senderName: 'Alibaba',
        otp: '882910'
      };
    } else if (channel === 'whatsapp') {
      payloadObj = {
        phoneNumber: phone,
        channel: 'whatsapp',
        senderName: 'Alibaba',
        otp: '882910'
      };
    } else if (channel === 'voice') {
      payloadObj = {
        phoneNumber: phone,
        channel: 'voice',
        senderName: 'Alibaba',
        otp: '882910'
      };
    } else {
      payloadObj = {
        phoneNumber: phone,
        channel: 'waterfall',
        channels: ['whatsapp', 'telegram', 'sms'],
        senderName: 'Alibaba',
        otp: '882910'
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
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
${Object.entries(payloadObj).map(([k, v]) => `\t\t"${k}": ${Array.isArray(v) ? `[]string{${v.map(x => `"${x}"`).join(', ')}}` : typeof v === 'string' ? `"${v}"` : v},`).join('\n')}
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "${url}", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer ${apiKey}")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println("Response:", string(respBody))
}`;
  }

  return '';
}

// API & Keys Integration Spreadsheet View
function ApiView({ t, session, revealedApiKey, setRevealedApiKey, copyToClipboard, showToast }) {
  const currentOrigin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'http://localhost:8884';

  const [selectedChannel, setSelectedChannel] = useState('sms');
  const [selectedLang, setSelectedLang] = useState('curl');
  const [selectedAction, setSelectedAction] = useState('send');

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
      {/* API Key */}
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
      </div>

      {/* Code Examples & Channel Selectors */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{t.quickstartCode || 'API Code Examples'}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
              ({selectedAction === 'send' ? 'POST /v1/otp/send' : 'POST /v1/otp/verify'})
            </span>
          </div>

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
        </div>

        {/* Channel & Language Controls */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px', background: '#FAFAFA' }}>
          {selectedAction === 'send' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', width: '65px' }}>Channel:</span>
              {[
                { id: 'sms', label: 'SMS OTP' },
                { id: 'telegram', label: 'Telegram OTP' },
                { id: 'whatsapp', label: 'WhatsApp OTP' },
                { id: 'voice', label: 'Voice OTP' },
                { id: 'waterfall', label: 'Waterfall (Multi-Channel)' }
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
      </div>
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.ApiView = ApiView;
}

export default ApiView;
