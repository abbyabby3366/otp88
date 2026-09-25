import React, { useState } from 'react';
import { apiFetch } from './api.js';
import EmailLogoUploader from './EmailLogoUploader.jsx';

/**
 * Live Email OTP Dispatch Form
 * Includes all customizable fields supported by the OTP88 Email API (POST /v1/otp/send)
 */
export default function EmailTestDispatchForm({
  jwtToken,
  showToast,
  onSuccess,
  defaultBrandName = 'OTP88',
  defaultFromEmail = 'OTP88 <noreply@otp88.top>',
  defaultReplyTo = '',
  defaultLogoUrl = ''
}) {
  const [to, setTo] = useState('delivered@resend.dev');
  const [code, setCode] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [expiryMinutes, setExpiryMinutes] = useState('5');
  const [brandName, setBrandName] = useState(defaultBrandName);
  const [brandHandle, setBrandHandle] = useState('');
  const [logoUrl, setLogoUrl] = useState(defaultLogoUrl);
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [replyTo, setReplyTo] = useState(defaultReplyTo);
  const [remark, setRemark] = useState('');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Generate real-time JSON payload matching POST /v1/otp/send
  const apiPayload = {
    to: to.trim(),
    channel: 'email',
    ...(code.trim() ? { otp: code.trim() } : {}),
    ...(brandName.trim() ? { brandName: brandName.trim() } : {}),
    ...(brandHandle.trim() ? { brandHandle: brandHandle.trim() } : {}),
    ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
    ...(from.trim() ? { from: from.trim() } : {}),
    ...(subject.trim() ? { subject: subject.trim() } : {}),
    ...(replyTo.trim() ? { replyTo: replyTo.trim() } : {}),
    expiryMinutes: parseInt(expiryMinutes, 10) || 5,
    ...(remark.trim() ? { remark: remark.trim() } : {})
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!to.trim() || !to.includes('@')) {
      showToast('Please enter a valid recipient email address', 'error');
      return;
    }

    setSending(true);
    setTestResult(null);

    try {
      const res = await apiFetch('/api/admin/email/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          to: to.trim(),
          code: code.trim(),
          brandName: brandName.trim() || undefined,
          brandHandle: brandHandle.trim() || undefined,
          logoUrl: logoUrl.trim() || undefined,
          from: from.trim() || undefined,
          subject: subject.trim() || undefined,
          replyTo: replyTo.trim() || undefined,
          expiryMinutes: parseInt(expiryMinutes, 10) || 5,
          remark: remark.trim() || undefined
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
        if (onSuccess) onSuccess();
        // Generate new random code for next test
        setCode(Math.floor(100000 + Math.random() * 900000).toString());
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
      setSending(false);
    }
  };

  return (
    <div className="sheets-card" style={{ padding: '18px 20px', background: 'var(--card-bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
          </svg>
          Dispatch Live Test Email OTP
        </h3>
        <button
          type="button"
          onClick={() => setShowJsonPreview(!showJsonPreview)}
          className="sheets-btn"
          style={{ fontSize: '11px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          {showJsonPreview ? 'Hide JSON' : 'View API JSON'}
        </button>
      </div>

      {/* Real-time JSON Payload Preview */}
      {showJsonPreview && (
        <div style={{ marginBottom: '14px', padding: '10px 12px', background: 'var(--bg-card-subtle, #0B1120)', border: '1px solid var(--border-subtle, #1E293B)', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-emerald)', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            POST /v1/otp/send (Equivalent JSON Body)
          </div>
          <pre style={{ margin: 0, fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-primary)', overflowX: 'auto', lineHeight: 1.4 }}>
            {JSON.stringify(apiPayload, null, 2)}
          </pre>
        </div>
      )}

      <form onSubmit={handleSendTest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Field 1: Recipient Email Address */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Recipient Email Address (<code style={{ color: 'var(--text-emerald)' }}>to</code>) <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="sheets-input"
            style={{ width: '100%', fontSize: '12px' }}
            placeholder="recipient@example.com"
            required
          />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
            Tip: <code>delivered@resend.dev</code> is accepted by Resend without delivering a real email.
          </span>
        </div>

        {/* Row 2: Passcode OTP & Expiry Duration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Passcode OTP (<code style={{ color: 'var(--text-emerald)' }}>otp</code>)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="sheets-input"
              style={{ width: '100%', fontFamily: 'monospace', fontWeight: '700', fontSize: '13px' }}
              maxLength={8}
              placeholder="e.g. 532459"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Expiry Duration (<code style={{ color: 'var(--text-emerald)' }}>expiryMinutes</code>)
            </label>
            <select
              value={expiryMinutes}
              onChange={(e) => setExpiryMinutes(e.target.value)}
              className="sheets-select"
              style={{ width: '100%', fontSize: '12px' }}
            >
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
            </select>
          </div>
        </div>

        {/* Row 3: Brand Display Name & Brand Handle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Brand Display Name (<code style={{ color: 'var(--text-emerald)' }}>brandName</code>)
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="sheets-input"
              style={{ width: '100%', fontSize: '12px' }}
              placeholder={defaultBrandName}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Brand Sub-Alias (<code style={{ color: 'var(--text-emerald)' }}>brandHandle</code>)
            </label>
            <input
              type="text"
              value={brandHandle}
              onChange={(e) => setBrandHandle(e.target.value)}
              className="sheets-input"
              style={{ width: '100%', fontSize: '12px' }}
              placeholder="e.g. security -> security@otp88.top"
            />
          </div>
        </div>

        {/* Email Header Brand Logo Uploader */}
        <EmailLogoUploader
          logoUrl={logoUrl}
          onChange={setLogoUrl}
          jwtToken={jwtToken}
          showToast={showToast}
          label="Email Header Brand Logo (logoUrl)"
        />

        {/* Advanced Options Toggle */}
        <div style={{ marginTop: '2px' }}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: '11px',
              fontWeight: '700',
              color: 'var(--text-emerald)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            {showAdvanced ? 'Hide Advanced API Fields' : 'Show Advanced API Fields (from, subject, replyTo, remark)'}
          </button>
        </div>

        {/* Collapsible Advanced Fields */}
        {showAdvanced && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
            {/* Field: Custom Subject */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Custom Subject Line (<code style={{ color: 'var(--text-emerald)' }}>subject</code>)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="sheets-input"
                style={{ width: '100%', fontSize: '12px' }}
                placeholder={`Default: ${brandName || 'OTP88'} Verification Code: ${code}`}
              />
            </div>

            {/* Field: Custom From Address & Reply-To */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Explicit From Header (<code style={{ color: 'var(--text-emerald)' }}>from</code>)
                </label>
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="sheets-input"
                  style={{ width: '100%', fontSize: '12px' }}
                  placeholder="e.g. OTP88 <noreply@otp88.top>"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Reply-To Address (<code style={{ color: 'var(--text-emerald)' }}>replyTo</code>)
                </label>
                <input
                  type="email"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  className="sheets-input"
                  style={{ width: '100%', fontSize: '12px' }}
                  placeholder="support@example.com"
                />
              </div>
            </div>

            {/* Field: Remark / Reference */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Tracking Remark / Reference (<code style={{ color: 'var(--text-emerald)' }}>remark</code>)
              </label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="sheets-input"
                style={{ width: '100%', fontSize: '12px' }}
                placeholder="e.g. login-test-4028 or order-ref-91"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div style={{ marginTop: '4px' }}>
          <button
            type="submit"
            disabled={sending}
            className="sheets-btn sheets-btn-primary"
            style={{ width: '100%', padding: '9px', fontSize: '12px', fontWeight: '700' }}
          >
            {sending ? 'Dispatching via Resend...' : 'Send Live Test Email OTP'}
          </button>
        </div>

        {/* Test Result Message Box */}
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
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Delivered via Resend!
                </strong><br />
                Message ID: <code>{testResult.messageId}</code><br />
                Latency: <code>{testResult.latency}</code> • From: <code>{testResult.fromUsed}</code>
              </div>
            ) : (
              <div>
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  Dispatch Failed:
                </strong><br />
                {testResult.error}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
