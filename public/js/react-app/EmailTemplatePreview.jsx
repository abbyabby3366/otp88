import React, { useState } from 'react';

/**
 * Modern, clean responsive Email OTP Preview component
 * Supports Light & Dark rendering modes to test real-world client appearance
 */
export default function EmailTemplatePreview({
  testCode = '882049',
  brandName = 'OTP88',
  logoUrl = '',
  testExpiry = '5',
  recipient = 'recipient@example.com'
}) {
  const [previewTheme, setPreviewTheme] = useState('light'); // 'light' | 'dark'
  const isDark = previewTheme === 'dark';

  return (
    <div className="sheets-card" style={{ padding: '24px', background: 'var(--card-bg)', marginBottom: '16px', textAlign: 'center' }}>
      {/* Theme Switcher Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '520px', margin: '0 auto 16px auto', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
            <rect width="20" height="16" x="2" y="4" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Live Email Preview
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            (Clean & High Readability)
          </span>
        </div>
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            onClick={() => setPreviewTheme('light')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '700',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: !isDark ? 'var(--primary-emerald)' : 'transparent',
              color: !isDark ? '#000000' : 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
            </svg>
            Light (Default)
          </button>
          <button
            type="button"
            onClick={() => setPreviewTheme('dark')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '700',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: isDark ? 'var(--primary-emerald)' : 'transparent',
              color: isDark ? '#000000' : 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
            Dark
          </button>
        </div>
      </div>

      {/* Email Container Canvas */}
      <div style={{
        maxWidth: '520px',
        margin: '0 auto',
        padding: '32px 16px',
        background: isDark ? '#0B0F19' : '#F8FAFC',
        borderRadius: '16px',
        border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
        transition: 'all 0.2s ease'
      }}>
        {/* Email Inner Card */}
        <div style={{
          maxWidth: '460px',
          margin: '0 auto',
          background: isDark ? '#131B2E' : '#FFFFFF',
          border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
          borderRadius: '16px',
          overflow: 'hidden',
          textAlign: 'left',
          color: isDark ? '#E2E8F0' : '#0F172A',
          boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.04)'
        }}>

          {/* Header with Sharp Modern Shield SVG Logo */}
          <div style={{ padding: '28px 24px 20px 24px', textAlign: 'center', borderBottom: `1px solid ${isDark ? '#1E293B' : '#F1F5F9'}` }}>
            {logoUrl ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={logoUrl}
                  alt={brandName}
                  style={{ maxHeight: '48px', maxWidth: '220px', objectFit: 'contain', display: 'block' }}
                />
              </div>
            ) : brandName && brandName.trim().toUpperCase() !== 'OTP88' ? (
              <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: isDark ? '#FFFFFF' : '#0F172A' }}>
                {brandName}
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                  <defs>
                    <linearGradient id="prevShieldGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="50%" stopColor="#06B6D4" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                    <linearGradient id="prevShieldBg" x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#0F172A" />
                      <stop offset="100%" stopColor="#020617" />
                    </linearGradient>
                    <linearGradient id="prevBoltGrad" x1="12" y1="8" x2="28" y2="32" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#34D399" />
                      <stop offset="100%" stopColor="#38BDF8" />
                    </linearGradient>
                  </defs>
                  <path d="M20 3L34 8V18C34 26.5 28 34 20 37C12 34 6 26.5 6 18V8L20 3Z" fill="url(#prevShieldBg)" stroke="url(#prevShieldGrad)" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M22 8L12 21H19L17 32L28 19H21L22 8Z" fill="url(#prevBoltGrad)" stroke="#060913" strokeWidth="0.8" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px', color: isDark ? '#FFFFFF' : '#0F172A' }}>
                  OTP<span style={{ color: '#10B981' }}>88</span>
                </span>
              </div>
            )}
          </div>

          {/* Content Body */}
          <div style={{ padding: '28px 24px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '700', color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.3px' }}>
              Your Verification Code
            </h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: isDark ? '#94A3B8' : '#475569', lineHeight: 1.6 }}>
              Use the verification code below to complete your authentication request. This code is confidential.
            </p>

            {/* Clean Code Box */}
            <div style={{
              margin: '20px 0 16px 0',
              padding: '18px 12px',
              background: isDark ? '#0B1120' : '#F8FAFC',
              border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
              borderRadius: '12px'
            }}>
              <div style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                fontSize: '34px',
                fontWeight: '800',
                letterSpacing: '10px',
                color: isDark ? '#34D399' : '#0F172A',
                paddingLeft: '10px'
              }}>
                {testCode || '882049'}
              </div>
            </div>

            {/* Expiry Badge with SVG Clock Icon */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 14px',
              background: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
              border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'}`,
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600',
              color: isDark ? '#FBBF24' : '#92400E',
              marginBottom: '20px'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Valid for {testExpiry || '5'} minutes</span>
            </div>

            {/* Security Tip Box with SVG Lock Icon */}
            <div style={{
              background: isDark ? 'rgba(15, 23, 42, 0.7)' : '#F8FAFC',
              border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
              borderRadius: '8px',
              padding: '12px 14px',
              textAlign: 'left',
              fontSize: '11px',
              color: isDark ? '#94A3B8' : '#64748B',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#38BDF8' : '#0F172A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <div>
                <strong style={{ color: isDark ? '#E2E8F0' : '#0F172A' }}>Security Tip:</strong> Never share this code with anyone. {brandName} will never ask for your verification code.
                <div style={{ marginTop: '4px', fontSize: '10px', color: '#94A3B8' }}>
                  If you did not request this verification, please safely ignore this email.
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            background: isDark ? '#0F172A' : '#F8FAFC',
            borderTop: `1px solid ${isDark ? '#1E293B' : '#F1F5F9'}`,
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', lineHeight: 1.5 }}>
              This is an automated security email sent to {recipient || 'your registered address'}.<br />
              &copy; {new Date().getFullYear()} {brandName} CPaaS Platform. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
