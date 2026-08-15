import React, { useState, useEffect } from 'react';

const DEFAULT_GLOBAL_RATES = [
  { country: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾', whatsapp: 0.0075, telegram: 0.0035, sms: 0.0210 },
  { country: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬', whatsapp: 0.0075, telegram: 0.0035, sms: null },
  { country: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩', whatsapp: 0.0075, telegram: 0.0035, sms: null },
  { country: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭', whatsapp: 0.0075, telegram: 0.0035, sms: null },
  { country: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳', whatsapp: 0.0075, telegram: 0.0035, sms: null },
  { country: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭', whatsapp: 0.0075, telegram: 0.0035, sms: null },
  { country: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸', whatsapp: 0.0075, telegram: 0.0035, sms: null },
  { country: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧', whatsapp: 0.0075, telegram: 0.0035, sms: null },
  { country: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺', whatsapp: 0.0075, telegram: 0.0035, sms: null },
  { country: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳', whatsapp: 0.0075, telegram: 0.0035, sms: null },
  { country: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪', whatsapp: 0.0075, telegram: 0.0035, sms: null },
  { country: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵', whatsapp: 0.0075, telegram: 0.0035, sms: null }
];

// Carrier Rates & OTP Pricing Management View
function RatesView({
  t,
  ratesList = [],
  session,
  editCountryCode,
  setEditCountryCode,
  editRateWhatsapp,
  setEditRateWhatsapp,
  editRateTelegram,
  setEditRateTelegram,
  editRateSms,
  setEditRateSms,
  handleSaveRate,
  loading
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const activeRatesList = (ratesList && ratesList.length > 0) ? ratesList : DEFAULT_GLOBAL_RATES;

  // Sync form inputs when country select changes
  useEffect(() => {
    const found = activeRatesList.find(r => r.code === editCountryCode);
    if (found) {
      setEditRateWhatsapp(found.whatsapp !== undefined && found.whatsapp !== null ? found.whatsapp.toString() : '0.0075');
      setEditRateTelegram(found.telegram !== undefined && found.telegram !== null ? found.telegram.toString() : '0.0035');
      setEditRateSms(found.sms !== undefined && found.sms !== null ? found.sms.toString() : (editCountryCode === 'MY' ? '0.0210' : ''));
    }
  }, [editCountryCode, activeRatesList]);

  const selectCountryToEdit = (code) => {
    setEditCountryCode(code);
    const found = activeRatesList.find(r => r.code === code);
    if (found) {
      setEditRateWhatsapp(found.whatsapp !== undefined && found.whatsapp !== null ? found.whatsapp.toString() : '0.0075');
      setEditRateTelegram(found.telegram !== undefined && found.telegram !== null ? found.telegram.toString() : '0.0035');
      setEditRateSms(found.sms !== undefined && found.sms !== null ? found.sms.toString() : '');
    }
  };

  const filteredRates = activeRatesList.filter(r => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      (r.country && r.country.toLowerCase().includes(q)) ||
      (r.code && r.code.toLowerCase().includes(q)) ||
      (r.dialCode && r.dialCode.toLowerCase().includes(q))
    );
  });

  const currentCountry = activeRatesList.find(r => r.code === editCountryCode) || activeRatesList[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* ADMIN RATE SETTING CONTROL CARD */}
      {session && session.role === 'ADMIN' && (
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #10B981, #06B6D4, #8B5CF6)' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚙️</span>
                <span>ADMIN: CONFIGURE OTP PRICING & DESTINATION RATES</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Set dynamic per-message billing rates deducted automatically from user account balances.
              </div>
            </div>

            {/* Quick Country Preset Chips */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {['MY', 'SG', 'ID', 'TH', 'VN', 'PH', 'US', 'GB'].map((cCode) => {
                const cItem = activeRatesList.find(r => r.code === cCode);
                return (
                  <button
                    key={cCode}
                    type="button"
                    className={`sheets-btn ${editCountryCode === cCode ? 'sheets-btn-primary' : ''}`}
                    onClick={() => selectCountryToEdit(cCode)}
                    style={{ fontSize: '10px', padding: '2px 8px' }}
                  >
                    {cItem?.flag || ''} {cCode}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSaveRate(); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Destination Country
                </label>
                <select
                  className="sheets-input"
                  value={editCountryCode}
                  onChange={(e) => selectCountryToEdit(e.target.value)}
                  style={{ width: '100%', fontWeight: '700' }}
                >
                  {activeRatesList.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.flag || '🌐'} {r.country} ({r.dialCode} / {r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#059669', display: 'block', marginBottom: '4px' }}>
                  WhatsApp Rate ($ USD / OTP)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  className="sheets-input sheets-input-code"
                  value={editRateWhatsapp}
                  onChange={(e) => setEditRateWhatsapp(e.target.value)}
                  placeholder="0.0075"
                  required
                  style={{ width: '100%', fontWeight: '700', color: '#059669' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#0284C7', display: 'block', marginBottom: '4px' }}>
                  Telegram Rate ($ USD / OTP)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  className="sheets-input sheets-input-code"
                  value={editRateTelegram}
                  onChange={(e) => setEditRateTelegram(e.target.value)}
                  placeholder="0.0035"
                  required
                  style={{ width: '100%', fontWeight: '700', color: '#0284C7' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#D97706', display: 'block', marginBottom: '4px' }}>
                  SMS Rate ($ USD / OTP)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  className="sheets-input sheets-input-code"
                  value={editRateSms}
                  onChange={(e) => setEditRateSms(e.target.value)}
                  placeholder={editCountryCode === 'MY' ? '0.0210' : '0.0210'}
                  style={{ width: '100%', fontWeight: '700', color: '#D97706' }}
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="sheets-btn sheets-btn-primary"
                  style={{ width: '100%', padding: '7px 16px', background: '#059669', fontWeight: '700' }}
                  disabled={loading}
                >
                  {loading ? 'Saving Rates...' : `Save Price for ${currentCountry?.country || editCountryCode}`}
                </button>
              </div>
            </div>
          </form>

          <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary)', background: '#F8FAFC', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Editing: <strong>{currentCountry?.flag} {currentCountry?.country} ({currentCountry?.dialCode})</strong></span>
            <span>Live MongoDB Sync: <strong style={{ color: '#059669' }}>● Active</strong></span>
          </div>
        </div>
      )}

      {/* RATES TABLE */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ background: '#F8FAFC', padding: '8px 12px', fontSize: '11px', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span>{t.ratesTitle || 'CARRIER RATES (USD / OTP)'}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '8px' }}>
              ({filteredRates.length} destinations)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="text"
              className="sheets-input"
              placeholder="Search destination, ISO, dial code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '220px', padding: '3px 8px', fontSize: '11px' }}
            />
          </div>
        </div>

        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>ISO</th>
              <th>{t.country || 'Country / Region'}</th>
              <th>Dial Code</th>
              <th>WhatsApp ($)</th>
              <th>Telegram ($)</th>
              <th>SMS ($)</th>
              <th>Status</th>
              {session?.role === 'ADMIN' && <th>Quick Action</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRates.map((rate) => {
              const isSelected = rate.code === editCountryCode;
              return (
                <tr
                  key={rate.code}
                  style={{ background: isSelected ? 'rgba(16, 185, 129, 0.06)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => selectCountryToEdit(rate.code)}
                >
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '800' }}>{rate.code}</td>
                  <td>
                    <span style={{ marginRight: '6px', fontSize: '14px' }}>{rate.flag || '🌐'}</span>
                    <strong>{rate.country}</strong>
                  </td>
                  <td style={{ fontFamily: 'var(--font-code)', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {rate.dialCode}
                  </td>
                  <td style={{ fontFamily: 'var(--font-code)', color: '#059669', fontWeight: '800' }}>
                    ${(rate.whatsapp ?? 0.0075).toFixed(4)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-code)', color: '#0284C7', fontWeight: '800' }}>
                    ${(rate.telegram ?? 0.0035).toFixed(4)}
                  </td>
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
                  {session?.role === 'ADMIN' && (
                    <td>
                      <button
                        type="button"
                        className={`sheets-btn ${isSelected ? 'sheets-btn-primary' : ''}`}
                        style={{ fontSize: '10px', padding: '2px 8px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectCountryToEdit(rate.code);
                        }}
                      >
                        {isSelected ? 'Editing' : 'Edit Rate'}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.RatesView = RatesView;
}

export default RatesView;

