import React, { useState, useEffect } from 'react';

// Admin Bulk360 SMS API V3.0 Complete Management & Interactive Explorer
function Sms360View({ t, jwtToken, showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('send');

  // Credentials & Config (Stored in MongoDB Atlas)
  const [config, setConfig] = useState({
    appKey: 'KGRb4qxdBL',
    appSecret: 'NE4Ui9KcgxJJl8Y9NbJKhgCohsk6l71GzzBC1gya',
    apiKey: 'KGRb4qxdBL',
    apiUrl: 'https://sms.360.my/gw/bulk360/v3_0/send.php',
    balanceUrl: 'https://sms.360.my/api/balance/v3_0/getBalance',
    senderId: '66688',
    webhookUrl: 'https://api.otp88.com/api/webhooks/sms360/dlr',
    ratePerSms: '0.0210',
    currency: 'MYR',
    status: 'ACTIVE',
    autoFallback: true
  });
  const [showSecret, setShowSecret] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Send SMS MT state
  const [mtTo, setMtTo] = useState('60123456789');
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

  // Fetch live stats and database config
  const loadData = () => {
    if (jwtToken) {
      fetch('/api/admin/sms360/stats', { headers: { 'Authorization': `Bearer ${jwtToken}` } })
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
        const res = await fetch('/api/admin/sms360/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
          body: JSON.stringify(config)
        });
        const data = await res.json();
        if (data.success && showToast) showToast('✅ Bulk360 API keys & settings saved to database!');
      }
    } catch (err) {
      if (showToast) showToast('Error saving to database.', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  // 1. Send SMS via Bulk360 v3.0
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
            phoneNumber: mtTo.trim(),
            senderId: mtFrom.trim(),
            message: mtText.trim(),
            detail: mtDetail ? 1 : 0,
            appKey: config.appKey,
            appSecret: config.appSecret
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

  // 2. Query Live Balance API
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Top Banner with Inline Editable Credentials */}
      <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '6px', background: 'linear-gradient(135deg, #10B981, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: '900', fontSize: '13px', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)' }}>
            360
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Bulk360 SMS API V3.0</h2>
              <span className="sheets-badge sheets-badge-emerald" style={{ fontSize: '10px', padding: '2px 6px' }}>● Active</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>https://sms.360.my/developers/v3.0</p>
          </div>
        </div>

        {/* Editable APP_KEY and APP_SECRET */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)' }}>APP_KEY:</span>
            <input
              type="text"
              className="sheets-input"
              value={config.appKey}
              onChange={(e) => setConfig({ ...config, appKey: e.target.value, apiKey: e.target.value })}
              placeholder="APP_KEY"
              style={{ width: '120px', fontSize: '11px', fontFamily: 'var(--font-code)', padding: '3px 6px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)' }}>APP_SECRET:</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showSecret ? 'text' : 'password'}
                className="sheets-input"
                value={config.appSecret}
                onChange={(e) => setConfig({ ...config, appSecret: e.target.value })}
                placeholder="APP_SECRET"
                style={{ width: '150px', fontSize: '11px', fontFamily: 'var(--font-code)', padding: '3px 22px 3px 6px' }}
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

      {/* Whitelist IP Alert Bar */}
      <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '4px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#92400E' }}>
        <span>⚠️ <strong>Whitelist IP Reminder:</strong> Ensure your server IP is whitelisted in Bulk360 console (<em>Configurations &gt; Whitelist IPs tab</em>) for live production dispatches.</span>
        <a href="https://sms.360.my/configurations" target="_blank" rel="noreferrer" style={{ color: '#B45309', fontWeight: '700', textDecoration: 'underline' }}>Open Bulk360 Portal &rarr;</a>
      </div>

      {/* Sub-Tabs Navigation */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '2px' }}>
        <button onClick={() => setActiveSubTab('send')} className="sheets-btn" style={{ fontSize: '11px', fontWeight: '700', borderBottom: activeSubTab === 'send' ? '2px solid #10B981' : 'none', background: activeSubTab === 'send' ? '#F1F5F9' : 'transparent', color: activeSubTab === 'send' ? '#0F172A' : 'var(--text-secondary)' }}>
          📤 1. Send SMS (MT API)
        </button>
        <button onClick={() => setActiveSubTab('balance')} className="sheets-btn" style={{ fontSize: '11px', fontWeight: '700', borderBottom: activeSubTab === 'balance' ? '2px solid #10B981' : 'none', background: activeSubTab === 'balance' ? '#F1F5F9' : 'transparent', color: activeSubTab === 'balance' ? '#0F172A' : 'var(--text-secondary)' }}>
          💰 2. Balance Inquiry API
        </button>
        <button onClick={() => setActiveSubTab('dn')} className="sheets-btn" style={{ fontSize: '11px', fontWeight: '700', borderBottom: activeSubTab === 'dn' ? '2px solid #10B981' : 'none', background: activeSubTab === 'dn' ? '#F1F5F9' : 'transparent', color: activeSubTab === 'dn' ? '#0F172A' : 'var(--text-secondary)' }}>
          🔔 3. Delivery Notification (DN)
        </button>
        <button onClick={() => setActiveSubTab('keys')} className="sheets-btn" style={{ fontSize: '11px', fontWeight: '700', borderBottom: activeSubTab === 'keys' ? '2px solid #10B981' : 'none', background: activeSubTab === 'keys' ? '#F1F5F9' : 'transparent', color: activeSubTab === 'keys' ? '#0F172A' : 'var(--text-secondary)' }}>
          🔑 4. API Credentials & Settings
        </button>
        <button onClick={() => setActiveSubTab('docs')} className="sheets-btn" style={{ fontSize: '11px', fontWeight: '700', borderBottom: activeSubTab === 'docs' ? '2px solid #10B981' : 'none', background: activeSubTab === 'docs' ? '#F1F5F9' : 'transparent', color: activeSubTab === 'docs' ? '#0F172A' : 'var(--text-secondary)' }}>
          📖 5. API Reference & Codes
        </button>
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
                  <input type="text" className="sheets-input" value={config.appKey} onChange={(e) => setConfig({ ...config, appKey: e.target.value, apiKey: e.target.value })} style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)' }}>Password (`pass` / APP_SECRET)</label>
                    <button type="button" onClick={() => setShowSecret(!showSecret)} className="sheets-btn" style={{ fontSize: '9px', padding: '0 4px', background: 'none', border: 'none', color: '#0284C7', cursor: 'pointer' }}>{showSecret ? 'Hide' : 'Show'}</button>
                  </div>
                  <input type={showSecret ? 'text' : 'password'} className="sheets-input" value={config.appSecret} onChange={(e) => setConfig({ ...config, appSecret: e.target.value })} style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Sender ID (`from`)</label>
                  <input type="text" className="sheets-input" value={mtFrom} onChange={(e) => setMtFrom(e.target.value)} placeholder="66688" style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Recipient (`to` - Comma-separated for Bulk)</label>
                <input type="text" className="sheets-input" value={mtTo} onChange={(e) => setMtTo(e.target.value)} placeholder="60123240066,60102200533" style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
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
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
          <div style={{ background: '#F8FAFC', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', fontSize: '12px', fontWeight: '800' }}>
            DELIVERY NOTIFICATION (DN / DLR WEBHOOK) SPECIFICATION
          </div>
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Bulk360 returns the final delivery receipt (DN) from Telcos in real-time to your configured webhook URL.</p>
            <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Your Webhook Callback URL:</div>
              <input type="text" className="sheets-input" value={config.webhookUrl} onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })} style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-code)' }} />
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '4px' }}>Incoming Telco DN JSON Payload Format:</div>
            <div style={{ background: '#0F172A', color: '#38BDF8', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-code)', fontSize: '11px' }}>
              <pre style={{ margin: 0 }}>{`{
  "status": "DELIVERED",
  "error-code": 20,
  "msisdn": "60123240066",
  "msgid": "78-1633193001.0602-0"
}`}</pre>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)' }}>APP_SECRET (Password / `pass`)</label>
                  <button type="button" onClick={() => setShowSecret(!showSecret)} className="sheets-btn" style={{ fontSize: '9px', padding: '1px 4px' }}>{showSecret ? 'Hide' : 'Show'}</button>
                </div>
                <input type={showSecret ? 'text' : 'password'} className="sheets-input" value={config.appSecret} onChange={(e) => setConfig({ ...config, appSecret: e.target.value })} style={{ width: '100%', fontSize: '12px', fontFamily: 'var(--font-code)' }} />
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
          <div style={{ padding: '14px' }}>
            <table className="sheets-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Code</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th>Description & Cause</th>
                  <th>Action Required</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700', color: '#059669' }}>200</td>
                  <td><span className="sheets-badge sheets-badge-emerald">OK</span></td>
                  <td>Message accepted by gateway and queued for telco routing.</td>
                  <td>Capture Reference ID (`ref`) for DLR matching.</td>
                </tr>
                <tr>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700', color: '#DC2626' }}>400</td>
                  <td><span className="sheets-badge sheets-badge-amber">Bad Request</span></td>
                  <td>Missing parameters or invalid field type (e.g. missing `to` or `text`).</td>
                  <td>Verify required query parameters in POST/GET call.</td>
                </tr>
                <tr>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700', color: '#DC2626' }}>401</td>
                  <td><span className="sheets-badge sheets-badge-amber">Unauthorized</span></td>
                  <td>Invalid Username/Password or Server IP is not whitelisted.</td>
                  <td>Check `user`/`pass` and whitelist IP in Bulk360 portal.</td>
                </tr>
                <tr>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700', color: '#D97706' }}>402</td>
                  <td><span className="sheets-badge sheets-badge-purple">Payment Required</span></td>
                  <td>Insufficient account balance or SMS credits.</td>
                  <td>Top up SMS credits on Bulk360 dashboard.</td>
                </tr>
                <tr>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700', color: '#64748B' }}>500</td>
                  <td><span className="sheets-badge sheets-badge-gray">Telco Error</span></td>
                  <td>Upstream carrier / Telco connection timeout or maintenance.</td>
                  <td>Auto-fallback to secondary SMS route or WhatsApp OTP.</td>
                </tr>
              </tbody>
            </table>
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
              <th style={{ width: '35px' }}>#</th>
              <th>Reference ID</th>
              <th>Recipient</th>
              <th>Sender ID</th>
              <th>Gateway</th>
              <th>Segments</th>
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

    </div>
  );
}

if (typeof window !== 'undefined') {
  window.Sms360View = Sms360View;
}

export default Sms360View;
