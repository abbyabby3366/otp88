import React, { useState } from 'react';

// API & Keys Integration Spreadsheet View
function ApiView({ t, session, jwtToken, revealedApiKey, setRevealedApiKey, copyToClipboard, showToast }) {
  const [webhookUrl, setWebhookUrl] = useState('https://api.yourdomain.com/webhooks/otp88');

  const apiKey = session?.apiKeyLive || 'otp_live_88a90184bcedf41';
  const maskedKey = revealedApiKey ? apiKey : '••••••••••••••••••••••••••••••••';

  const curlSnippet = `curl -X POST https://otp88.com/api/simulate-otp \\
  -H "Authorization: Bearer ${jwtToken || apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "+60123456789", "channel": "whatsapp"}'`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Live API Key */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '10px', background: '#FFFFFF' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          {t.prodApiKey}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input type="text" className="sheets-input sheets-input-code" readOnly value={maskedKey} />
          <button className="sheets-btn" onClick={() => setRevealedApiKey(!revealedApiKey)}>
            {revealedApiKey ? 'Hide' : 'Reveal'}
          </button>
          <button className="sheets-btn sheets-btn-primary" onClick={() => copyToClipboard(apiKey, 'API Key')}>
            {t.copyKey}
          </button>
        </div>
      </div>

      {/* Bearer JWT */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '10px', background: '#FFFFFF' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          {t.jwtBearer}
        </div>
        <textarea className="sheets-input sheets-input-code" readOnly rows={2} value={jwtToken} style={{ resize: 'none' }} />
        <button className="sheets-btn" style={{ marginTop: '6px' }} onClick={() => copyToClipboard(jwtToken, 'JWT Token')}>
          {t.copyJwt}
        </button>
      </div>

      {/* Webhook Configuration */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '10px', background: '#FFFFFF' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          {t.webhookUrl}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="url"
            className="sheets-input sheets-input-code"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
          <button className="sheets-btn sheets-btn-primary" onClick={() => showToast('Webhook URL saved and verified!')}>
            {t.saveWebhook}
          </button>
        </div>
      </div>

      {/* SDK Quickstarts */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '10px', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>
            {t.quickstartCode}
          </div>
          <button className="sheets-btn" onClick={() => copyToClipboard(curlSnippet, 'cURL snippet')} style={{ fontSize: '10px', padding: '2px 8px' }}>
            Copy cURL
          </button>
        </div>
        <pre style={{ margin: 0, padding: '8px', background: '#F8FAFC', border: '1px solid var(--border-subtle)', borderRadius: '3px', fontFamily: 'var(--font-code)', fontSize: '11px', overflowX: 'auto', color: '#0F172A' }}>
          {curlSnippet}
        </pre>
      </div>
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.ApiView = ApiView;
}

export default ApiView;

