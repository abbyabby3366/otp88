import React from 'react';

// Services & Channels Spreadsheet View
function ServicesView({ t, ratesList, simPhone, setSimPhone, simChannel, setSimChannel, handleSimulateQuickOtp, loading }) {
  return (
    <div>
      {/* Active Channels Status Box */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ background: '#F8FAFC', padding: '6px 10px', fontSize: '11px', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)' }}>
          {t.servicesTitle}
        </div>
        <table className="sheets-table">
          <thead>
            <tr>
              <th>{t.channelProto}</th>
              <th>{t.routingShare}</th>
              <th>{t.avgDelivery}</th>
              <th>{t.unitCost}</th>
              <th>{t.status}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>WhatsApp</strong></td>
              <td><span className="sheets-badge sheets-badge-emerald">58% Primary</span></td>
              <td style={{ fontFamily: 'var(--font-code)' }}>0.8s</td>
              <td style={{ fontFamily: 'var(--font-code)' }}>$0.0075</td>
              <td><span style={{ color: '#059669', fontWeight: '700' }}>● Active</span></td>
            </tr>
            <tr>
              <td><strong>Telegram</strong></td>
              <td><span className="sheets-badge sheets-badge-blue">18% Secondary</span></td>
              <td style={{ fontFamily: 'var(--font-code)' }}>0.6s</td>
              <td style={{ fontFamily: 'var(--font-code)' }}>$0.0035</td>
              <td><span style={{ color: '#059669', fontWeight: '700' }}>● Active</span></td>
            </tr>
            <tr>
              <td><strong>SMS</strong></td>
              <td><span className="sheets-badge sheets-badge-amber">21% Secondary</span></td>
              <td style={{ fontFamily: 'var(--font-code)' }}>1.4s</td>
              <td style={{ fontFamily: 'var(--font-code)' }}>$0.0210</td>
              <td><span style={{ color: '#059669', fontWeight: '700' }}>● Active</span></td>
            </tr>
            <tr>
              <td><strong>Voice Call</strong></td>
              <td><span className="sheets-badge sheets-badge-purple">3% Fallback</span></td>
              <td style={{ fontFamily: 'var(--font-code)' }}>2.1s</td>
              <td style={{ fontFamily: 'var(--font-code)' }}>$0.0240</td>
              <td><span style={{ color: '#059669', fontWeight: '700' }}>● Active</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Global Rates Grid */}
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
              <th>SMS ($)</th>
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

      {/* Test OTP Dispatcher */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '12px', background: '#FFFFFF', maxWidth: '560px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>{t.sandboxTitle}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{t.targetPhone}</label>
            <input type="text" className="sheets-input sheets-input-code" value={simPhone} onChange={(e) => setSimPhone(e.target.value)} placeholder="+60123456789" />
          </div>
          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{t.channelMode}</label>
            <select className="sheets-input" value={simChannel} onChange={(e) => setSimChannel(e.target.value)}>
              <option value="waterfall">Auto Route (Waterfall)</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="sms">SMS</option>
            </select>
          </div>
        </div>
        <button className="sheets-btn sheets-btn-primary" onClick={handleSimulateQuickOtp} disabled={loading} style={{ width: '100%', padding: '7px' }}>
          {loading ? 'Sending...' : t.execDispatch}
        </button>
      </div>
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.ServicesView = ServicesView;
}

export default ServicesView;
