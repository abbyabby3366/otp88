import React, { useState, useEffect } from 'react';
import TableLoader from './TableLoader.jsx';

export default function EmailOtpView({ t, jwtToken, showToast }) {
  const [config, setConfig] = useState({
    apiKey: '',
    fromEmail: 'OTP88 <noreply@otp88.top>',
    replyTo: '',
    subjectTemplate: 'Your OTP88 Verification Code: {{otpCode}}',
    ratePerOtp: '0.0020',
    currency: 'USD',
    status: 'ACTIVE',
    brandName: 'OTP88',
    supportEmail: 'support@otp88.top'
  });

  const [domainStatus, setDomainStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('config'); // 'config' | 'preview'

  // Test send form state
  const [testTo, setTestTo] = useState('delivered@resend.dev');
  const [testCode, setTestCode] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [testBrand, setTestBrand] = useState('OTP88');
  const [testExpiry, setTestExpiry] = useState('5');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Re-verify domain state
  const [verifyingDomain, setVerifyingDomain] = useState(false);

  // Fetch config and logs from backend
  const fetchEmailData = () => {
    if (!jwtToken) return;
    setLoadingConfig(true);
    fetch('/api/admin/email/config', {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.config) setConfig(data.config);
          if (data.domainStatus) setDomainStatus(data.domainStatus);
          if (data.logs) setLogs(data.logs);
        }
      })
      .catch(err => {
        showToast('Failed to load Email OTP settings', 'error');
      })
      .finally(() => setLoadingConfig(false));
  };

  useEffect(() => {
    fetchEmailData();
  }, [jwtToken]);

  // Save updated configuration
  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await fetch('/api/admin/email/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Resend Email OTP settings saved successfully');
        if (data.config) setConfig(data.config);
      } else {
        showToast(data.error || 'Failed to save settings', 'error');
      }
    } catch (err) {
      showToast('Connection error while saving settings', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  // Re-check domain verification on Resend
  const handleTriggerVerifyDomain = async () => {
    setVerifyingDomain(true);
    try {
      const res = await fetch('/api/admin/email/verify-domain', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Resend domain verification scan triggered');
        if (data.domain) setDomainStatus(data.domain);
      } else {
        showToast(data.error || 'Failed to verify domain', 'error');
      }
    } catch (err) {
      showToast('Error communicating with Resend', 'error');
    } finally {
      setVerifyingDomain(false);
    }
  };

  // Dispatch live test email OTP
  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testTo.trim() || !testTo.includes('@')) {
      showToast('Please enter a valid recipient email address', 'error');
      return;
    }
    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/email/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          to: testTo.trim(),
          code: testCode.trim(),
          brandName: testBrand.trim() || 'OTP88',
          expiryMinutes: parseInt(testExpiry, 10) || 5
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Email OTP sent successfully in ${data.latency}!`);
        setTestResult({
          success: true,
          messageId: data.messageId,
          latency: data.latency,
          fromUsed: data.fromUsed,
          otpCode: data.otpCode
        });
        fetchEmailData();
        setTestCode(Math.floor(100000 + Math.random() * 900000).toString());
      } else {
        setTestResult({
          success: false,
          error: data.error,
          latency: data.latency,
          fromUsed: data.fromUsed
        });
        showToast(`Dispatch failed: ${data.error}`, 'error');
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message });
      showToast('Network error during test send', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  // Stacked Date & Time helper (DD-MM-YY top, greyed out time bottom)
  const renderStackedDateTime = (dateStr) => {
    if (!dateStr) return { date: '—', time: '—' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: String(dateStr), time: '' };
    // Convert to GMT+8
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const gmt8 = new Date(utc + (3600000 * 8));
    const yy = String(gmt8.getFullYear()).slice(-2);
    const mm = String(gmt8.getMonth() + 1).padStart(2, '0');
    const dd = String(gmt8.getDate()).padStart(2, '0');
    const hh = String(gmt8.getHours()).padStart(2, '0');
    const min = String(gmt8.getMinutes()).padStart(2, '0');
    const ss = String(gmt8.getSeconds()).padStart(2, '0');
    return {
      date: `${dd}-${mm}-${yy}`,
      time: `${hh}:${min}:${ss}`
    };
  };

  const isDomainVerified = domainStatus?.status === 'verified';

  return (
    <div className="sheets-view-container" style={{ padding: '4px' }}>
      
      {/* Top Banner Header */}
      <div className="sheets-card" style={{ marginBottom: '14px', padding: '16px 20px', background: 'var(--card-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>📧</span>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                Email OTP <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-emerald)', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.25)' }}>Resend API</span>
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              High-deliverability transactional email passcodes via Resend with custom domain sending, dark/light HTML templates, and real-time delivery reporting.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', background: config.status === 'ACTIVE' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: config.status === 'ACTIVE' ? '#10B981' : '#EF4444', border: `1px solid ${config.status === 'ACTIVE' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
              ● {config.status === 'ACTIVE' ? 'GATEWAY ACTIVE' : 'PAUSED'}
            </span>
            <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', background: 'rgba(6,182,212,0.15)', color: '#06B6D4', border: '1px solid rgba(6,182,212,0.3)' }}>
              ${config.ratePerOtp || '0.0020'} USD / OTP
            </span>
          </div>
        </div>

        {/* Cloudflare Domain Status Indicator */}
        <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', background: isDomainVerified ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${isDomainVerified ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>{isDomainVerified ? '✅' : '⏳'}</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: isDomainVerified ? 'var(--text-emerald)' : '#F59E0B' }}>
              Domain {domainStatus?.name || 'otp88.top'}: {isDomainVerified ? 'Verified & Active' : 'DNS Propagation Pending'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              ({isDomainVerified ? 'Sending from ' + (config.fromEmail || 'noreply@otp88.top') : 'Fallback: onboarding@resend.dev enabled while verifying'})
            </span>
          </div>
          <button
            type="button"
            onClick={handleTriggerVerifyDomain}
            disabled={verifyingDomain}
            className="sheets-btn"
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            {verifyingDomain ? 'Scanning DNS...' : 'Re-check Domain'}
          </button>
        </div>
      </div>

      {/* Tab Switcher: Settings vs. Live Template Preview */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <button
          className={`sheets-tab-pill ${activeSubTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('config')}
          style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700', borderRadius: '6px', cursor: 'pointer', background: activeSubTab === 'config' ? 'var(--primary-emerald)' : 'rgba(255,255,255,0.05)', color: activeSubTab === 'config' ? '#000' : 'var(--text-secondary)', border: 'none' }}
        >
          ⚙️ Gateway Settings & Live Dispatch
        </button>
        <button
          className={`sheets-tab-pill ${activeSubTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('preview')}
          style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700', borderRadius: '6px', cursor: 'pointer', background: activeSubTab === 'preview' ? 'var(--primary-emerald)' : 'rgba(255,255,255,0.05)', color: activeSubTab === 'preview' ? '#000' : 'var(--text-secondary)', border: 'none' }}
        >
          👁️ Responsive HTML Email Preview
        </button>
      </div>

      {/* SUB-TAB 1: Configuration & Live Test Dispatch */}
      {activeSubTab === 'config' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          
          {/* Card 1: Resend Credentials & Gateway Parameters */}
          <div className="sheets-card" style={{ padding: '18px 20px', background: 'var(--card-bg)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 14px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔐</span> Resend Credentials & Parameters
            </h3>

            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Resend API Key
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.apiKey || ''}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    className="sheets-input"
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px' }}
                    placeholder="re_..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="sheets-btn"
                    style={{ fontSize: '11px', padding: '0 10px' }}
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    From Email Address
                  </label>
                  <input
                    type="text"
                    value={config.fromEmail || ''}
                    onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                    className="sheets-input"
                    style={{ width: '100%', fontSize: '12px' }}
                    placeholder="OTP88 <noreply@otp88.top>"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Brand Display Name
                  </label>
                  <input
                    type="text"
                    value={config.brandName || ''}
                    onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
                    className="sheets-input"
                    style={{ width: '100%', fontSize: '12px' }}
                    placeholder="OTP88"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Subject Line Template
                </label>
                <input
                  type="text"
                  value={config.subjectTemplate || ''}
                  onChange={(e) => setConfig({ ...config, subjectTemplate: e.target.value })}
                  className="sheets-input"
                  style={{ width: '100%', fontSize: '12px' }}
                  placeholder="Your {{appName}} Verification Code: {{otpCode}}"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Rate per OTP (USD)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={config.ratePerOtp || '0.0020'}
                    onChange={(e) => setConfig({ ...config, ratePerOtp: e.target.value })}
                    className="sheets-input"
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Gateway Status
                  </label>
                  <select
                    value={config.status || 'ACTIVE'}
                    onChange={(e) => setConfig({ ...config, status: e.target.value })}
                    className="sheets-select"
                    style={{ width: '100%', fontSize: '12px' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAUSED">PAUSED</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="sheets-btn sheets-btn-primary"
                  style={{ width: '100%', padding: '8px', fontSize: '12px', fontWeight: '700' }}
                >
                  {savingConfig ? 'Saving Settings...' : 'Save Email Configuration'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Live Test Dispatch Form */}
          <div className="sheets-card" style={{ padding: '18px 20px', background: 'var(--card-bg)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 14px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚀</span> Dispatch Live Test Email OTP
            </h3>

            <form onSubmit={handleSendTest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  className="sheets-input"
                  style={{ width: '100%', fontSize: '12px' }}
                  placeholder="recipient@example.com"
                  required
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Tip: Use <code>delivered@resend.dev</code> to simulate delivery without sending actual emails.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Passcode (OTP)
                  </label>
                  <input
                    type="text"
                    value={testCode}
                    onChange={(e) => setTestCode(e.target.value)}
                    className="sheets-input"
                    style={{ width: '100%', fontFamily: 'monospace', fontWeight: '700', fontSize: '13px' }}
                    maxLength={8}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Expiry Duration
                  </label>
                  <select
                    value={testExpiry}
                    onChange={(e) => setTestExpiry(e.target.value)}
                    className="sheets-select"
                    style={{ width: '100%', fontSize: '12px' }}
                  >
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="sheets-btn sheets-btn-primary"
                  style={{ width: '100%', padding: '9px', fontSize: '12px', fontWeight: '700' }}
                >
                  {sendingTest ? 'Dispatching via Resend...' : 'Send Live Test Email OTP'}
                </button>
              </div>

              {testResult && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  background: testResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${testResult.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: testResult.success ? 'var(--text-emerald)' : '#EF4444'
                }}>
                  {testResult.success ? (
                    <div>
                      <strong>✅ Delivered via Resend!</strong><br />
                      Message ID: <code>{testResult.messageId}</code><br />
                      Latency: <code>{testResult.latency}</code> • From: <code>{testResult.fromUsed}</code>
                    </div>
                  ) : (
                    <div>
                      <strong>❌ Dispatch Failed:</strong><br />
                      {testResult.error}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Responsive HTML Email Preview */}
      {activeSubTab === 'preview' && (
        <div className="sheets-card" style={{ padding: '24px', background: 'var(--card-bg)', marginBottom: '16px', textAlign: 'center' }}>
          <div style={{ maxWidth: '520px', margin: '0 auto', background: '#131B2E', border: '1px solid #1E293B', borderRadius: '16px', overflow: 'hidden', textAlign: 'left', color: '#E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            
            {/* Header */}
            <div style={{ padding: '28px 24px 18px 24px', textAlign: 'center', borderBottom: '1px solid #1E293B' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'linear-gradient(135deg, #10B981, #06B6D4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#060913', fontWeight: '900', fontSize: '16px' }}>⚡</div>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF' }}>OTP<span style={{ color: '#10B981' }}>88</span></span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#94A3B8', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: '700' }}>
                One-Time Authentication Passcode
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '28px 24px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#CBD5E1', lineHeight: 1.5 }}>
                Use the verification code below to complete your authentication request. This code is confidential.
              </p>

              <div style={{ margin: '20px 0', padding: '18px 12px', background: '#0B1120', border: '1px solid #334155', borderRadius: '10px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '34px', fontWeight: '800', letterSpacing: '8px', color: '#34D399', textShadow: '0 0 10px rgba(52,211,153,0.3)' }}>
                  {testCode || '882049'}
                </div>
              </div>

              <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '20px', fontSize: '11px', fontWeight: '600', color: '#FBBF24', marginBottom: '18px' }}>
                ⏱ Valid for {testExpiry || '5'} minutes
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid #1E293B', borderRadius: '6px', padding: '10px 14px', textAlign: 'left', fontSize: '11px', color: '#94A3B8' }}>
                <strong style={{ color: '#E2E8F0' }}>Security Tip:</strong> Never share this code with anyone. OTP88 will never ask for your verification code.
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', background: '#0F172A', borderTop: '1px solid #1E293B', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>
                This is an automated security email sent to user@otp88.top.<br />
                &copy; {new Date().getFullYear()} OTP88 CPaaS Platform. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Card 3: Recent Email OTP Dispatch Logs */}
      <div className="sheets-card" style={{ padding: '16px 20px', background: 'var(--card-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📜</span> Recent Email OTP Dispatches ({logs.length})
          </h3>
        </div>

        {loadingConfig ? (
          <TableLoader />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="sheets-table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Msg ID</th>
                  <th style={{ textAlign: 'left' }}>Recipient Email</th>
                  <th style={{ textAlign: 'center' }}>OTP Code</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Latency</th>
                  <th style={{ textAlign: 'center' }}>Cost</th>
                  <th style={{ textAlign: 'right' }}>Date & Time (GMT+8)</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No Email OTP dispatches recorded yet. Use the test tool above or dispatch via API to see live logs.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => {
                    const dt = renderStackedDateTime(log.createdAt || log.timestamp);
                    return (
                      <tr key={log.id || idx}>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {log.id}
                        </td>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {log.recipient}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-cyan)' }}>
                          {log.code}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '700',
                            background: log.status === 'DELIVERED' || log.status === 'SENT' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            color: log.status === 'DELIVERED' || log.status === 'SENT' ? '#10B981' : '#EF4444'
                          }}>
                            {log.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                          {log.latency}
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                          {log.cost}
                        </td>
                        {/* Two stacked rows for Date & Time (DD-MM-YY primary, time secondary greyed out) */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{dt.date}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{dt.time}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

if (typeof window !== 'undefined') {
  window.EmailOtpView = EmailOtpView;
}
