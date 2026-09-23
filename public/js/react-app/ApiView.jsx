import React, { useState, useEffect, useMemo } from 'react';
import { getCodeSnippet } from './apiSnippets';

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

  // Custom Email Brand Sender state
  const [brandName, setBrandName] = useState(session?.emailBrandName || '');
  const [brandHandle, setBrandHandle] = useState(session?.emailBrandHandle || '');
  const [replyTo, setReplyTo] = useState(session?.emailReplyTo || '');
  const [isSavingSender, setIsSavingSender] = useState(false);
  const [senderStatusMsg, setSenderStatusMsg] = useState(null);

  useEffect(() => {
    if (session?.emailBrandName !== undefined) setBrandName(session.emailBrandName || '');
    if (session?.emailBrandHandle !== undefined) setBrandHandle(session.emailBrandHandle || '');
    if (session?.emailReplyTo !== undefined) setReplyTo(session.emailReplyTo || '');
  }, [session?.emailBrandName, session?.emailBrandHandle, session?.emailReplyTo]);

  const cleanHandle = useMemo(() => {
    return (brandHandle || '')
      .trim()
      .toLowerCase()
      .replace(/@otp88\.top$/i, '')
      .replace(/\.otp88\.top$/i, '')
      .replace(/[^a-z0-9_-]/g, '');
  }, [brandHandle]);

  const effectivePreviewSender = useMemo(() => {
    const name = (brandName || '').trim() || 'SuperApp';
    const handle = cleanHandle || 'superapp';
    return `${name} <${handle}@otp88.top>`;
  }, [brandName, cleanHandle]);

  const handleSaveBrandSender = async (e) => {
    if (e) e.preventDefault();
    setIsSavingSender(true);
    setSenderStatusMsg(null);
    try {
      const token = jwtToken || localStorage.getItem('otp88_jwt');
      const res = await fetch('/api/user/email-sender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          brandName,
          brandHandle,
          replyTo
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update email sender');
      }
      setSenderStatusMsg({ type: 'success', text: `Saved! Outgoing sender: ${data.sender?.preview}` });
      if (showToast) showToast('Email brand sender updated successfully!', 'success');
      if (setSession) {
        setSession(prev => {
          const updated = {
            ...(prev || {}),
            emailBrandName: data.sender?.brandName,
            emailBrandHandle: data.sender?.brandHandle,
            emailReplyTo: data.sender?.replyTo
          };
          localStorage.setItem('otp88_session', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      setSenderStatusMsg({ type: 'error', text: err.message });
      if (showToast) showToast(err.message, 'error');
    } finally {
      setIsSavingSender(false);
    }
  };

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

      {/* 2. Custom Tenant Sub-Alias Card */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '12px', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📧</span>
            <span>Custom Email Brand Sender (Sub-Alias)</span>
          </div>
          <span style={{ fontSize: '10px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '2px 8px', fontWeight: '600' }}>
            Domain @otp88.top Verified • Zero DNS Setup Needed
          </span>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.4 }}>
          Send branded Email OTPs directly using your custom brand handle (e.g. <code>superapp@otp88.top</code> or <code>superapp.otp88.top</code>). Delivered as: <strong>From: SuperApp &lt;superapp@otp88.top&gt;</strong>.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Brand Display Name
            </label>
            <input
              type="text"
              className="sheets-input"
              placeholder="e.g. SuperApp"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Brand Handle / Sub-Alias
            </label>
            <input
              type="text"
              className="sheets-input"
              placeholder="e.g. superapp or superapp@otp88.top"
              value={brandHandle}
              onChange={(e) => setBrandHandle(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Reply-To Email (Optional)
            </label>
            <input
              type="email"
              className="sheets-input"
              placeholder="e.g. support@superapp.com"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Live Delivered Email Preview */}
        <div style={{ background: '#F8FAFC', border: '1px dashed var(--border-subtle)', borderRadius: '4px', padding: '8px 12px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '6px' }}>
              Delivered Email Header:
            </span>
            <code style={{ fontSize: '11px', color: '#0284C7', fontWeight: '700', background: '#E0F2FE', padding: '2px 6px', borderRadius: '3px' }}>
              From: {effectivePreviewSender}
            </code>
            {replyTo && (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                (Reply-To: {replyTo})
              </span>
            )}
          </div>
          <div style={{ fontSize: '10px', color: '#059669', fontWeight: '600' }}>
            ✓ Ready for production dispatch ($0.0020 / OTP)
          </div>
        </div>

        {/* Error / Success feedback */}
        {senderStatusMsg && (
          <div style={{
            fontSize: '11px',
            padding: '6px 10px',
            borderRadius: '4px',
            marginBottom: '8px',
            background: senderStatusMsg.type === 'error' ? '#FEE2E2' : '#D1FAE5',
            color: senderStatusMsg.type === 'error' ? '#991B1B' : '#065F46',
            border: senderStatusMsg.type === 'error' ? '1px solid #FCA5A5' : '1px solid #6EE7B7'
          }}>
            {senderStatusMsg.text}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            className="sheets-btn sheets-btn-primary"
            onClick={handleSaveBrandSender}
            disabled={isSavingSender}
            style={{ minWidth: '120px' }}
          >
            {isSavingSender ? 'Saving...' : 'Save Brand Sender'}
          </button>
        </div>
      </div>

      {/* 3. API Code Examples & Channel Selectors Card (Collapsible) */}
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
                    { id: 'telegram', label: 'Telegram OTP' },
                    { id: 'email', label: 'Email OTP ($0.0020)' }
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
