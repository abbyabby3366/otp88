import React, { useState, useEffect } from 'react';
import TableLoader from './TableLoader.jsx';
import { apiFetch } from './api.js';
import { splitDateTime } from './utils/format.js';
import EmailTemplatePreview from './EmailTemplatePreview.jsx';
import EmailTestDispatchForm from './EmailTestDispatchForm.jsx';
import EmailLogoUploader from './EmailLogoUploader.jsx';
import {
  MailIcon,
  SettingsIcon,
  EyeIcon,
  VerifiedCheckIcon,
  PendingClockIcon,
  InfoCircleIcon,
  LockIcon,
  RocketIcon,
  ListLogsIcon
} from './EmailOtpIcons.jsx';

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
    logoUrl: '',
    supportEmail: 'support@otp88.top'
  });

  const [domainStatus, setDomainStatus] = useState(null);
  const [domainError, setDomainError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [showApiKey, setShowApiKey] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('config'); // 'config' | 'preview'


  // Re-verify domain state
  const [verifyingDomain, setVerifyingDomain] = useState(false);

  // Fetch config and logs from backend
  const fetchEmailData = () => {
    if (!jwtToken) return;
    setLoadingConfig(true);
    apiFetch('/api/admin/email/config', {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.config) setConfig(data.config);
          setDomainStatus(data.domainStatus || null);
          setDomainError(data.domainError || null);
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
      const res = await apiFetch('/api/admin/email/config', {
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
      const res = await apiFetch('/api/admin/email/verify-domain', {
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


  const isDomainVerified = domainStatus?.status === 'verified';

  return (
    <div className="sheets-view-container" style={{ padding: '4px' }}>
      
      {/* Top Banner Header */}
      <div className="sheets-card" style={{ marginBottom: '14px', padding: '16px 20px', background: 'var(--card-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06B6D4', flexShrink: 0 }}>
                <MailIcon size={18} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                Email OTP <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-emerald)', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.25)' }}>Resend API</span>
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Transactional email passcodes sent through Resend from the platform domain, with per-customer branded senders.
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
        <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', background: isDomainVerified ? 'rgba(16,185,129,0.08)' : (domainError ? 'var(--bg-ribbon)' : 'rgba(245,158,11,0.08)'), border: `1px solid ${isDomainVerified ? 'rgba(16,185,129,0.25)' : (domainError ? 'var(--border-subtle)' : 'rgba(245,158,11,0.25)')}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              {isDomainVerified ? (
                <VerifiedCheckIcon size={15} color="#10B981" />
              ) : domainError ? (
                <InfoCircleIcon size={15} color="var(--text-secondary)" />
              ) : (
                <PendingClockIcon size={15} color="#F59E0B" />
              )}
            </span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: isDomainVerified ? 'var(--text-emerald)' : (domainError ? 'var(--text-secondary)' : '#F59E0B') }}>
              Sending domain{domainStatus?.name ? ` ${domainStatus.name}` : ''}: {isDomainVerified ? 'Verified' : (domainError ? 'Status not available' : 'Not verified yet')}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {isDomainVerified ? `Sending from ${config.fromEmail || 'the configured address'}` : (domainError || 'Until DNS is verified, Resend\'s onboarding sender is used as a fallback')}
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
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', borderRadius: '6px', cursor: 'pointer', background: activeSubTab === 'config' ? 'var(--primary-emerald)' : 'rgba(255,255,255,0.05)', color: activeSubTab === 'config' ? '#000' : 'var(--text-secondary)', border: 'none' }}
        >
          <SettingsIcon size={13} color="currentColor" />
          Gateway Settings & Live Dispatch
        </button>
        <button
          className={`sheets-tab-pill ${activeSubTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('preview')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', borderRadius: '6px', cursor: 'pointer', background: activeSubTab === 'preview' ? 'var(--primary-emerald)' : 'rgba(255,255,255,0.05)', color: activeSubTab === 'preview' ? '#000' : 'var(--text-secondary)', border: 'none' }}
        >
          <EyeIcon size={13} color="currentColor" />
          Responsive HTML Email Preview
        </button>
      </div>

      {/* SUB-TAB 1: Configuration & Live Test Dispatch */}
      {activeSubTab === 'config' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          
          {/* Card 1: Resend Credentials & Gateway Parameters */}
          <div className="sheets-card" style={{ padding: '18px 20px', background: 'var(--card-bg)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 14px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LockIcon size={15} style={{ color: 'var(--text-emerald)' }} /> Resend Credentials & Parameters
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

              {/* Email Header Brand Logo */}
              <EmailLogoUploader
                logoUrl={config.logoUrl || ''}
                onChange={(url) => setConfig({ ...config, logoUrl: url })}
                jwtToken={jwtToken}
                showToast={showToast}
                label="Brand Logo (Email Header)"
              />

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

          {/* Card 2: Live Test Dispatch Form with all editable API fields */}
          <EmailTestDispatchForm
            jwtToken={jwtToken}
            showToast={showToast}
            onSuccess={fetchEmailData}
            defaultBrandName={config.brandName || 'OTP88'}
            defaultFromEmail={config.fromEmail || 'OTP88 <noreply@otp88.top>'}
            defaultReplyTo={config.replyTo || ''}
            defaultLogoUrl={config.logoUrl || ''}
          />
        </div>
      )}

      {/* SUB-TAB 2: Responsive HTML Email Preview */}
      {activeSubTab === 'preview' && (
        <EmailTemplatePreview
          testCode="532459"
          brandName={config.brandName || 'OTP88'}
          logoUrl={config.logoUrl || ''}
          testExpiry="5"
          recipient="recipient@example.com"
        />
      )}

      {/* Card 3: Recent Email OTP Dispatch Logs */}
      <div className="sheets-card" style={{ padding: '16px 20px', background: 'var(--card-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListLogsIcon size={15} style={{ color: 'var(--text-secondary)' }} /> Recent Email OTP Dispatches ({logs.length})
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
                  <th style={{ textAlign: 'right' }}>Date & Time</th>
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
                    const dt = splitDateTime(log.createdAt || log.timestamp);
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

