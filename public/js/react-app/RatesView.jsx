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
  const [modalWhatsapp, setModalWhatsapp] = useState('');
  const [modalTelegram, setModalTelegram] = useState('');
  const [modalSmsRates, setModalSmsRates] = useState({});
  const backdropMouseDownRef = useRef(false);

  const activeRatesList = (ratesList && ratesList.length > 0) ? ratesList : DEFAULT_GLOBAL_RATES;

  const commonWhatsappRate = activeRatesList[0]?.whatsapp ?? 0.0500;
  const commonTelegramRate = activeRatesList[0]?.telegram ?? 0.0035;

  // Open edit modal for entire table
  const openEditModal = () => {
    if (setEditCountryCode) setEditCountryCode('ALL');
    const wVal = (editRateWhatsapp !== undefined && editRateWhatsapp !== '') ? editRateWhatsapp : commonWhatsappRate.toString();
    const tVal = (editRateTelegram !== undefined && editRateTelegram !== '') ? editRateTelegram : commonTelegramRate.toString();
    setModalWhatsapp(wVal);
    setModalTelegram(tVal);

    const initialSmsRates = {};
    activeRatesList.forEach(r => {
      initialSmsRates[r.code] = (r.sms !== null && r.sms !== undefined && r.sms !== '') ? String(r.sms) : '';
    });
    setModalSmsRates(initialSmsRates);
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

  const handleSmsChange = (countryCode, value) => {
    setModalSmsRates(prev => ({
      ...prev,
      [countryCode]: value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (setEditRateWhatsapp) setEditRateWhatsapp(modalWhatsapp);
    if (setEditRateTelegram) setEditRateTelegram(modalTelegram);
    if (setEditRateSms && modalSmsRates['MY']) setEditRateSms(modalSmsRates['MY']);

    if (handleSaveRate) {
      await handleSaveRate({
        countryCode: 'ALL',
        isGlobal: true,
        whatsapp: modalWhatsapp,
        telegram: modalTelegram,
        smsRates: modalSmsRates
      });
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
                      {rate.sms !== null && rate.sms !== undefined && rate.sms !== '' ? (
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

      {/* EDIT MODAL DIALOG WITH PER-COUNTRY SMS PRICING */}
      {showEditModal && (
        <div
          className="sheets-modal-backdrop"
          onMouseDown={handleBackdropMouseDown}
          onMouseUp={handleBackdropMouseUp}
        >
          <div className="sheets-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '100%' }}>
            <div className="sheets-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>⚙️</span>
                <span style={{ fontWeight: '800' }}>Edit Carrier Rates (Omnichannel & SMS)</span>
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
              <div className="sheets-modal-body" style={{ gap: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
                
                {/* GLOBAL OMNICHANNEL SECTION */}
                <div style={{ background: '#F8FAFC', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🌐 Global Channel Pricing (All Destinations)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#059669', display: 'block', marginBottom: '4px' }}>
                        WhatsApp ($ / OTP)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        className="sheets-input sheets-input-code"
                        value={modalWhatsapp}
                        onChange={(e) => setModalWhatsapp(e.target.value)}
                        required
                        style={{ width: '100%', fontWeight: '700', color: '#059669' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#0284C7', display: 'block', marginBottom: '4px' }}>
                        Telegram ($ / OTP)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        className="sheets-input sheets-input-code"
                        value={modalTelegram}
                        onChange={(e) => setModalTelegram(e.target.value)}
                        required
                        style={{ width: '100%', fontWeight: '700', color: '#0284C7' }}
                      />
                    </div>
                  </div>
                </div>

                {/* SMS PER-COUNTRY PRICING SECTION */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      📱 SMS Carrier Rates by Destination ($ / OTP)
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Leave empty for inactive (—)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '8px' }}>
                    {activeRatesList.map((c) => {
                      const currentVal = modalSmsRates[c.code] ?? '';
                      return (
                        <div
                          key={c.code}
                          style={{
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            padding: '8px 10px',
                            background: '#FFFFFF',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                              <span>{c.flag || '🌐'}</span>
                              <span style={{ fontWeight: '700' }}>{c.country}</span>
                            </div>
                            <span style={{ fontSize: '10px', fontFamily: 'var(--font-code)', color: 'var(--text-muted)' }}>
                              {c.dialCode}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>$</span>
                            <input
                              type="number"
                              step="0.0001"
                              min="0"
                              className="sheets-input sheets-input-code"
                              value={currentVal}
                              onChange={(e) => handleSmsChange(c.code, e.target.value)}
                              placeholder="Disabled (—)"
                              style={{
                                width: '100%',
                                fontSize: '11px',
                                fontWeight: currentVal ? '700' : '400',
                                color: currentVal ? '#D97706' : 'var(--text-muted)',
                                padding: '4px 6px'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                  {loading ? 'Saving...' : 'Save Rates to Database'}
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
