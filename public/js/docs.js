/* ==========================================================================
   OTP88 Developer Docs & Live API Sandbox Controller
   ========================================================================== */

function getApiOrigin() {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return '';
}

function getApiBaseUrl() {
  return `${getApiOrigin()}/v1`;
}

function getApiKey() {
  try {
    const rawSession = localStorage.getItem('otp_user_session') || localStorage.getItem('session');
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      const key = parsed?.apiKeyLive || parsed?.user?.apiKeyLive || parsed?.apiKey;
      if (key) {
        return key.startsWith('otp88_api_') ? key : ('otp88_api_' + key.replace(/^otp_live_|^api_/, ''));
      }
    }
  } catch (e) {}
  return 'otp88_api_99882200aabbcc';
}

// Generate code snippet for POST /v1/otp/send
function generateSendSnippet(lang = 'curl', channel = 'waterfall') {
  const url = `${getApiBaseUrl()}/otp/send`;
  const apiKey = getApiKey();

  let payload = {};
  if (channel === 'whatsapp') {
    payload = {
      to: '+60123456789',
      channel_strategy: 'whatsapp',
      sender_name: 'WhatsApp Business',
      otp: '882910'
    };
  } else if (channel === 'telegram') {
    payload = {
      to: '+60123456789',
      channel_strategy: 'telegram',
      sender_name: 'Alibaba',
      otp: '882910'
    };
  } else if (channel === 'sms') {
    payload = {
      to: '+60123456789',
      channel_strategy: 'sms',
      sender_name: 'Alibaba',
      otp: '882910'
    };
  } else if (channel === 'email') {
    payload = {
      to: 'user@example.com',
      channel_strategy: 'email',
      sender_name: 'OTP88',
      otp: '882910'
    };
  } else {
    // waterfall
    payload = {
      to: '+60123456789',
      channel_strategy: 'waterfall',
      channels: ['whatsapp', 'email', 'sms'],
      sender_name: 'OTP88',
      otp: '882910'
    };
  }

  const jsonStr = JSON.stringify(payload, null, 2);

  if (lang === 'curl') {
    return `curl -X POST ${url} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload)}'`;
  }

  if (lang === 'node') {
    return `const axios = require('axios');

async function sendOTP() {
  const response = await axios.post('${url}', ${jsonStr}, {
    headers: {
      'Authorization': 'Bearer ${apiKey}',
      'Content-Type': 'application/json'
    }
  });

  console.log('OTP Dispatched:', response.data);
}

sendOTP();`;
  }

  if (lang === 'python') {
    const pyPayload = JSON.stringify(payload, null, 4)
      .replace(/: true/g, ': True')
      .replace(/: false/g, ': False');

    return `import requests

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

  if (lang === 'go') {
    return `package main

import (
\t"bytes"
\t"encoding/json"
\t"fmt"
\t"net/http"
)

func main() {
\tpayload := ${jsonStr}
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

\tfmt.Println("Status:", resp.Status)
}`;
  }

  if (lang === 'php') {
    return `<?php
$ch = curl_init('${url}');

$payload = json_encode(${jsonStr});

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

  return '';
}

// Generate code snippet for POST /v1/otp/verify
function generateVerifySnippet(lang = 'curl') {
  const url = `${getApiBaseUrl()}/otp/verify`;
  const apiKey = getApiKey();
  const payload = {
    transaction_id: 'tx_live_8820a9bc4',
    code: '882049'
  };
  const jsonStr = JSON.stringify(payload, null, 2);

  if (lang === 'curl') {
    return `curl -X POST ${url} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload)}'`;
  }

  if (lang === 'node') {
    return `const axios = require('axios');

async function verifyOTP() {
  const res = await axios.post('${url}', ${jsonStr}, {
    headers: {
      'Authorization': 'Bearer ${apiKey}',
      'Content-Type': 'application/json'
    }
  });
  console.log('Verification Result:', res.data);
}

verifyOTP();`;
  }

  if (lang === 'python') {
    return `import requests

url = "${url}"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "transaction_id": "tx_live_8820a9bc4",
    "code": "882049"
}

res = requests.post(url, json=payload, headers=headers)
print(res.json())`;
  }

  return '';
}

// Generate status query snippet
function generateStatusSnippet() {
  const url = `${getApiBaseUrl()}/otp/status?transaction_id=tx_live_8820a9bc4`;
  const apiKey = getApiKey();
  return `curl -X GET "${url}" \\
  -H "Authorization: Bearer ${apiKey}"`;
}

let currentSendLang = 'curl';
let currentSendChannel = 'waterfall';
let currentVerifyLang = 'curl';

document.addEventListener('DOMContentLoaded', () => {
  updateDynamicUrls();
  initCodeSwitcher();
  initApiTester();
});

// Update all dynamically derived URL elements on the page
function updateDynamicUrls() {
  const baseUrl = getApiBaseUrl();
  const origin = getApiOrigin();

  const baseDisplay = document.getElementById('base-url-display');
  if (baseDisplay) {
    baseDisplay.innerText = baseUrl;
  }

  const sandboxUrlDisplay = document.getElementById('sandbox-url-display');
  if (sandboxUrlDisplay) {
    sandboxUrlDisplay.innerText = `${origin}/api/simulate-otp`;
  }

  document.querySelectorAll('.dynamic-base-url').forEach(el => {
    el.innerText = baseUrl;
  });

  document.querySelectorAll('.dynamic-origin').forEach(el => {
    el.innerText = origin;
  });

  const sendCodePre = document.getElementById('send-sample-code') || document.getElementById('api-sample-code');
  if (sendCodePre) {
    sendCodePre.innerText = generateSendSnippet(currentSendLang, currentSendChannel);
  }

  const verifyCodePre = document.getElementById('verify-sample-code');
  if (verifyCodePre) {
    verifyCodePre.innerText = generateVerifySnippet(currentVerifyLang);
  }

  const statusCodePre = document.getElementById('status-sample-code');
  if (statusCodePre) {
    statusCodePre.innerText = generateStatusSnippet();
  }
}

function initCodeSwitcher() {
  // Send OTP language tabs
  const sendLangTabs = document.querySelectorAll('[data-code-lang]');
  const sendCodePre = document.getElementById('send-sample-code') || document.getElementById('api-sample-code');

  if (sendLangTabs && sendCodePre) {
    sendLangTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        sendLangTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentSendLang = tab.getAttribute('data-code-lang') || 'curl';
        sendCodePre.innerText = generateSendSnippet(currentSendLang, currentSendChannel);
      });
    });
  }

  // Send OTP channel strategy buttons/selectors
  const channelTabs = document.querySelectorAll('[data-channel-tab]');
  if (channelTabs && sendCodePre) {
    channelTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        channelTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentSendChannel = tab.getAttribute('data-channel-tab') || 'waterfall';
        sendCodePre.innerText = generateSendSnippet(currentSendLang, currentSendChannel);
      });
    });
  }

  // Verify OTP language tabs
  const verifyLangTabs = document.querySelectorAll('[data-verify-lang]');
  const verifyCodePre = document.getElementById('verify-sample-code');
  if (verifyLangTabs && verifyCodePre) {
    verifyLangTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        verifyLangTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentVerifyLang = tab.getAttribute('data-verify-lang') || 'curl';
        verifyCodePre.innerText = generateVerifySnippet(currentVerifyLang);
      });
    });
  }
}

function initApiTester() {
  const sendBtn = document.getElementById('sandbox-send-btn');
  const responseBox = document.getElementById('sandbox-response-box');
  const statusBadge = document.getElementById('sandbox-status-badge');

  if (!sendBtn || !responseBox) return;

  sendBtn.addEventListener('click', async () => {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg><span>Executing API Call...</span>';
    responseBox.innerText = 'Sending payload to OTP88 Gateway...';
    if (statusBadge) {
      statusBadge.innerText = 'Connecting...';
      statusBadge.style.color = 'var(--text-muted)';
    }

    const testPhone = document.getElementById('sandbox-phone')?.value || '+60123456789';
    const testChannel = document.getElementById('sandbox-channel')?.value || 'waterfall';

    try {
      const res = await fetch('/api/simulate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: testPhone,
          channel: testChannel,
          channel_strategy: testChannel,
          codeLength: 6
        })
      });

      const data = await res.json();
      responseBox.innerText = JSON.stringify(data, null, 2);

      if (res.ok && data.success) {
        if (statusBadge) {
          statusBadge.innerText = `Status: ${res.status} OK`;
          statusBadge.style.color = 'var(--text-emerald)';
        }
        if (window.showToast) {
          window.showToast('200 OK — OTP Dispatched Successfully!');
        }
      } else {
        if (statusBadge) {
          statusBadge.innerText = `Status: ${res.status} ${res.statusText || 'Error'}`;
          statusBadge.style.color = '#EF4444';
        }
        const errMsg = data.error || data.message || 'OTP Dispatch failed';
        if (window.showToast) {
          window.showToast(`Error: ${errMsg}`, 'error');
        }
      }
    } catch (e) {
      const errPayload = { error: 'Failed to connect to gateway', detail: e.message };
      responseBox.innerText = JSON.stringify(errPayload, null, 2);
      if (statusBadge) {
        statusBadge.innerText = 'Status: Network Error';
        statusBadge.style.color = '#EF4444';
      }
      if (window.showToast) {
        window.showToast('Network error: Failed to reach gateway', 'error');
      }
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg><span>Run Sandbox Request</span>';
    }
  });
}
