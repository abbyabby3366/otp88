import React, { useState, useMemo } from 'react';

function getAdminCodeSnippet({ origin, apiKey, channel, lang, action, phone = '+60123456789' }) {
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
    return `// Node.js
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
  console.log('Response:', data);
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
    return `// Go
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
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println("Response:", string(respBody))
}`;
  }

  return '';
}

// Admin Multi-Tenant API Keys & Credentials Management View
function AdminApiView({ t, usersList = [], session, copyToClipboard, showToast }) {
  const currentOrigin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'http://localhost:8884';

  const [selectedApiKey, setSelectedApiKey] = useState(() => {
    const raw = usersList[0]?.apiKeyLive || session?.apiKeyLive || 'otp88_api_88a90184bcedf41';
    return raw.startsWith('otp_live_') ? 'otp88_api_' + raw.slice(9) : raw;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('sms');
  const [selectedLang, setSelectedLang] = useState('curl');
  const [selectedAction, setSelectedAction] = useState('send');

  const filteredUsers = usersList.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.apiKeyLive && u.apiKeyLive.toLowerCase().includes(term))
    );
  });

  const activeSnippet = useMemo(() => {
    return getAdminCodeSnippet({
      origin: currentOrigin,
      apiKey: selectedApiKey,
      channel: selectedChannel,
      lang: selectedLang,
      action: selectedAction
    });
  }, [currentOrigin, selectedApiKey, selectedChannel, selectedLang, selectedAction]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* User API Keys Directory */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>USER API KEYS DIRECTORY ({filteredUsers.length} Users)</span>
          
          <input
            type="text"
            className="sheets-input sheets-input-code"
            placeholder="Search user or key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '200px', padding: '4px 8px', fontSize: '11px' }}
          />
        </div>

        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '35px' }}>#</th>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Live API Key</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((usr, idx) => {
                let keyVal = usr.apiKeyLive || 'otp88_api_88a90184bcedf41';
                if (keyVal.startsWith('otp_live_')) keyVal = 'otp88_api_' + keyVal.slice(9);
                const isSelected = selectedApiKey === keyVal;
                return (
                  <tr key={usr._id || idx} style={{ background: isSelected ? 'rgba(16, 185, 129, 0.04)' : undefined }}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '10px' }}>{idx + 1}</td>
                    <td><strong>{usr.name || usr.email}</strong></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{usr.email}</td>
                    <td>
                      <span className={`sheets-badge ${usr.role === 'ADMIN' ? 'sheets-badge-purple' : 'sheets-badge-blue'}`}>
                        {usr.role || 'USER'}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontFamily: 'var(--font-code)', fontWeight: '700', fontSize: '11px', background: '#F1F5F9', padding: '2px 6px', borderRadius: '3px' }}>
                        {keyVal}
                      </code>
                    </td>
                    <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700', color: '#059669' }}>
                      ${(usr.balanceUsd || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className={`sheets-badge ${usr.status === 'PAUSED' ? 'sheets-badge-amber' : usr.status === 'SUSPENDED' ? 'sheets-badge-danger' : 'sheets-badge-emerald'}`}>
                        {usr.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="sheets-btn"
                          style={{ padding: '2px 6px', fontSize: '10px' }}
                          onClick={() => copyToClipboard(keyVal, `${usr.name || 'User'}'s API Key`)}
                          title="Copy API Key"
                        >
                          Copy Key
                        </button>
                        <button
                          className={`sheets-btn ${isSelected ? 'sheets-btn-primary' : ''}`}
                          style={{ padding: '2px 6px', fontSize: '10px' }}
                          onClick={() => {
                            setSelectedApiKey(keyVal);
                            showToast(`Selected ${usr.name || usr.email} for cURL test`);
                          }}
                        >
                          Test cURL
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dynamic Code Example Box */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>
            API DISPATCH CODE GENERATOR (Active Key: <code style={{ color: '#059669' }}>{selectedApiKey.slice(0, 18)}...</code>)
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

        {/* Controls */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '6px', background: '#FAFAFA' }}>
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
                  style={{ fontSize: '10px', padding: '2px 7px' }}
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
                style={{ fontSize: '10px', padding: '2px 7px' }}
              >
                {lang.label}
              </button>
            ))}

            <div style={{ marginLeft: 'auto' }}>
              <button
                type="button"
                className="sheets-btn"
                onClick={() => copyToClipboard(activeSnippet, `${selectedChannel.toUpperCase()} ${selectedLang.toUpperCase()} example`)}
                style={{ fontSize: '10px', padding: '2px 8px', fontWeight: '700' }}
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>

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
  window.AdminApiView = AdminApiView;
}

export default AdminApiView;
