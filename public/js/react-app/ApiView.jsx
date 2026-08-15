import React, { useState, useEffect } from 'react';

// API & Keys Integration Spreadsheet View
function ApiView({ t, session, revealedApiKey, setRevealedApiKey, copyToClipboard, showToast }) {
  // Dynamically deduce the origin from the current active browser link/host
  const currentOrigin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'http://localhost:8884';

  const [webhookUrl, setWebhookUrl] = useState(`${currentOrigin}/api/webhooks/otp88`);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setWebhookUrl(`${window.location.origin}/api/webhooks/otp88`);
    }
  }, []);

  const apiKey = session?.apiKeyLive || 'otp_live_88a90184bcedf41';
  const maskedKey = revealedApiKey ? apiKey : '••••••••••••••••••••••••••••••••';

  const curlSnippet = `curl -X POST ${currentOrigin}/v1/otp/send \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "+60123456789", "channel": "whatsapp", "otpCode": "882910"}'`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* API Key */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '10px', background: '#FFFFFF' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          {t.prodApiKey || 'API Key'}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input type="text" className="sheets-input sheets-input-code" readOnly value={maskedKey} />
          <button className="sheets-btn" onClick={() => setRevealedApiKey(!revealedApiKey)}>
            {revealedApiKey ? 'Hide' : 'Reveal'}
          </button>
          <button className="sheets-btn sheets-btn-primary" onClick={() => copyToClipboard(apiKey, 'API Key')}>
            {t.copyKey || 'Copy Key'}
          </button>
        </div>
      </div>

      {/* Webhook Configuration */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '10px', background: '#FFFFFF' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          {t.webhookUrl || 'Webhook URL'}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="url"
            className="sheets-input sheets-input-code"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
          <button className="sheets-btn sheets-btn-primary" onClick={() => showToast('Webhook URL saved!')}>
            {t.saveWebhook || 'Save Webhook'}
          </button>
        </div>
      </div>

      {/* Code Example */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '10px', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>
            {t.quickstartCode || 'API Code Example'}
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
