/* ==========================================================================
   OTP88 API documentation: dynamic URLs, code samples and the live sandbox.
   The sandbox calls the real endpoint with the signed-in user's API key.
   ========================================================================== */

function getApiOrigin() {
  return (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
}

function getApiBaseUrl() {
  return `${getApiOrigin()}/v1`;
}

// The console stores the signed-in session under this key
function getSession() {
  try {
    const raw = localStorage.getItem('otp88_session');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function getApiKey() {
  const session = getSession();
  return session && session.apiKeyLive ? session.apiKeyLive : 'otp88_api_YOUR_API_KEY';
}

function hasRealApiKey() {
  const session = getSession();
  return Boolean(session && session.apiKeyLive);
}

// --- Sample payloads (canonical camelCase field names) ---
const SAMPLE_PAYLOADS = {
  whatsapp: { to: '+60123456789', channel: 'whatsapp', otp: '882910', expiryMinutes: 5, remark: 'login-4028' },
  sms: { to: '+60123456789', channel: 'sms', senderName: 'MyApp', otp: '882910', expiryMinutes: 5, remark: 'login-4028' },
  email: {
    to: 'user@example.com',
    channel: 'email',
    brandName: 'MyApp',
    brandHandle: 'myapp',
    logoUrl: 'https://example.com/logo.png',
    subject: 'MyApp Verification Code: 882910',
    replyTo: 'support@myapp.com',
    otp: '882910',
    expiryMinutes: 5,
    remark: 'login-4028'
  }
};

function generateSendSnippet(lang = 'curl', channel = 'whatsapp') {
  const url = `${getApiBaseUrl()}/otp/send`;
  const apiKey = getApiKey();
  const payload = SAMPLE_PAYLOADS[channel] || SAMPLE_PAYLOADS.whatsapp;
  const jsonStr = JSON.stringify(payload, null, 2);

  if (lang === 'curl') {
    return `curl -X POST ${url} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload)}'`;
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

// Keep data.otpCode with the user's session and compare it when they submit the code
console.log(data.transactionId, data.status);`;
  }

  if (lang === 'python') {
    const pyPayload = JSON.stringify(payload, null, 4).replace(/: true/g, ': True').replace(/: false/g, ': False');
    return `import requests

response = requests.post(
    "${url}",
    headers={"Authorization": "Bearer ${apiKey}"},
    json=${pyPayload.split('\n').join('\n    ')},
    timeout=15,
)
data = response.json()
if not data["success"]:
    raise RuntimeError(data["error"])

# Keep data["otpCode"] with the user's session and compare it when they submit the code
print(data["transactionId"], data["status"])`;
  }

  if (lang === 'go') {
    const fields = Object.entries(payload)
      .map(([k, v]) => `\t\t"${k}": ${typeof v === 'string' ? `"${v}"` : v},`)
      .join('\n');
    return `package main

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
\tfmt.Println(data["transactionId"], data["status"])
}`;
  }

  if (lang === 'php') {
    const phpEntries = Object.entries(payload)
      .map(([k, v]) => `    '${k}' => ${typeof v === 'string' ? `'${v}'` : v}`)
      .join(',\n');
    return `<?php
$payload = [
${phpEntries}
];

$ch = curl_init('${url}');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
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
// Keep $data['otpCode'] with the user's session and compare it when they submit the code
echo $data['transactionId'], ' ', $data['status'];`;
  }

  return '';
}

let currentSendLang = 'curl';
let currentSendChannel = 'whatsapp';

document.addEventListener('DOMContentLoaded', () => {
  updateDynamicUrls();
  initCodeSwitcher();
  initSandbox();
});

function updateDynamicUrls() {
  const baseUrl = getApiBaseUrl();
  const origin = getApiOrigin();

  document.querySelectorAll('.dynamic-base-url').forEach(el => { el.innerText = baseUrl; });
  document.querySelectorAll('.dynamic-origin').forEach(el => { el.innerText = origin; });

  const baseDisplay = document.getElementById('base-url-display');
  if (baseDisplay) baseDisplay.innerText = baseUrl;

  const authDisplay = document.getElementById('auth-header-display');
  if (authDisplay) authDisplay.innerText = `Authorization: Bearer ${getApiKey()}`;

  const keyNote = document.getElementById('api-key-note');
  if (keyNote) {
    keyNote.innerText = hasRealApiKey()
      ? 'Examples on this page use the API key of the account you are signed in with.'
      : 'Sign in to the console to see your own API key in these examples.';
  }

  const sendCodePre = document.getElementById('send-sample-code');
  if (sendCodePre) sendCodePre.innerText = generateSendSnippet(currentSendLang, currentSendChannel);
}

function initCodeSwitcher() {
  const sendCodePre = document.getElementById('send-sample-code');
  if (!sendCodePre) return;

  document.querySelectorAll('[data-code-lang]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-code-lang]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentSendLang = tab.getAttribute('data-code-lang') || 'curl';
      sendCodePre.innerText = generateSendSnippet(currentSendLang, currentSendChannel);
    });
  });

  document.querySelectorAll('[data-channel-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-channel-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentSendChannel = tab.getAttribute('data-channel-tab') || 'whatsapp';
      sendCodePre.innerText = generateSendSnippet(currentSendLang, currentSendChannel);
    });
  });
}

// --- Live sandbox: sends a real OTP with the signed-in user's key ---
function initSandbox() {
  const sendBtn = document.getElementById('sandbox-send-btn');
  const responseBox = document.getElementById('sandbox-response-box');
  const statusBadge = document.getElementById('sandbox-status-badge');
  const channelSelect = document.getElementById('sandbox-channel');
  const targetInput = document.getElementById('sandbox-to');
  const targetLabel = document.getElementById('sandbox-to-label');
  const signInNote = document.getElementById('sandbox-signin-note');
  if (!sendBtn || !responseBox) return;

  const syncTargetField = () => {
    const isEmail = channelSelect && channelSelect.value === 'email';
    if (targetLabel) targetLabel.innerText = isEmail ? 'Recipient email address' : 'Recipient phone number';
    if (targetInput) {
      targetInput.placeholder = isEmail ? 'user@example.com' : '+60123456789';
      if (isEmail && targetInput.value.startsWith('+')) targetInput.value = '';
      if (!isEmail && targetInput.value.includes('@')) targetInput.value = '+60123456789';
    }
  };
  if (channelSelect) channelSelect.addEventListener('change', syncTargetField);
  syncTargetField();

  if (!hasRealApiKey()) {
    sendBtn.disabled = true;
    if (signInNote) signInNote.style.display = 'block';
  }

  sendBtn.addEventListener('click', async () => {
    const to = targetInput ? targetInput.value.trim() : '';
    const channel = channelSelect ? channelSelect.value : 'whatsapp';
    if (!to) {
      if (window.showToast) window.showToast('Enter a recipient first', 'error');
      return;
    }

    const idleHtml = sendBtn.innerHTML;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span>Sending…</span>';
    responseBox.innerText = 'Sending request…';
    if (statusBadge) { statusBadge.innerText = 'Connecting…'; statusBadge.style.color = 'var(--text-muted)'; }

    try {
      const res = await fetch('/v1/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getApiKey()}`
        },
        body: JSON.stringify({ to, channel })
      });
      const data = await res.json();
      responseBox.innerText = JSON.stringify(data, null, 2);

      if (res.ok && data.success) {
        if (statusBadge) { statusBadge.innerText = `HTTP ${res.status} OK`; statusBadge.style.color = 'var(--text-emerald)'; }
        if (window.showToast) window.showToast(`Sent via ${data.channelUsed}. Cost ${data.cost}.`);
      } else {
        if (statusBadge) { statusBadge.innerText = `HTTP ${res.status}`; statusBadge.style.color = '#EF4444'; }
        if (window.showToast) window.showToast(data.error || 'Request failed', 'error');
      }
    } catch (e) {
      responseBox.innerText = JSON.stringify({ error: 'Could not reach the server', detail: e.message }, null, 2);
      if (statusBadge) { statusBadge.innerText = 'Network error'; statusBadge.style.color = '#EF4444'; }
    } finally {
      sendBtn.disabled = false;
      sendBtn.innerHTML = idleHtml;
    }
  });
}

window.getApiOrigin = getApiOrigin;
window.getApiBaseUrl = getApiBaseUrl;
window.getApiKey = getApiKey;
