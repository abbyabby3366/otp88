import React, { useEffect, useRef } from 'react';

export function WhatsAppEditKeyModal({ show, onClose, onSave, apiKey, setApiKey, saving }) {
  const backdropRef = useRef(false);

  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && !saving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, saving, onClose]);

  if (!show) return null;

  return (
    <div
      className="sheets-modal-backdrop"
      onMouseDown={(e) => { backdropRef.current = e.target === e.currentTarget; }}
      onMouseUp={(e) => { if (backdropRef.current && e.target === e.currentTarget && !saving) onClose(); backdropRef.current = false; }}
    >
      <div className="sheets-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="sheets-modal-header">
          <span>Edit VerifyWay API Key</span>
          <button type="button" onClick={() => !saving && onClose()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)' }}>✕</button>
        </div>
        <form onSubmit={onSave}>
          <div className="sheets-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                API_KEY (Bearer Token)
              </label>
              <input
                type="text"
                className="sheets-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
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
            <button type="button" className="sheets-btn" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="sheets-btn sheets-btn-primary" disabled={saving} style={{ background: '#059669' }}>
              {saving ? 'Saving...' : 'Save Keys'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WhatsAppEditKeyModal;
