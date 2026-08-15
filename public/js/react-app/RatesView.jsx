import React, { useState, useEffect, useRef } from 'react';
import { TableLoader } from './TableLoader.jsx';

const DEFAULT_GLOBAL_RATES = [
  { country: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾', whatsapp: 0.0075, telegram: 0.0035, sms: 0.0210 },
  { country: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬', whatsapp: 0.0075, telegram: 0.0035, sms: null },
  { country: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩', whatsapp: 0.0075, telegram: 0.0035, sms: null },
  { country: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭', whatsapp: 0.0075, telegram: 0.0035, sms: null },
  { country: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳', whatsapp: 0.0075, telegram: 0.0035, sms: null },
  { country: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭', whatsapp: 0.0075, telegram: 0.0035, sms: null }
];

// Carrier Rates & OTP Pricing Management View
function RatesView({
  t,
  ratesList = [],
  session,
  editRateWhatsapp,
  setEditRateWhatsapp,
  editRateTelegram,
  setEditRateTelegram,
  editRateSms,
  setEditRateSms,
  setEditCountryCode,
  handleSaveRate,
  loading
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const backdropMouseDownRef = useRef(false);

  const activeRatesList = (ratesList && ratesList.length > 0) ? ratesList : DEFAULT_GLOBAL_RATES;

  const commonWhatsappRate = activeRatesList[0]?.whatsapp ?? 0.0075;
  const commonTelegramRate = activeRatesList[0]?.telegram ?? 0.0035;
  const mySmsRate = activeRatesList.find(r => r.code === 'MY')?.sms ?? 0.0210;

  // Open edit modal for entire table
  const openEditModal = () => {
    if (setEditCountryCode) setEditCountryCode('ALL');
    setEditRateWhatsapp(commonWhatsappRate.toString());
    setEditRateTelegram(commonTelegramRate.toString());
    setEditRateSms(mySmsRate.toString());
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
  };

  useEffect(() => {
    if (!showEditModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        closeEditModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEditModal]);

  const handleBackdropMouseDown = (e) => {
    backdropMouseDownRef.current = (e.target === e.currentTarget);
  };

  const handleBackdropMouseUp = (e) => {
    if (backdropMouseDownRef.current && e.target === e.currentTarget) {
      closeEditModal();
    }
    backdropMouseDownRef.current = false;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (handleSaveRate) {
      await handleSaveRate();
      closeEditModal();
    }
  };

  const filteredRates = activeRatesList;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      
      {/* RATES TABLE */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ background: '#F8FAFC', padding: '8px 12px', fontSize: '11px', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span>{t.ratesTitle || 'CARRIER RATES (USD / OTP)'}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '8px' }}>
              ({filteredRates.length} destinations)
            </span>
          </div>

          <div>
            {session?.role === 'ADMIN' && (
              <button
                type="button"
                className="sheets-btn sheets-btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  background: '#059669',
                  whiteSpace: 'nowrap'
                }}
                onClick={openEditModal}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Edit Rates
              </button>
            )}
          </div>
        </div>

        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>ISO</th>
              <th>{t.country || 'Country / Region'}</th>
              <th>Dial Code</th>
              <th style={{ textAlign: 'center', minWidth: '130px' }}>WhatsApp ($)</th>
              <th style={{ textAlign: 'center', minWidth: '130px' }}>Telegram ($)</th>
              <th>SMS ($)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && ratesList.length === 0 ? (
              <TableLoader colSpan={7} message="Loading carrier rate cards..." />
            ) : filteredRates.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                  No rates match search criteria.
                </td>
              </tr>
            ) : (
              filteredRates.map((rate, idx) => {
                return (
                  <tr key={rate.code}>
                    <td style={{ fontFamily: 'var(--font-code)', fontWeight: '800' }}>{rate.code}</td>
                    <td>
                      <span style={{ marginRight: '6px', fontSize: '14px' }}>{rate.flag || '🌐'}</span>
                      <strong>{rate.country}</strong>
                    </td>
                    <td style={{ fontFamily: 'var(--font-code)', color: 'var(--text-muted)', fontWeight: '600' }}>
                      {rate.dialCode}
                    </td>

                    {/* Merged WhatsApp Cell Across All Rows */}
                    {idx === 0 && (
                      <td
                        rowSpan={filteredRates.length}
                        style={{
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          background: 'rgba(16, 185, 129, 0.04)',
                          borderLeft: '1px solid var(--border-subtle)',
                          borderRight: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                          <span style={{ fontFamily: 'var(--font-code)', color: '#059669', fontWeight: '800', fontSize: '13px' }}>
                            ${Number(commonWhatsappRate).toFixed(4)}
                          </span>
                          <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '3px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                            ALL COUNTRIES
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Merged Telegram Cell Across All Rows */}
                    {idx === 0 && (
                      <td
                        rowSpan={filteredRates.length}
                        style={{
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          background: 'rgba(2, 132, 199, 0.04)',
                          borderRight: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                          <span style={{ fontFamily: 'var(--font-code)', color: '#0284C7', fontWeight: '800', fontSize: '13px' }}>
                            ${Number(commonTelegramRate).toFixed(4)}
                          </span>
                          <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '3px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                            ALL COUNTRIES
                          </span>
                        </div>
                      </td>
                    )}

                    <td style={{ fontFamily: 'var(--font-code)' }}>
                      {rate.sms !== null && rate.sms !== undefined ? (
                        <span style={{ fontWeight: '800', color: '#D97706' }}>${Number(rate.sms).toFixed(4)}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className="sheets-badge sheets-badge-emerald">Active</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* SINGLE MODAL DIALOG TO EDIT ENTIRE TABLE RATES */}
      {showEditModal && (
        <div
          className="sheets-modal-backdrop"
          onMouseDown={handleBackdropMouseDown}
          onMouseUp={handleBackdropMouseUp}
        >
          <div className="sheets-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', width: '100%' }}>
            <div className="sheets-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>⚙️</span>
                <span style={{ fontWeight: '800' }}>Edit Carrier Rates (All Destinations)</span>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="sheets-modal-body" style={{ gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#059669', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>WhatsApp Rate ($ USD / OTP)</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>All 6 Destinations</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    className="sheets-input sheets-input-code"
                    value={editRateWhatsapp}
                    onChange={(e) => setEditRateWhatsapp(e.target.value)}
                    required
                    style={{ width: '100%', fontWeight: '700', color: '#059669' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#0284C7', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Telegram Rate ($ USD / OTP)</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>All 6 Destinations</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    className="sheets-input sheets-input-code"
                    value={editRateTelegram}
                    onChange={(e) => setEditRateTelegram(e.target.value)}
                    required
                    style={{ width: '100%', fontWeight: '700', color: '#0284C7' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#D97706', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Malaysia SMS Rate ($ USD / OTP)</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>🇲🇾 Malaysia Only</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    className="sheets-input sheets-input-code"
                    value={editRateSms}
                    onChange={(e) => setEditRateSms(e.target.value)}
                    placeholder="0.0210"
                    required
                    style={{ width: '100%', fontWeight: '700', color: '#D97706' }}
                  />
                </div>
              </div>

              <div className="sheets-modal-footer">
                <button
                  type="button"
                  className="sheets-btn"
                  onClick={closeEditModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sheets-btn sheets-btn-primary"
                  disabled={loading}
                  style={{ background: '#059669', fontWeight: '700' }}
                >
                  {loading ? 'Saving...' : 'Save Rates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

if (typeof window !== 'undefined') {
  window.RatesView = RatesView;
}

export default RatesView;
