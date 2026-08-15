import React, { useState, useEffect, useRef } from 'react';
import WhatsAppWebhookTab from './WhatsAppWebhookTab.jsx';
import { TableLoader } from './TableLoader.jsx';

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
  const [savingConfig, setSavingConfig] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Edit Key Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalApiKey, setModalApiKey] = useState('');
  const editModalBackdropRef = useRef(false);

  // Send WhatsApp OTP state
  const [recipient, setRecipient] = useState('+60122273341');
  const [otpCode, setOtpCode] = useState('882049');
  const [channel, setChannel] = useState('whatsapp');
  const [lang, setLang] = useState('en');
  const [fallback, setFallback] = useState('no');
  const [template, setTemplate] = useState('default_otp');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);

  // Verify OTP state
  const [verifyPhone, setVerifyPhone] = useState('+60122273341');
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
      setLoadingData(true);
      fetch('/api/admin/whatsapp/config', { headers: { 'Authorization': `Bearer ${jwtToken}` } })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            if (data.config) setConfig(prev => ({ ...prev, ...data.config }));
            if (data.logs) setLogs(data.logs);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingData(false));
    }
  };

  useEffect(() => {
    loadData();
  }, [jwtToken]);

  useEffect(() => {
    if (!showEditModal) return;
    const handleKeyDown = (e) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && !savingConfig) setShowEditModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEditModal, savingConfig]);

  const handleOpenEditModal = () => {
    setModalApiKey(config.apiKey);
    setShowEditModal(true);
  };

  const handleSaveModal = async (e) => {
    if (e) e.preventDefault();
    setSavingConfig(true);
    const updated = { ...config, apiKey: modalApiKey.trim() };
    try {
      if (jwtToken) {
        const res = await fetch('/api/admin/whatsapp/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
          body: JSON.stringify(updated)
        });
        const data = await res.json();
        if (data.success) {
          setConfig(updated);
          setShowEditModal(false);
          if (showToast) showToast('✅ VerifyWay API Key saved!');
        }
      }
    } catch (err) {
      if (showToast) showToast('Error saving key.', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

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
        if (data.success && showToast) showToast('✅ VerifyWay WhatsApp API settings saved!');
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
      
      {/* Top Banner with Plain Text Key Display & Edit Key Button */}
      <div style={{ background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.08) 0%, rgba(18, 140, 126, 0.08) 100%)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '6px', background: 'linear-gradient(135deg, #25D366, #128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M17.472 14.382c-.301-.15-1.782-.879-2.057-.98-.276-.1-.476-.15-.676.15-.2.3-.777.98-.953 1.18-.175.2-.35.225-.65.075-.3-.15-1.267-.467-2.414-1.489-.893-.796-1.496-1.78-1.671-2.08-.175-.3-.019-.462.13-.612.136-.135.301-.35.451-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.63-.926-2.232-.243-.586-.49-.506-.676-.515-.175-.008-.375-.01-.576-.01-.2 0-.526.075-.802.375-.275.3-1.052 1.028-1.052 2.508 0 1.48 1.077 2.91 1.228 3.11.15.2 2.12 3.238 5.136 4.54 3.015 1.302 3.015.868 3.566.818.551-.05 1.782-.727 2.033-1.429.25-.701.25-1.302.175-1.428-.075-.126-.275-.201-.576-.351zM12.004 0C5.372 0 0 5.373 0 12c0 2.112.551 4.164 1.597 5.976L.063 23.414l5.608-1.471A11.942 11.942 0 0012.004 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zm0 21.956c-1.87 0-3.664-.51-5.22-1.477l-.374-.23-3.327.873.888-3.243-.243-.387A9.92 9.92 0 012.044 12c0-5.492 4.468-9.956 9.96-9.956 5.492 0 9.96 4.464 9.96 9.956 0 5.492-4.468 9.956-9.96 9.956z"/>
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>VerifyWay WhatsApp OTP API</h2>
              <span className="sheets-badge sheets-badge-emerald" style={{ fontSize: '10px', padding: '2px 6px' }}>● Active</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>https://verifyway.com/whatsapp-otp-api/</p>
          </div>
        </div>

        {/* Edit Key Action Button */}
        <div>
          <button
            type="button"
            onClick={handleOpenEditModal}
            className="sheets-btn sheets-btn-primary"
            style={{ fontSize: '11px', padding: '6px 14px', background: '#059669', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', fontWeight: '700', cursor: 'pointer' }}
          >
            Edit Key
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '2px' }}>
        {[{ id: 'send', label: '📤 1. Send WhatsApp OTP' }, { id: 'verify', label: '🔍 2. Verify & Validate OTP' }, { id: 'webhook', label: '🔔 3. Delivery Webhooks' }, { id: 'keys', label: '🔑 4. API Credentials & Settings' }, { id: 'docs', label: '📖 5. API Reference & Codes' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id)} className="sheets-btn" style={{ fontSize: '11px', fontWeight: '700', borderBottom: activeSubTab === tab.id ? '2px solid #25D366' : 'none', background: activeSubTab === tab.id ? '#F1F5F9' : 'transparent', color: activeSubTab === tab.id ? '#0F172A' : 'var(--text-secondary)' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: SEND WHATSAPP OTP */}
      {activeSubTab === 'send' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
            <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '700' }}>DISPATCH LIVE OTP PAYLOAD</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>POST /api/v1/</span>
            </div>
            <form onSubmit={handleSendOtp} style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Recipient Phone (`recipient`)</label>
                  <input type="tel" className="sheets-input" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="+60123456789" required style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)' }}>OTP Code (`code`)</label>
                    <button type="button" onClick={generateRandomOtp} style={{ fontSize: '10px', color: '#059669', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '700' }}>↻ Randomize</button>
                  </div>
                  <input type="text" className="sheets-input" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="882049" required style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)', letterSpacing: '2px', fontWeight: '700' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Channel (`channel`)</label>
                  <select className="sheets-input" value={channel} onChange={(e) => setChannel(e.target.value)} style={{ width: '100%', fontSize: '11px' }}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Language (`lang`)</label>
                  <select className="sheets-input" value={lang} onChange={(e) => setLang(e.target.value)} style={{ width: '100%', fontSize: '11px' }}>
                    <option value="en">EN (English)</option>
                    <option value="ms">MS (Bahasa Melayu)</option>
                    <option value="zh">ZH (Chinese)</option>
                    <option value="id">ID (Bahasa Indo)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>SMS Fallback</label>
                  <select className="sheets-input" value={fallback} onChange={(e) => setFallback(e.target.value)} style={{ width: '100%', fontSize: '11px' }}>
                    <option value="no">no (Disabled)</option>
                    <option value="yes">yes (Auto SMS)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Template</label>
                  <select className="sheets-input" value={template} onChange={(e) => setTemplate(e.target.value)} style={{ width: '100%', fontSize: '11px' }}>
                    <option value="default_otp">default_otp (Auth)</option>
                    <option value="login_security">login_security</option>
                    <option value="password_reset">password_reset</option>
                  </select>
                </div>
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
                  Send a test OTP on the left to inspect the live VerifyWay HTTP JSON response payload.
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
              LOCAL VERIFICATION & VALIDATION EXPLORER
            </div>
            <form onSubmit={handleVerifyOtp} style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Recipient Phone</label>
                <input type="tel" className="sheets-input" value={verifyPhone} onChange={(e) => setVerifyPhone(e.target.value)} placeholder="+60123456789" style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>6-Digit OTP Code</label>
                <input type="text" className="sheets-input" value={verifyInputCode} onChange={(e) => setVerifyInputCode(e.target.value)} placeholder="882049" maxLength={6} style={{ width: '100%', fontSize: '12px', fontFamily: 'var(--font-code)', letterSpacing: '3px', fontWeight: '700' }} />
              </div>
              <button type="submit" className="sheets-btn sheets-btn-primary" style={{ fontSize: '11px', padding: '6px 14px' }}>
                Verify OTP Match
              </button>
            </form>
          </div>

          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
            <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700' }}>
              VERIFICATION RESULT
            </div>
            <div style={{ padding: '12px' }}>
              {verifyResult ? (
                <div style={{ padding: '12px', borderRadius: '4px', background: verifyResult.valid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: `1px solid ${verifyResult.valid ? '#10B981' : '#EF4444'}` }}>
                  <div style={{ fontWeight: '800', fontSize: '13px', color: verifyResult.valid ? '#059669' : '#DC2626' }}>
                    {verifyResult.valid ? '✅ CODE MATCHED & VERIFIED' : '❌ VERIFICATION FAILED'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Timestamp: {verifyResult.timestamp}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  Enter a phone number and OTP code to verify match against recent transmissions.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DELIVERY WEBHOOKS */}
      {activeSubTab === 'webhook' && (
        <WhatsAppWebhookTab
          config={config}
          setConfig={setConfig}
          logs={logs}
          jwtToken={jwtToken}
          showToast={showToast}
          savingConfig={savingConfig}
          handleSaveConfig={handleSaveConfig}
          loadData={loadData}
        />
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
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>API_KEY (Bearer Token)</label>
              <input type="text" className="sheets-input" value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} placeholder="VerifyWay API Key" style={{ width: '100%', fontSize: '12px', fontFamily: 'var(--font-code)', fontWeight: '700' }} />
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
  -d '{\n    "recipient": "+60123456789",\n    "type": "otp",\n    "channel": "whatsapp",\n    "fallback": "no",\n    "code": "882049",\n    "lang": "en"\n  }'`}</pre>
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
              <th>Recipient Phone</th>
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
            {loadingData ? (
              <TableLoader colSpan={10} message="Loading VerifyWay WhatsApp dispatch logs..." />
            ) : logs.length === 0 ? (
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

      {/* EDIT KEY MODAL DIALOG (Plain Text Input) */}
      {showEditModal && (
        <div
          className="sheets-modal-backdrop"
          onMouseDown={(e) => { e.target === e.currentTarget ? editModalBackdropRef.current = true : editModalBackdropRef.current = false; }}
          onMouseUp={(e) => { if (editModalBackdropRef.current && e.target === e.currentTarget && !savingConfig) setShowEditModal(false); editModalBackdropRef.current = false; }}
        >
          <div className="sheets-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="sheets-modal-header">
              <span>Edit VerifyWay API Key</span>
              <button type="button" onClick={() => !savingConfig && setShowEditModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleSaveModal}>
              <div className="sheets-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    API_KEY (Bearer Token)
                  </label>
                  <input
                    type="text"
                    className="sheets-input"
                    value={modalApiKey}
                    onChange={(e) => setModalApiKey(e.target.value)}
                    placeholder="Enter VerifyWay API Key"
                    autoFocus
                    required
                    style={{ width: '100%', fontFamily: 'var(--font-code)', fontWeight: '700', fontSize: '12px' }}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                    Plain text visible for quick editing and copy-pasting.
                  </span>
                </div>
              </div>
              <div className="sheets-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="sheets-btn" onClick={() => setShowEditModal(false)} disabled={savingConfig}>Cancel</button>
                <button type="submit" className="sheets-btn sheets-btn-primary" disabled={savingConfig} style={{ background: '#059669' }}>{savingConfig ? 'Saving...' : 'Save Keys'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

if (typeof window !== 'undefined') {
  window.WhatsAppOtpView = WhatsAppOtpView;
}

export default WhatsAppOtpView;
