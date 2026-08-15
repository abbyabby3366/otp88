// Carrier Rates Spreadsheet View
function RatesView({ t, ratesList, session, editCountryCode, setEditCountryCode, editRateWhatsapp, setEditRateWhatsapp, editRateSms, setEditRateSms, showToast }) {
  return (
    <div>
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ background: '#F8FAFC', padding: '6px 10px', fontSize: '11px', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)' }}>
          {t.ratesTitle}
        </div>
        <table className="sheets-table">
          <thead>
            <tr>
              <th>ISO</th>
              <th>{t.country}</th>
              <th>WhatsApp ($)</th>
              <th>Direct SMS ($)</th>
              <th>Telegram ($)</th>
              <th>Voice ($)</th>
              <th>Avg Latency</th>
            </tr>
          </thead>
          <tbody>
            {ratesList.map((rate) => (
              <tr key={rate.code}>
                <td style={{ fontFamily: 'var(--font-code)', fontWeight: '800' }}>{rate.code}</td>
                <td><strong>{rate.country}</strong></td>
                <td style={{ fontFamily: 'var(--font-code)', color: '#059669', fontWeight: '700' }}>${rate.whatsapp.toFixed(4)}</td>
                <td style={{ fontFamily: 'var(--font-code)' }}>${rate.sms.toFixed(4)}</td>
                <td style={{ fontFamily: 'var(--font-code)', color: '#0284C7' }}>${rate.telegram.toFixed(4)}</td>
                <td style={{ fontFamily: 'var(--font-code)' }}>${rate.voice.toFixed(4)}</td>
                <td style={{ fontFamily: 'var(--font-code)' }}>{rate.latency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {session.role === 'ADMIN' && (
        <div style={{ background: '#F8FAFC', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '8px' }}>ADMIN OVERWRITE (MONGODB SYNC)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{t.country}</label>
              <select className="sheets-input" value={editCountryCode} onChange={(e) => setEditCountryCode(e.target.value)}>
                <option value="MY">Malaysia (MY)</option>
                <option value="SG">Singapore (SG)</option>
                <option value="ID">Indonesia (ID)</option>
                <option value="TH">Thailand (TH)</option>
                <option value="US">United States (US)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>WhatsApp ($)</label>
              <input type="number" step="0.0001" className="sheets-input sheets-input-code" value={editRateWhatsapp} onChange={(e) => setEditRateWhatsapp(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>Direct SMS ($)</label>
              <input type="number" step="0.0001" className="sheets-input sheets-input-code" value={editRateSms} onChange={(e) => setEditRateSms(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="sheets-btn sheets-btn-primary" style={{ width: '100%' }} onClick={() => showToast(`${t.commitChanges}: ${editCountryCode}`)}>
                {t.commitChanges}
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

