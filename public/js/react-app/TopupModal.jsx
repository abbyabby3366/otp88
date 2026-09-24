import React from 'react';

export function TopupModal({
  isOpen,
  onClose,
  session,
  topupAmount,
  setTopupAmount,
  onSimulateTopup,
  t = {}
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-ribbon)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '14px'
              }}
            >
              $
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {t.topUpCredits || 'Top-up Balance'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {t.currentBalance || 'Available Balance'}: <strong style={{ color: '#059669', fontFamily: 'var(--font-code)' }}>${(session?.balanceUsd !== undefined ? session.balanceUsd : 50).toFixed(4)}</strong>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="sheets-btn"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '16px',
              color: 'var(--text-muted)',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              SELECT AMOUNT (USD)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
              {[50, 100, 250, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className={`sheets-btn ${topupAmount === amt ? 'sheets-btn-primary' : ''}`}
                  onClick={() => setTopupAmount(amt)}
                  style={{ padding: '8px 10px', fontSize: '12px', fontWeight: '700', justifyContent: 'center' }}
                >
                  + ${amt} USD
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Custom Amount: $</span>
              <input
                type="number"
                min="1"
                className="sheets-input sheets-input-code"
                style={{ flex: 1, padding: '7px 10px', fontSize: '13px', fontWeight: '700' }}
                value={topupAmount}
                onChange={(e) => setTopupAmount(Number(e.target.value) || e.target.value)}
              />
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              PAYMENT METHOD
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="sheets-btn sheets-btn-primary"
                style={{
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  onSimulateTopup('Credit Card (Stripe)');
                  onClose();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                {t.payWithCard || 'Pay with Credit Card'} (+${topupAmount})
              </button>
              <button
                type="button"
                className="sheets-btn"
                style={{
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  onSimulateTopup('USDT Crypto');
                  onClose();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 12h8M12 8v8"></path>
                </svg>
                {t.payWithCrypto || 'Pay with Crypto (USDT)'} (+${topupAmount})
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '10px 18px',
            background: 'var(--bg-ribbon)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            type="button"
            className="sheets-btn"
            onClick={onClose}
            style={{ padding: '5px 14px', fontSize: '11px', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopupModal;
