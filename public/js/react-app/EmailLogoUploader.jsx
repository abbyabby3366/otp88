import React, { useState, useRef } from 'react';
import { apiFetch } from './api.js';

/**
 * Reusable, modern Email Brand Logo Uploader
 * Supports direct file upload (PNG, JPG, SVG, WebP) and manual image URL input.
 */
export default function EmailLogoUploader({
  logoUrl = '',
  onChange,
  jwtToken,
  showToast,
  label = 'Brand Logo (Email Header)'
}) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState(logoUrl || '');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast?.('Please upload a valid image file (PNG, JPG, SVG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast?.('Image file exceeds 5MB limit', 'error');
      return;
    }

    setUploading(true);

    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await apiFetch('/api/admin/email/upload-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          image: base64Data,
          filename: file.name
        })
      });

      const data = await res.json();
      if (data.success && data.url) {
        onChange(data.url);
        setUrlDraft(data.url);
        showToast?.('Logo uploaded successfully!');
      } else {
        showToast?.(data.error || 'Failed to upload logo', 'error');
      }
    } catch (err) {
      showToast?.(err.message || 'Error uploading logo', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    onChange(urlDraft.trim());
    setShowUrlInput(false);
    showToast?.('Logo URL updated!');
  };

  const handleClear = () => {
    onChange('');
    setUrlDraft('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
        {label}
      </label>

      {logoUrl ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-subtle)',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '64px',
              height: '42px',
              borderRadius: '6px',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              border: '1px solid rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <img
                src={logoUrl}
                alt="Brand Logo"
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Active Brand Logo
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {logoUrl}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="sheets-btn"
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              {uploading ? 'Uploading...' : 'Replace Logo'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="sheets-btn"
              style={{ fontSize: '11px', padding: '4px 10px', color: '#EF4444' }}
              title="Remove custom logo (falls back to brand text/default)"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="sheets-btn"
              style={{
                fontSize: '11px',
                padding: '6px 14px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(6,182,212,0.1)',
                borderColor: 'rgba(6,182,212,0.3)',
                color: 'var(--accent-cyan)'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {uploading ? 'Uploading Logo...' : 'Upload Brand Logo (PNG, JPG, SVG)'}
            </button>

            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {showUrlInput ? 'Cancel URL' : 'or enter image URL'}
            </button>
          </div>

          {showUrlInput && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <input
                type="url"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://yourbrand.com/logo.png"
                className="sheets-input"
                style={{ flex: 1, fontSize: '11px' }}
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="sheets-btn sheets-btn-primary"
                style={{ fontSize: '11px', padding: '0 12px' }}
              >
                Set
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </div>
  );
}
