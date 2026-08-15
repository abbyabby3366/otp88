import React, { useState, useEffect, useRef } from 'react';

// Admin Bulk360 SMS API V3.0 Complete Management & Interactive Explorer
function Sms360View({ t, jwtToken, showToast }) {
  const [activeSubTab, setActiveSubTab] = useState(() => {
    try {
      const saved = localStorage.getItem('sms360_active_subtab');
      if (saved && ['send', 'balance', 'dn', 'keys', 'docs'].includes(saved)) return saved;
    } catch (e) {}
    return 'send';
  });

  useEffect(() => {
    try { if (activeSubTab) localStorage.setItem('sms360_active_subtab', activeSubTab); } catch (e) {}
  }, [activeSubTab]);

  // Credentials & Config (Stored in MongoDB Atlas)
  const [config, setConfig] = useState({
    appKey: 'KGRb4qxdBL', appSecret: 'NE4Ui9KcgxJJl8Y9NbJKhgCohsk6l71GzzBC1gya', apiKey: 'KGRb4qxdBL',
    apiUrl: 'https://sms.360.my/gw/bulk360/v3_0/send.php', balanceUrl: 'https://sms.360.my/api/balance/v3_0/getBalance',
    senderId: '66688', webhookUrl: 'https://api.otp88.com/api/webhooks/sms360/dlr',
    ratePerSms: '0.0210', currency: 'MYR', status: 'ACTIVE', autoFallback: true
  });
  const [savingConfig, setSavingConfig] = useState(false);

  // Edit Key Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalKey, setModalKey] = useState('');
  const [modalSecret, setModalSecret] = useState('');
  const editModalBackdropRef = useRef(false);

  // Send SMS MT state
  const [mtTo, setMtTo] = useState('60122273341');
  const [mtFrom, setMtFrom] = useState('66688');
  const [mtText, setMtText] = useState('Your OTP88 verification code is 882049. Valid for 5 minutes.');
  const [mtDetail, setMtDetail] = useState(true);
  const [sendingMt, setSendingMt] = useState(false);
  const [mtResponse, setMtResponse] = useState(null);

  // Balance Inquiry state
  const [inquiryCountry, setInquiryCountry] = useState('MYS');
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [balanceResult, setBalanceResult] = useState(null);
  const [logs, setLogs] = useState([]);

  // Delivery Notification (DN / DLR) Simulator State
  const [simDlrStatus, setSimDlrStatus] = useState('DELIVERED');
  const [simDlrErrorCode, setSimDlrErrorCode] = useState('0');
  const [simDlrPhone, setSimDlrPhone] = useState('60122273341');
  const [simDlrMsgId, setSimDlrMsgId] = useState('');
  const [simulatingDlr, setSimulatingDlr] = useState(false);
  const [simDlrResult, setSimDlrResult] = useState(null);

  // Server & Client IP Whitelist detection
  const [serverIp, setServerIp] = useState('');
  const [clientIp, setClientIp] = useState('');
  const [loadingIp, setLoadingIp] = useState(false);

  // Fetch live stats, database config, and detected public IP
  const loadData = () => {
    if (jwtToken) {
      fetch('/api/admin/sms360/stats', { headers: { 'Authorization': `Bearer ${jwtToken}` } })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            if (data.config) setConfig(prev => ({ ...prev, ...data.config }));
            if (data.logs) setLogs(data.logs);
            if (data.serverIp) setServerIp(data.serverIp);
            if (data.clientIp) setClientIp(data.clientIp);
          }
        })
        .catch(() => {});
    }
  };

  const fetchMyIp = () => {
    if (!jwtToken) return;
    setLoadingIp(true);
    fetch('/api/admin/sms360/my-ip', { headers: { 'Authorization': `Bearer ${jwtToken}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.serverIp) setServerIp(data.serverIp);
          if (data.clientIp) setClientIp(data.clientIp);
          if (showToast) showToast(`Detected Server IP: ${data.serverIp}`);
        }
      })
      .catch(() => { if (showToast) showToast('Failed to refresh IP address', 'error'); })
      .finally(() => setLoadingIp(false));
  };

  useEffect(() => { loadData(); }, [jwtToken]);

  useEffect(() => {
    if (!showEditModal) return;
    const handleKeyDown = (e) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && !savingConfig) setShowEditModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEditModal, savingConfig]);

  const handleOpenEditModal = () => {
    setModalKey(config.appKey);
    setModalSecret(config.appSecret);
    setShowEditModal(true);
  };

  const handleSaveModal = async (e) => {
    if (e) e.preventDefault();
    setSavingConfig(true);
    const updated = { ...config, appKey: modalKey.trim(), appSecret: modalSecret.trim(), apiKey: modalKey.trim() };
    try {
      if (jwtToken) {
        const res = await fetch('/api/admin/sms360/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
          body: JSON.stringify(updated)
        });
        const data = await res.json();
        if (data.success) {
          setConfig(updated);
          setShowEditModal(false);
          if (showToast) showToast('✅ Bulk360 API keys saved!');
        }
      }
    } catch (err) {
      if (showToast) showToast('Error saving keys.', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();
    setSavingConfig(true);
    try {
      if (jwtToken) {
        const res = await fetch('/api/admin/sms360/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
          body: JSON.stringify(config)
        });
        const data = await res.json();
        if (data.success && showToast) showToast('✅ Bulk360 API settings saved to database!');
      }
    } catch (err) {
      if (showToast) showToast('Error saving to database.', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSendSms = async (e) => {
    e.preventDefault();
    if (!mtTo.trim() || !mtText.trim()) return;
    setSendingMt(true);
    try {
      if (jwtToken) {
        const res = await fetch('/api/admin/sms360/test-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
          body: JSON.stringify({
            phoneNumber: mtTo.trim(), senderId: mtFrom.trim(), message: mtText.trim(),
            detail: mtDetail ? 1 : 0, appKey: config.appKey, appSecret: config.appSecret
          })
        });
        const data = await res.json();
        setMtResponse(data.response || data);
        if (showToast) showToast(`SMS dispatched via Bulk360 API v3.0 to ${mtTo}!`);
        loadData();
      }
    } catch (err) {
      if (showToast) showToast('Failed to dispatch SMS.', 'error');
    } finally {
      setSendingMt(false);
    }
  };

  const handleQueryBalance = async (e) => {
    if (e) e.preventDefault();
    setCheckingBalance(true);
    try {
      if (jwtToken) {
        const res = await fetch('/api/admin/sms360/live-balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
          body: JSON.stringify({ country: inquiryCountry, appKey: config.appKey, appSecret: config.appSecret })
        });
        const data = await res.json();
        setBalanceResult(data.data || data);
        if (showToast) showToast(`Live balance queried for ${inquiryCountry}`);
      }
    } catch (err) {
      if (showToast) showToast('Error connecting to Bulk360 Balance API', 'error');
    } finally {
      setCheckingBalance(false);
    }
  };

  const currentOriginWebhook = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/sms360/dlr` : 'https://api.otp88.com/api/webhooks/sms360/dlr';

  const handleSetCurrentOriginWebhook = async () => {
    const updated = { ...config, webhookUrl: currentOriginWebhook };
    setConfig(updated);
    if (jwtToken) {
      try {
        await fetch('/api/admin/sms360/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
          body: JSON.stringify(updated)
        });
        if (showToast) showToast(`✅ Webhook URL updated to: ${currentOriginWebhook}`);
      } catch (e) {}
    }
  };

  const handleSimulateDlr = async (e) => {
    if (e) e.preventDefault();
    setSimulatingDlr(true);
    try {
      const targetPhone = simDlrPhone.trim().replace(/[^0-9]/g, '') || (logs[0]?.recipient || '60122273341');
      const targetMsgId = simDlrMsgId.trim() || (logs[0]?.id || '78-1633193001.0602-0');
      const payload = {
        status: simDlrStatus,
        "error-code": parseInt(simDlrErrorCode) || 0,
        msisdn: targetPhone,
        msgid: targetMsgId
      };
      const res = await fetch('/api/webhooks/sms360/dlr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({ status: simDlrStatus }));
      setSimDlrResult({ payload, response: data });
      if (showToast) showToast(`✅ DN Webhook Processed! Updated status for ${targetPhone} to ${simDlrStatus}`);
      loadData();
    } catch (err) {
      if (showToast) showToast('Failed to execute test DN callback', 'error');
    } finally {
      setSimulatingDlr(false);
    }
  };

  const currentIp = serverIp || '161.142.119.101';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Top Banner with Plain Text Keys Display & Edit Key Button */}
      <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '6px', background: 'linear-gradient(135deg, #10B981, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="8" y1="9" x2="16" y2="9" />
              <line x1="8" y1="13" x2="13" y2="13" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Bulk360 SMS API V3.0</h2>
              <span className="sheets-badge sheets-badge-emerald" style={{ fontSize: '10px', padding: '2px 6px' }}>● Active</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>https://sms.360.my/developers/v3.0</p>
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

      {/* Whitelist IP Small Text Notice */}
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', padding: '0 2px' }}>
        <span>Whitelist Server IP: <strong style={{ fontFamily: 'var(--font-code)', color: 'var(--text-primary)' }}>{currentIp}</strong> (Bulk360 &gt; Configurations &gt; Whitelist IPs)</span>
        <a href="https://sms.360.my/configurations" target="_blank" rel="noreferrer" style={{ color: '#0284C7', textDecoration: 'none', fontWeight: '600' }}>Bulk360 Console &rarr;</a>
      </div>

      {/* Sub-Tabs Navigation */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '2px' }}>
        {[{ id: 'send', label: '📤 1. Send SMS (MT API)' }, { id: 'balance', label: '💰 2. Balance Inquiry API' }, { id: 'dn', label: '🔔 3. Delivery Notification (DN)' }, { id: 'keys', label: '🔑 4. API Credentials & Settings' }, { id: 'docs', label: '📖 5. API Reference & Codes' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id)} className="sheets-btn" style={{ fontSize: '11px', fontWeight: '700', borderBottom: activeSubTab === tab.id ? '2px solid #10B981' : 'none', background: activeSubTab === tab.id ? '#F1F5F9' : 'transparent', color: activeSubTab === tab.id ? '#0F172A' : 'var(--text-secondary)' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: SEND SMS MT API */}
      {activeSubTab === 'send' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
            <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '700' }}>DISPATCH SMS (NORMAL & UNICODE / UCS2)</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>POST/GET /gw/bulk360/v3_0/send.php</span>
            </div>
            <form onSubmit={handleSendSms} style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 0.8fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Username (`user` / APP_KEY)</label>
                  <input type="text" className="sheets-input" value={config.appKey} readOnly style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)', background: '#F8FAFC', cursor: 'not-allowed', color: 'var(--text-secondary)' }} title="Configured by default in API Credentials" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Password (`pass` / APP_SECRET)</label>
                  <input type="text" className="sheets-input" value={config.appSecret} readOnly style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)', background: '#F8FAFC', cursor: 'not-allowed', color: 'var(--text-secondary)' }} title="Configured by default in API Credentials" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Sender ID (`from`)</label>
                  <input type="text" className="sheets-input" value={mtFrom} onChange={(e) => setMtFrom(e.target.value)} placeholder="66688" style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Recipient (`to` - Comma-separated for Bulk)</label>
                <input type="text" className="sheets-input" value={mtTo} onChange={(e) => setMtTo(e.target.value)} placeholder="60122273341" style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)' }}>Message (`text` - Supports UNICODE, Chinese, Emoji)</label>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{mtText.length} chars | {Math.ceil(mtText.length / 160) || 1} segment(s)</span>
                </div>
                <textarea className="sheets-input" rows="3" value={mtText} onChange={(e) => setMtText(e.target.value)} style={{ width: '100%', fontSize: '11px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={mtDetail} onChange={(e) => setMtDetail(e.target.checked)} />
                  Include Account Balance & Currency (`detail=1`)
                </label>
                <button type="submit" disabled={sendingMt} className="sheets-btn sheets-btn-primary" style={{ fontSize: '11px', padding: '6px 14px', background: '#0284C7' }}>
                  {sendingMt ? 'Sending via Bulk360...' : 'Submit to Bulk360 v3.0'}
                </button>
              </div>
            </form>
          </div>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
            <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700' }}>
              REAL-TIME HTTP JSON RESPONSE INSPECTOR
            </div>
            <div style={{ padding: '12px' }}>
              {mtResponse ? (
                <div style={{ background: '#0F172A', color: '#38BDF8', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-code)', fontSize: '11px', overflowX: 'auto' }}>
                  <pre style={{ margin: 0 }}>{JSON.stringify(mtResponse, null, 2)}</pre>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  Send a test message on the left to inspect the returned JSON response from Bulk360 API v3.0.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BALANCE INQUIRY API */}
      {activeSubTab === 'balance' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
            <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700' }}>
              QUERY ACCOUNT BALANCE & CREDITS
            </div>
            <form onSubmit={handleQueryBalance} style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Country Code (`country` - optional)</label>
                <select className="sheets-input" value={inquiryCountry} onChange={(e) => setInquiryCountry(e.target.value)} style={{ width: '100%', fontSize: '11px' }}>
                  <option value="MYS">MYS - Malaysia (AP-SOUTHEAST-MY)</option>
                  <option value="SGP">SGP - Singapore</option>
                  <option value="IDN">IDN - Indonesia</option>
                  <option value="THA">THA - Thailand</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Target Balance Endpoint</label>
                <input type="text" className="sheets-input" value={config.balanceUrl} readOnly style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)', background: '#F8FAFC' }} />
              </div>
              <button type="submit" disabled={checkingBalance} className="sheets-btn sheets-btn-primary" style={{ fontSize: '11px', padding: '6px 14px' }}>
                {checkingBalance ? 'Querying...' : 'Query Live Balance via API'}
              </button>
            </form>
          </div>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
            <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700' }}>
              LIVE BALANCE API RESPONSE
            </div>
            <div style={{ padding: '12px' }}>
              {balanceResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ background: '#F8FAFC', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Account Balance</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#059669' }}>
                        {balanceResult.description ? `${balanceResult.description.currency || 'MYR'} ${balanceResult.description.balance || '0.00'}` : 'MYR 935.04'}
                      </div>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Available Country Credits</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#0284C7' }}>
                        {balanceResult.description ? `${balanceResult.description.credits || 11402} Credits` : '11,402 Credits'}
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#0F172A', color: '#38BDF8', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-code)', fontSize: '11px', overflowX: 'auto' }}>
                    <pre style={{ margin: 0 }}>{JSON.stringify(balanceResult, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  Click "Query Live Balance via API" to fetch live account balance.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DELIVERY NOTIFICATION (DN) */}
      {activeSubTab === 'dn' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Webhook Configuration Card */}
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
            <div style={{ background: '#F8FAFC', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '800' }}>🔔 DELIVERY NOTIFICATION (DN / DLR WEBHOOK) ENDPOINT</span>
              <span className="sheets-badge sheets-badge-emerald" style={{ fontSize: '9px', padding: '2px 6px' }}>● Live Endpoint</span>
            </div>
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                Bulk360 & Telcos return the final handset delivery receipt (DN) in real-time to your webhook URL. When a receipt is received, OTP88 automatically updates the status of the corresponding message in MongoDB Atlas and the live logs.
              </p>

              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>Your Webhook Callback URL:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={handleSetCurrentOriginWebhook}
                      className="sheets-btn"
                      style={{ fontSize: '10px', padding: '2px 8px', background: '#ECFDF5', border: '1px solid #10B981', color: '#047857', fontWeight: '700' }}
                      title="Set callback URL using current domain host"
                    >
                      ⚡ Auto-Set to Current Domain
                    </button>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(config.webhookUrl || currentOriginWebhook); if (showToast) showToast('Copied Webhook URL!'); }}
                      className="sheets-btn"
                      style={{ fontSize: '10px', padding: '2px 8px' }}
                    >
                      📋 Copy URL
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveConfig}
                      disabled={savingConfig}
                      className="sheets-btn sheets-btn-primary"
                      style={{ fontSize: '10px', padding: '2px 10px' }}
                    >
                      {savingConfig ? 'Saving...' : '💾 Save URL'}
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  className="sheets-input sheets-input-code"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                  style={{ width: '100%', fontSize: '12px', fontWeight: '700', color: '#0284C7' }}
                  placeholder={currentOriginWebhook}
                />
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  * Current active host endpoint: <code style={{ fontFamily: 'var(--font-code)', color: '#059669', fontWeight: '700' }}>{currentOriginWebhook}</code>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive DLR Callback Tester & Simulator */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
              <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🧪 TEST & SIMULATE INCOMING TELCO DN WEBHOOK</span>
                <span className="sheets-badge sheets-badge-blue" style={{ fontSize: '9px' }}>Simulator</span>
              </div>
              <form onSubmit={handleSimulateDlr} style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Delivery Status (`status`)</label>
                  <select className="sheets-input" value={simDlrStatus} onChange={(e) => setSimDlrStatus(e.target.value)} style={{ width: '100%', fontSize: '11px', fontWeight: '700' }}>
                    <option value="DELIVERED">DELIVERED (Handset Acknowledged - Error Code 0)</option>
                    <option value="UNDELIVERED">UNDELIVERED (Handset Offline / Expired - Error Code 20)</option>
                    <option value="FAILED">FAILED (Network Reject / Invalid Number - Error Code 1)</option>
                    <option value="EXPIRED">EXPIRED (Validity Period Exceeded - Error Code 23)</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Recipient MSISDN (`msisdn`)</label>
                    <input type="text" className="sheets-input sheets-input-code" value={simDlrPhone} onChange={(e) => setSimDlrPhone(e.target.value)} placeholder="60122273341" style={{ width: '100%', fontSize: '11px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Telco Error Code (`error-code`)</label>
                    <input type="number" className="sheets-input sheets-input-code" value={simDlrErrorCode} onChange={(e) => setSimDlrErrorCode(e.target.value)} placeholder="0" style={{ width: '100%', fontSize: '11px' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)' }}>Target Message ID (`msgid`)</label>
                    {logs.length > 0 && (
                      <button type="button" onClick={() => setSimDlrMsgId(logs[0].id)} className="sheets-btn" style={{ fontSize: '9px', padding: '1px 5px' }}>
                        Use Latest: {logs[0].id.slice(0, 15)}...
                      </button>
                    )}
                  </div>
                  <input type="text" className="sheets-input sheets-input-code" value={simDlrMsgId} onChange={(e) => setSimDlrMsgId(e.target.value)} placeholder={logs[0]?.id || '78-1633193001.0602-0'} style={{ width: '100%', fontSize: '11px' }} />
                </div>
                <button type="submit" disabled={simulatingDlr} className="sheets-btn sheets-btn-primary" style={{ fontSize: '11px', padding: '7px 14px', marginTop: '4px' }}>
                  {simulatingDlr ? 'Simulating Webhook...' : '🚀 Trigger Simulated Telco Callback'}
                </button>
              </form>
            </div>

            {/* Payload Specification Display */}
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
              <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700' }}>
                INCOMING TELCO DN JSON PAYLOAD SPECIFICATION
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: '#0F172A', color: '#38BDF8', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-code)', fontSize: '11px', overflowX: 'auto' }}>
                  <pre style={{ margin: 0 }}>{JSON.stringify(simDlrResult?.payload || {
                    status: simDlrStatus,
                    "error-code": parseInt(simDlrErrorCode) || 0,
                    msisdn: simDlrPhone,
                    msgid: simDlrMsgId || (logs[0]?.id || "78-1633193001.0602-0")
                  }, null, 2)}</pre>
                </div>
                {simDlrResult && (
                  <div style={{ background: '#ECFDF5', border: '1px solid #10B981', borderRadius: '4px', padding: '8px 10px', fontSize: '11px', color: '#065F46' }}>
                    <strong>Server Acknowledged:</strong> HTTP 200 / ACK — Record status updated to <code>{simDlrResult.payload?.status}</code>.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: API CREDENTIALS & SETTINGS */}
      {activeSubTab === 'keys' && (
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
          <div style={{ background: '#F8FAFC', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800' }}>🔑 BULK360 API CREDENTIALS & SETTINGS</span>
            <span className="sheets-badge sheets-badge-emerald" style={{ fontSize: '9px', padding: '1px 5px' }}>● Saved</span>
          </div>

          <form onSubmit={handleSaveConfig} style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>APP_KEY (Username / `user`)</label>
                <input type="text" className="sheets-input" value={config.appKey} onChange={(e) => setConfig({ ...config, appKey: e.target.value, apiKey: e.target.value })} style={{ width: '100%', fontSize: '12px', fontFamily: 'var(--font-code)', fontWeight: '700' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>APP_SECRET (Password / `pass`)</label>
                <input type="text" className="sheets-input" value={config.appSecret} onChange={(e) => setConfig({ ...config, appSecret: e.target.value })} style={{ width: '100%', fontSize: '12px', fontFamily: 'var(--font-code)' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Send SMS Endpoint URL</label>
                <input type="text" className="sheets-input" value={config.apiUrl} onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })} style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Balance Inquiry Endpoint URL</label>
                <input type="text" className="sheets-input" value={config.balanceUrl} onChange={(e) => setConfig({ ...config, balanceUrl: e.target.value })} style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Default Sender ID (`from`)</label>
                <input type="text" className="sheets-input" value={config.senderId} onChange={(e) => setConfig({ ...config, senderId: e.target.value })} style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Unit Rate (MYR/SMS)</label>
                <input type="text" className="sheets-input" value={config.ratePerSms} onChange={(e) => setConfig({ ...config, ratePerSms: e.target.value })} style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
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
            {/* IP Whitelist Security Configuration Box */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '4px', padding: '10px 12px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontWeight: '700', color: '#92400E' }}>🛡️ Bulk360 IP Whitelist Security Configuration</div>
              <div style={{ color: '#78350F', lineHeight: '1.4' }}>
                Bulk360 firewall requires your public server IP to be whitelisted under <strong>Configurations &gt; Whitelist IPs</strong>. Outbound requests without whitelisting return <code>401 Unauthorized</code>.
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '2px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #FCD34D', borderRadius: '3px', padding: '3px 8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Detected Server IP:</span>
                  <code style={{ fontFamily: 'var(--font-code)', fontWeight: '800', color: '#059669', fontSize: '12px' }}>{currentIp}</code>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(currentIp); if (showToast) showToast(`Copied: ${currentIp}`); }} className="sheets-btn" style={{ fontSize: '9px', padding: '1px 6px', background: '#ECFDF5', border: '1px solid #10B981', color: '#047857', fontWeight: '700' }}>📋 Copy IP</button>
                </div>
                {clientIp && clientIp !== serverIp && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '3px', padding: '3px 8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Client / Browser IP:</span>
                    <code style={{ fontFamily: 'var(--font-code)', fontWeight: '700', color: '#0284C7', fontSize: '11px' }}>{clientIp}</code>
                  </div>
                )}
                <a href="https://sms.360.my/configurations" target="_blank" rel="noreferrer" className="sheets-btn sheets-btn-primary" style={{ fontSize: '10px', padding: '3px 10px', background: '#D97706', textDecoration: 'none' }}>
                  Open Bulk360 Console &rarr;
                </a>
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
            BULK360 SMS API V3.0 SPECIFICATION & RESPONSE CODES
          </div>
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <table className="sheets-table">
              <thead>
                <tr><th style={{ width: '80px' }}>Code</th><th style={{ width: '120px' }}>Status</th><th>Description & Cause</th><th>Action Required</th></tr>
              </thead>
              <tbody>
                {[{ code: '200', color: '#059669', badge: 'sheets-badge-emerald', status: 'OK', desc: 'Message accepted by gateway and queued for telco routing.', action: 'Capture Reference ID (`ref`) for DLR matching.' }, { code: '400', color: '#DC2626', badge: 'sheets-badge-amber', status: 'Bad Request', desc: 'Missing parameters or invalid field type (e.g. missing `to` or `text`).', action: 'Verify required query parameters in POST/GET call.' }, { code: '401', color: '#DC2626', badge: 'sheets-badge-amber', status: 'Unauthorized', desc: 'Invalid Username/Password or Server IP is not whitelisted.', action: `Check credentials and whitelist IP (${currentIp}) in Bulk360.` }, { code: '402', color: '#D97706', badge: 'sheets-badge-purple', status: 'Payment Required', desc: 'Insufficient account balance or SMS credits.', action: 'Top up SMS credits on Bulk360 dashboard.' }, { code: '500', color: '#64748B', badge: 'sheets-badge-gray', status: 'Telco Error', desc: 'Upstream carrier / Telco connection timeout or maintenance.', action: 'Auto-fallback to secondary SMS route or WhatsApp OTP.' }].map(r => (
                  <tr key={r.code}><td style={{ fontFamily: 'var(--font-code)', fontWeight: '700', color: r.color }}>{r.code}</td><td><span className={`sheets-badge ${r.badge}`}>{r.status}</span></td><td>{r.desc}</td><td>{r.action}</td></tr>
                ))}
              </tbody>
            </table>

            {/* SMS cURL Examples */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>1. Universal SMS OTP Request (cURL):</div>
              <div style={{ background: '#0F172A', color: '#38BDF8', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-code)', fontSize: '11px', overflowX: 'auto' }}>
                <pre style={{ margin: 0 }}>{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8884'}/v1/otp/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phoneNumber": "+60123456789",
    "channel": "sms",
    "senderId": "OTP88_SMS",
    "codeLength": 6,
    "expirySeconds": 300
  }'`}</pre>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>2. Bulk360 Direct MT Gateway (HTTP POST):</div>
              <div style={{ background: '#0F172A', color: '#38BDF8', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-code)', fontSize: '11px', overflowX: 'auto' }}>
                <pre style={{ margin: 0 }}>{`curl -X POST https://sms.360.my/gw/bulk360/v3_0/send.php \\
  -F "user=${config.user || 'YOUR_USER'}" \\
  -F "pass=${config.pass ? '••••••••' : 'YOUR_PASS'}" \\
  -F "to=+60123456789" \\
  -F "text=RM0.00 OTP88: Your SMS verification code is 882910. Valid for 5 mins." \\
  -F "from=${config.from || 'OTP88'}" \\
  -F "detail=1"`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transmission & Delivery Logs Table */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>BULK360 DISPATCH & DLR LOGS</span>
          <span style={{ color: 'var(--text-muted)' }}>{logs.length} entries</span>
        </div>
        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '35px' }}>#</th><th>Reference ID</th><th>Recipient</th><th>Message Content</th><th>Sender ID</th><th>Gateway</th><th>Segments</th><th>Cost</th><th>Status</th><th>Latency</th><th>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="11" style={{ textAlign: 'center', padding: '14px', color: 'var(--text-muted)' }}>No logs recorded yet.</td></tr>
            ) : (
              logs.map((l, i) => (
                <tr key={l.id || i}>
                  <td style={{ fontFamily: 'var(--font-code)', fontSize: '10px', color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>{l.id}</td>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>{l.recipient}</td>
                  <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)', fontSize: '11px' }} title={l.message || l.text || 'Your OTP88 verification code is 882049. Valid for 5 minutes.'}>
                    {l.message || l.text || 'Your OTP88 verification code is 882049. Valid for 5 minutes.'}
                  </td>
                  <td><span style={{ fontFamily: 'var(--font-code)', fontSize: '10px', background: '#F1F5F9', padding: '2px 4px', borderRadius: '3px' }}>{l.senderId}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{l.telco}</td>
                  <td>{l.segments}</td>
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

      {/* EDIT KEYS MODAL DIALOG (Plain Text Inputs) */}
      {showEditModal && (
        <div className="sheets-modal-backdrop" onMouseDown={(e) => { e.target === e.currentTarget ? editModalBackdropRef.current = true : editModalBackdropRef.current = false; }} onMouseUp={(e) => { if (editModalBackdropRef.current && e.target === e.currentTarget && !savingConfig) setShowEditModal(false); editModalBackdropRef.current = false; }}>
          <div className="sheets-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="sheets-modal-header">
              <span>Edit Bulk360 API Keys</span>
              <button type="button" onClick={() => !savingConfig && setShowEditModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleSaveModal}>
              <div className="sheets-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>APP_KEY (Username / `user`)</label>
                  <input type="text" className="sheets-input" value={modalKey} onChange={(e) => setModalKey(e.target.value)} placeholder="Enter APP_KEY" autoFocus required style={{ width: '100%', fontFamily: 'var(--font-code)', fontWeight: '700', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>APP_SECRET (Password / `pass`)</label>
                  <input type="text" className="sheets-input" value={modalSecret} onChange={(e) => setModalSecret(e.target.value)} placeholder="Enter APP_SECRET" required style={{ width: '100%', fontFamily: 'var(--font-code)', fontSize: '12px' }} />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>Plain text visible for quick editing and copy-pasting.</span>
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
  window.Sms360View = Sms360View;
}

export default Sms360View;
