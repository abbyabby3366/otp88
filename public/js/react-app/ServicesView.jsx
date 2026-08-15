import React from 'react';

// Services & Channel Routing Spreadsheet View
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
              <td><strong>WhatsApp Cloud API Direct</strong></td>
              <td><span className="sheets-badge sheets-badge-emerald">58% Primary</span></td>
              <td style={{ fontFamily: 'var(--font-code)' }}>0.8s</td>
              <td style={{ fontFamily: 'var(--font-code)' }}>$0.0075</td>
              <td><span style={{ color: '#059669', fontWeight: '700' }}>● Optimal</span></td>
            </tr>
            <tr>
              <td><strong>Telegram MTProto Bot</strong></td>
              <td><span className="sheets-badge sheets-badge-blue">18% Fallback 1</span></td>
              <td style={{ fontFamily: 'var(--font-code)' }}>0.6s</td>
              <td style={{ fontFamily: 'var(--font-code)' }}>$0.0035</td>
              <td><span style={{ color: '#059669', fontWeight: '700' }}>● Optimal</span></td>
            </tr>
            <tr>
              <td><strong>Direct Telco SS7 SMS</strong></td>
              <td><span className="sheets-badge sheets-badge-amber">21% Fallback 2</span></td>
              <td style={{ fontFamily: 'var(--font-code)' }}>1.4s</td>
              <td style={{ fontFamily: 'var(--font-code)' }}>$0.0210</td>
              <td><span style={{ color: '#059669', fontWeight: '700' }}>● Operational</span></td>
            </tr>
            <tr>
              <td><strong>Voice Flash Call OTP</strong></td>
              <td><span className="sheets-badge sheets-badge-purple">3% Final Failover</span></td>
              <td style={{ fontFamily: 'var(--font-code)' }}>2.1s</td>
              <td style={{ fontFamily: 'var(--font-code)' }}>$0.0240</td>
              <td><span style={{ color: '#059669', fontWeight: '700' }}>● Operational</span></td>
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

      {/* Sandbox Dispatcher */}
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
              <option value="waterfall">Smart Waterfall (Auto)</option>
              <option value="whatsapp">WhatsApp Direct Pipe</option>
              <option value="telegram">Telegram Bot Route</option>
              <option value="sms">Telco SS7 SMS Route</option>
            </select>
          </div>
        </div>
        <button className="sheets-btn sheets-btn-primary" onClick={handleSimulateQuickOtp} disabled={loading} style={{ width: '100%', padding: '7px' }}>
          {loading ? 'Transmitting...' : t.execDispatch}
        </button>
      </div>
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.ServicesView = ServicesView;
}

export default ServicesView;

