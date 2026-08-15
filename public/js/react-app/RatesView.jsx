import React, { useEffect } from 'react';

// Carrier Rates Spreadsheet View
function RatesView({
  t,
  ratesList,
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
  // Sync form inputs when country select changes
  useEffect(() => {
    const found = ratesList.find(r => r.code === editCountryCode);
    if (found) {
      setEditRateWhatsapp(found.whatsapp !== undefined && found.whatsapp !== null ? found.whatsapp.toString() : '0.0075');
      setEditRateTelegram(found.telegram !== undefined && found.telegram !== null ? found.telegram.toString() : '0.0035');
      setEditRateSms(found.sms !== undefined && found.sms !== null ? found.sms.toString() : (editCountryCode === 'MY' ? '0.0210' : ''));
    }
  }, [editCountryCode, ratesList]);

  return (
    <div>
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ background: '#F8FAFC', padding: '6px 10px', fontSize: '11px', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t.ratesTitle || 'CARRIER RATES (USD / OTP)'}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>* SMS routing is currently exclusive to Malaysia</span>
        </div>
        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>ISO</th>
              <th>{t.country || 'Country / Region'}</th>
              <th>WhatsApp ($)</th>
              <th>Telegram ($)</th>
              <th>SMS ($)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ratesList.map((rate) => (
              <tr key={rate.code}>
                <td style={{ fontFamily: 'var(--font-code)', fontWeight: '800' }}>{rate.code}</td>
                <td>
                  <span style={{ marginRight: '6px' }}>{rate.flag || '🌐'}</span>
                  <strong>{rate.country}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '6px' }}>({rate.dialCode})</span>
                </td>
                <td style={{ fontFamily: 'var(--font-code)', color: '#059669', fontWeight: '700' }}>
                  ${(rate.whatsapp ?? 0.0075).toFixed(4)}
                </td>
                <td style={{ fontFamily: 'var(--font-code)', color: '#0284C7', fontWeight: '700' }}>
                  ${(rate.telegram ?? 0.0035).toFixed(4)}
                </td>
                <td style={{ fontFamily: 'var(--font-code)' }}>
                  {rate.code === 'MY' && rate.sms !== null && rate.sms !== undefined ? (
                    <span style={{ fontWeight: '700', color: '#334155' }}>${Number(rate.sms).toFixed(4)}</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
                  )}
                </td>
                <td>
                  <span className="sheets-badge sheets-badge-emerald">Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {session && session.role === 'ADMIN' && (
        <div style={{ background: '#F8FAFC', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
            ⚙️ ADMIN: UPDATE LIVE CARRIER RATES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                {t.country || 'Destination Country'}
              </label>
              <select className="sheets-input" value={editCountryCode} onChange={(e) => setEditCountryCode(e.target.value)}>
                {ratesList.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.country} ({r.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                WhatsApp ($)
              </label>
              <input
                type="number"
                step="0.0001"
                className="sheets-input sheets-input-code"
                value={editRateWhatsapp}
                onChange={(e) => setEditRateWhatsapp(e.target.value)}
                placeholder="0.0075"
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                Telegram ($)
              </label>
              <input
                type="number"
                step="0.0001"
                className="sheets-input sheets-input-code"
                value={editRateTelegram}
                onChange={(e) => setEditRateTelegram(e.target.value)}
                placeholder="0.0035"
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                SMS ($) {editCountryCode !== 'MY' ? '(MY Only)' : ''}
              </label>
              <input
                type="number"
                step="0.0001"
                disabled={editCountryCode !== 'MY'}
                className="sheets-input sheets-input-code"
                value={editCountryCode === 'MY' ? editRateSms : ''}
                onChange={(e) => setEditRateSms(e.target.value)}
                placeholder={editCountryCode === 'MY' ? '0.0210' : 'N/A'}
                style={{ background: editCountryCode !== 'MY' ? '#F1F5F9' : '#FFFFFF' }}
              />
            </div>
            <div>
              <button
                className="sheets-btn sheets-btn-primary"
                style={{ padding: '6px 16px' }}
                disabled={loading}
                onClick={handleSaveRate}
              >
                {loading ? 'Saving...' : (t.saveChanges || 'Save Rates')}
              </button>
            </div>
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
