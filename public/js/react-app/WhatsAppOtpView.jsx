import React, { useState, useEffect } from 'react';

// Admin VerifyWay WhatsApp OTP API Complete Management & Interactive Explorer
function WhatsAppOtpView({ t, jwtToken, showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('send');

  // Credentials & Config (Stored in MongoDB Atlas)
  const [config, setConfig] = useState({
    apiKey: '',
    apiUrl: 'https://api.verifyway.com/api/v1/',
    channel: 'whatsapp',
    fallback: 'no',
    lang: 'en',
    template: 'default_otp',
    webhookUrl: 'https://api.otp88.com/api/webhooks/whatsapp/dlr',
    ratePerOtp: '0.0075',
    currency: 'MYR',
    status: 'ACTIVE'
  });
  const [showSecret, setShowSecret] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Send WhatsApp OTP state
  const [recipient, setRecipient] = useState('+60123456789');
  const [otpCode, setOtpCode] = useState('882049');
  const [channel, setChannel] = useState('whatsapp');
  const [lang, setLang] = useState('en');
  const [fallback, setFallback] = useState('no');
  const [template, setTemplate] = useState('default_otp');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);

  // Verify OTP state
  const [verifyPhone, setVerifyPhone] = useState('+60123456789');
  const [verifyInputCode, setVerifyInputCode] = useState('882049');
  const [verifyResult, setVerifyResult] = useState(null);

  const [logs, setLogs] = useState([]);

  // Generate random 6-digit OTP code
  const generateRandomOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(code);
    setVerifyInputCode(code);
  };

  // Fetch live stats and database config
  const loadData = () => {
    if (jwtToken) {
      fetch('/api/admin/whatsapp/config', { headers: { 'Authorization': `Bearer ${jwtToken}` } })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            if (data.config) setConfig(prev => ({ ...prev, ...data.config }));
            if (data.logs) setLogs(data.logs);
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    loadData();
  }, [jwtToken]);

  // Save Configuration to MongoDB
  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();
    setSavingConfig(true);
    try {
      if (jwtToken) {
        const res = await fetch('/api/admin/whatsapp/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
          body: JSON.stringify(config)
        });
        const data = await res.json();
        if (data.success && showToast) showToast('✅ VerifyWay WhatsApp API keys & settings saved!');
      }
    } catch (err) {
      if (showToast) showToast('Error saving settings.', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  // 1. Dispatch WhatsApp OTP via VerifyWay API v1
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!recipient.trim() || !otpCode.trim()) return;
    setSendingOtp(true);
    try {
      if (jwtToken) {
        const res = await fetch('/api/admin/whatsapp/test-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
          body: JSON.stringify({
            recipient: recipient.trim(),
            code: otpCode.trim(),
            channel,
            lang,
            fallback,
            template,
            apiKey: config.apiKey
          })
        });
        const data = await res.json();
        setApiResponse(data.response || data);
        if (showToast) showToast(`WhatsApp OTP dispatched to ${recipient}!`);
        loadData();
      }
    } catch (err) {
      if (showToast) showToast('Failed to dispatch WhatsApp OTP.', 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  // 2. Validate OTP local check
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const matched = logs.find(l => l.recipient.replace(/[^0-9]/g, '') === verifyPhone.replace(/[^0-9]/g, '') && l.code === verifyInputCode.trim());
    if (matched) {
      setVerifyResult({ valid: true, message: 'OTP Verified Successfully', timestamp: new Date().toLocaleTimeString(), details: matched });
      if (showToast) showToast('✅ OTP verified successfully!');
    } else {
      setVerifyResult({ valid: false, message: 'Invalid or Expired OTP code', timestamp: new Date().toLocaleTimeString() });
      if (showToast) showToast('❌ OTP code invalid or expired', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Top Banner with Inline Editable Credentials */}
      <div style={{ background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.08) 0%, rgba(18, 140, 126, 0.08) 100%)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '6px', background: 'linear-gradient(135deg, #25D366, #128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: '900', fontSize: '18px', boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)' }}>
            💬
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>VerifyWay WhatsApp OTP API</h2>
              <span className="sheets-badge sheets-badge-emerald" style={{ fontSize: '10px', padding: '2px 6px' }}>● Active</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>https://verifyway.com/whatsapp-otp-api/</p>
          </div>
        </div>

        {/* Editable API_KEY in Banner */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)' }}>API_KEY:</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showSecret ? 'text' : 'password'}
                className="sheets-input"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="Bearer API Key"
                style={{ width: '220px', fontSize: '11px', fontFamily: 'var(--font-code)', padding: '3px 22px 3px 6px' }}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', padding: 0, color: 'var(--text-muted)' }}
                title={showSecret ? 'Hide' : 'Show'}
              >
                {showSecret ? '👁️' : '🔒'}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={savingConfig}
            className="sheets-btn sheets-btn-primary"
            style={{ fontSize: '10px', padding: '4px 10px', background: '#059669', whiteSpace: 'nowrap' }}
          >
            {savingConfig ? 'Saving...' : 'Save Keys'}
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '2px' }}>
        <button onClick={() => setActiveSubTab('send')} className="sheets-btn" style={{ fontSize: '11px', fontWeight: '700', borderBottom: activeSubTab === 'send' ? '2px solid #25D366' : 'none', background: activeSubTab === 'send' ? '#F1F5F9' : 'transparent', color: activeSubTab === 'send' ? '#0F172A' : 'var(--text-secondary)' }}>
          📤 1. Send WhatsApp OTP
        </button>
        <button onClick={() => setActiveSubTab('verify')} className="sheets-btn" style={{ fontSize: '11px', fontWeight: '700', borderBottom: activeSubTab === 'verify' ? '2px solid #25D366' : 'none', background: activeSubTab === 'verify' ? '#F1F5F9' : 'transparent', color: activeSubTab === 'verify' ? '#0F172A' : 'var(--text-secondary)' }}>
          🔍 2. Verify & Validate OTP
        </button>
        <button onClick={() => setActiveSubTab('webhook')} className="sheets-btn" style={{ fontSize: '11px', fontWeight: '700', borderBottom: activeSubTab === 'webhook' ? '2px solid #25D366' : 'none', background: activeSubTab === 'webhook' ? '#F1F5F9' : 'transparent', color: activeSubTab === 'webhook' ? '#0F172A' : 'var(--text-secondary)' }}>
          🔔 3. Delivery Webhooks
        </button>
        <button onClick={() => setActiveSubTab('keys')} className="sheets-btn" style={{ fontSize: '11px', fontWeight: '700', borderBottom: activeSubTab === 'keys' ? '2px solid #25D366' : 'none', background: activeSubTab === 'keys' ? '#F1F5F9' : 'transparent', color: activeSubTab === 'keys' ? '#0F172A' : 'var(--text-secondary)' }}>
          🔑 4. API Credentials & Settings
        </button>
        <button onClick={() => setActiveSubTab('docs')} className="sheets-btn" style={{ fontSize: '11px', fontWeight: '700', borderBottom: activeSubTab === 'docs' ? '2px solid #25D366' : 'none', background: activeSubTab === 'docs' ? '#F1F5F9' : 'transparent', color: activeSubTab === 'docs' ? '#0F172A' : 'var(--text-secondary)' }}>
          📖 5. API Reference & Codes
        </button>
      </div>

      {/* SUB-TAB 1: SEND WHATSAPP OTP API */}
      {activeSubTab === 'send' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
            <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '700' }}>DISPATCH WHATSAPP OTP (VERIFYWAY API)</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>POST https://api.verifyway.com/api/v1/</span>
            </div>
            <form onSubmit={handleSendOtp} style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Recipient (`recipient` - E.164 format)</label>
                  <input type="text" className="sheets-input" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="+60123456789" style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)' }}>OTP Code (`code`)</label>
                    <button type="button" onClick={generateRandomOtp} className="sheets-btn" style={{ fontSize: '9px', padding: '0 4px', background: 'none', border: 'none', color: '#0284C7', cursor: 'pointer' }}>🎲 Random</button>
                  </div>
                  <input type="text" className="sheets-input" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="882049" style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)', fontWeight: '700' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Channel (`channel`)</label>
                  <select className="sheets-input" value={channel} onChange={(e) => setChannel(e.target.value)} style={{ width: '100%', fontSize: '11px' }}>
                    <option value="whatsapp">WhatsApp (Official Cloud API)</option>
                    <option value="telegram">Telegram (Secondary Channel)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Language (`lang`)</label>
                  <select className="sheets-input" value={lang} onChange={(e) => setLang(e.target.value)} style={{ width: '100%', fontSize: '11px' }}>
                    <option value="en">English (en)</option>
                    <option value="ms">Bahasa Melayu (ms)</option>
                    <option value="zh">Chinese (zh)</option>
                    <option value="id">Indonesian (id)</option>
                    <option value="ar">Arabic (ar)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>SMS Fallback (`fallback`)</label>
                  <select className="sheets-input" value={fallback} onChange={(e) => setFallback(e.target.value)} style={{ width: '100%', fontSize: '11px' }}>
                    <option value="no">no (Disabled)</option>
                    <option value="yes">yes (Auto SMS Fallback)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Template (`template`)</label>
                  <select className="sheets-input" value={template} onChange={(e) => setTemplate(e.target.value)} style={{ width: '100%', fontSize: '11px' }}>
                    <option value="default_otp">default_otp (Standard Code)</option>
                    <option value="security_login">security_login (Login Verification)</option>
                    <option value="password_reset">password_reset (Password Reset)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Authorization Bearer Key</label>
                <input type={showSecret ? 'text' : 'password'} className="sheets-input" value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} placeholder="Enter VerifyWay API Key" style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '4px' }}>
                <button type="submit" disabled={sendingOtp} className="sheets-btn sheets-btn-primary" style={{ fontSize: '11px', padding: '6px 16px', background: '#25D366' }}>
                  {sendingOtp ? 'Sending via VerifyWay...' : 'Submit to VerifyWay API'}
                </button>
              </div>
            </form>
          </div>

          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
            <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700' }}>
              REAL-TIME HTTP JSON RESPONSE INSPECTOR
            </div>
            <div style={{ padding: '12px' }}>
              {apiResponse ? (
                <div style={{ background: '#0F172A', color: '#38BDF8', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-code)', fontSize: '11px', overflowX: 'auto' }}>
                  <pre style={{ margin: 0 }}>{JSON.stringify(apiResponse, null, 2)}</pre>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  Send a test message on the left to inspect the returned JSON response from VerifyWay API.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: VERIFY & VALIDATE OTP */}
      {activeSubTab === 'verify' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
            <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700' }}>
              VALIDATE RECIPIENT OTP CODE
            </div>
            <form onSubmit={handleVerifyOtp} style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Recipient Phone Number</label>
                <input type="text" className="sheets-input" value={verifyPhone} onChange={(e) => setVerifyPhone(e.target.value)} placeholder="+60123456789" style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>User Input OTP Code</label>
                <input type="text" className="sheets-input" value={verifyInputCode} onChange={(e) => setVerifyInputCode(e.target.value)} placeholder="6-digit OTP code" style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
              </div>
              <button type="submit" className="sheets-btn sheets-btn-primary" style={{ fontSize: '11px', padding: '6px 14px', background: '#0284C7' }}>
                Verify OTP Code
              </button>
            </form>
          </div>

          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
            <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700' }}>
              VERIFICATION RESULT
            </div>
            <div style={{ padding: '12px' }}>
              {verifyResult ? (
                <div style={{ padding: '12px', borderRadius: '4px', background: verifyResult.valid ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${verifyResult.valid ? '#A7F3D0' : '#FECACA'}` }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: verifyResult.valid ? '#059669' : '#DC2626' }}>
                    {verifyResult.valid ? '✅ VALID CODE' : '❌ INVALID CODE'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-primary)', marginTop: '4px' }}>{verifyResult.message}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Checked at {verifyResult.timestamp}</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  Enter recipient phone and OTP code on the left to validate.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DELIVERY WEBHOOKS */}
      {activeSubTab === 'webhook' && (
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
          <div style={{ background: '#F8FAFC', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', fontSize: '12px', fontWeight: '800' }}>
            DELIVERY NOTIFICATION & STATUS WEBHOOK (DLR)
          </div>
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>VerifyWay dispatches real-time delivery and read receipts to your webhook endpoint.</p>
            <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Webhook Endpoint URL:</div>
              <input type="text" className="sheets-input" value={config.webhookUrl} onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })} style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '4px' }}>Incoming Webhook Payload Format:</div>
            <div style={{ background: '#0F172A', color: '#38BDF8', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-code)', fontSize: '11px' }}>
              <pre style={{ margin: 0 }}>{`{
  "id": "VW_OTP_882049",
  "status": "DELIVERED",
  "channel": "whatsapp",
  "recipient": "+60123456789",
  "error_code": 0,
  "timestamp": "2026-08-15T20:00:00Z"
}`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: API CREDENTIALS & SETTINGS */}
      {activeSubTab === 'keys' && (
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
          <div style={{ background: '#F8FAFC', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800' }}>🔑 VERIFYWAY API CREDENTIALS & SETTINGS</span>
            <span className="sheets-badge sheets-badge-emerald" style={{ fontSize: '9px', padding: '1px 5px' }}>● Saved</span>
          </div>

          <form onSubmit={handleSaveConfig} style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)' }}>API_KEY (Bearer Token)</label>
                <button type="button" onClick={() => setShowSecret(!showSecret)} className="sheets-btn" style={{ fontSize: '9px', padding: '1px 4px' }}>{showSecret ? 'Hide' : 'Show'}</button>
              </div>
              <input type={showSecret ? 'text' : 'password'} className="sheets-input" value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} placeholder="VerifyWay API Key" style={{ width: '100%', fontSize: '12px', fontFamily: 'var(--font-code)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>API Endpoint URL</label>
                <input type="text" className="sheets-input" value={config.apiUrl} onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })} style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Unit Rate (MYR/OTP)</label>
                <input type="text" className="sheets-input" value={config.ratePerOtp} onChange={(e) => setConfig({ ...config, ratePerOtp: e.target.value })} style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Default Channel</label>
                <select className="sheets-input" value={config.channel} onChange={(e) => setConfig({ ...config, channel: e.target.value })} style={{ width: '100%', fontSize: '11px' }}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Default Fallback</label>
                <select className="sheets-input" value={config.fallback} onChange={(e) => setConfig({ ...config, fallback: e.target.value })} style={{ width: '100%', fontSize: '11px' }}>
                  <option value="no">no (Disabled)</option>
                  <option value="yes">yes (Auto SMS Fallback)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Gateway Status</label>
                <select className="sheets-input" value={config.status} onChange={(e) => setConfig({ ...config, status: e.target.value })} style={{ width: '100%', fontSize: '11px' }}>
                  <option value="ACTIVE">ACTIVE (Primary Route)</option>
                  <option value="BACKUP">BACKUP (Secondary)</option>
                  <option value="PAUSED">PAUSED (Maintenance)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button type="submit" disabled={savingConfig} className="sheets-btn sheets-btn-primary" style={{ fontSize: '11px', fontWeight: '700', padding: '8px 18px', background: '#059669' }}>
                {savingConfig ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 5: API REFERENCE & ERROR CODES */}
      {activeSubTab === 'docs' && (
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
          <div style={{ background: '#F8FAFC', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', fontSize: '12px', fontWeight: '800' }}>
            VERIFYWAY WHATSAPP OTP API SPECIFICATION & CODES
          </div>
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <table className="sheets-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Parameter</th>
                  <th style={{ width: '80px' }}>Type</th>
                  <th style={{ width: '90px' }}>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>recipient</td>
                  <td>string</td>
                  <td><span className="sheets-badge sheets-badge-emerald">Yes</span></td>
                  <td>The user's phone number in E.164 format (e.g., +60123456789).</td>
                </tr>
                <tr>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>type</td>
                  <td>string</td>
                  <td><span className="sheets-badge sheets-badge-emerald">Yes</span></td>
                  <td>Must be set to "otp".</td>
                </tr>
                <tr>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>channel</td>
                  <td>string</td>
                  <td><span className="sheets-badge sheets-badge-emerald">Yes</span></td>
                  <td>Must be set to "whatsapp" (or "telegram").</td>
                </tr>
                <tr>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>code</td>
                  <td>string</td>
                  <td><span className="sheets-badge sheets-badge-emerald">Yes</span></td>
                  <td>The OTP code to be sent (e.g., "123456").</td>
                </tr>
                <tr>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>lang</td>
                  <td>string</td>
                  <td><span className="sheets-badge sheets-badge-gray">No</span></td>
                  <td>Language code (default is "en", "ms", "zh", "id", "ar").</td>
                </tr>
                <tr>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>fallback</td>
                  <td>string</td>
                  <td><span className="sheets-badge sheets-badge-gray">No</span></td>
                  <td>Set to "yes" to enable automatic SMS fallback.</td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '6px' }}>Example cURL Request:</div>
            <div style={{ background: '#0F172A', color: '#38BDF8', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-code)', fontSize: '11px', overflowX: 'auto' }}>
              <pre style={{ margin: 0 }}>{`curl -X POST https://api.verifyway.com/api/v1/ \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json' \\
  -d '{
    "recipient": "+60123456789",
    "type": "otp",
    "channel": "whatsapp",
    "fallback": "no",
    "code": "882049",
    "lang": "en"
  }'`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Transmission & Delivery Logs Table */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>VERIFYWAY DISPATCH & OTP LOGS</span>
          <span style={{ color: 'var(--text-muted)' }}>{logs.length} entries</span>
        </div>
        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '35px' }}>#</th>
              <th>Message ID</th>
              <th>Recipient</th>
              <th>Channel</th>
              <th>OTP Code</th>
              <th>Fallback</th>
              <th>Cost</th>
              <th>Status</th>
              <th>Latency</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '14px', color: 'var(--text-muted)' }}>No logs recorded yet.</td></tr>
            ) : (
              logs.map((l, i) => (
                <tr key={l.id || i}>
                  <td style={{ fontFamily: 'var(--font-code)', fontSize: '10px', color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>{l.id}</td>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>{l.recipient}</td>
                  <td><span style={{ fontFamily: 'var(--font-code)', fontSize: '10px', background: '#DCFCE7', color: '#166534', padding: '2px 4px', borderRadius: '3px' }}>{l.channel}</span></td>
                  <td><strong style={{ fontFamily: 'var(--font-code)' }}>{l.code}</strong></td>
                  <td>{l.fallback}</td>
                  <td style={{ fontFamily: 'var(--font-code)' }}>{l.cost}</td>
                  <td><span className="sheets-badge sheets-badge-emerald">{l.status}</span></td>
                  <td style={{ fontFamily: 'var(--font-code)', color: '#059669' }}>{l.latency}</td>
                  <td style={{ fontFamily: 'var(--font-code)', color: 'var(--text-muted)' }}>{l.timestamp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

if (typeof window !== 'undefined') {
  window.WhatsAppOtpView = WhatsAppOtpView;
}

export default WhatsAppOtpView;
