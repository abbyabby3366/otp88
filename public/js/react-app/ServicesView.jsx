import React from 'react';

// Services & Channels View - Channel Sections (WhatsApp, Telegram, SMS)
function ServicesView({ t, ratesList, simPhone, setSimPhone, simChannel, setSimChannel, handleSimulateQuickOtp, loading }) {
  const myRate = ratesList.find(r => r.code === 'MY') || { whatsapp: 0.0075, telegram: 0.0035, sms: 0.0210 };
  const waPrice = myRate.whatsapp !== undefined && myRate.whatsapp !== null ? Number(myRate.whatsapp).toFixed(4) : '0.0075';
  const tgPrice = myRate.telegram !== undefined && myRate.telegram !== null ? Number(myRate.telegram).toFixed(4) : '0.0035';
  const smsPrice = myRate.sms !== undefined && myRate.sms !== null ? Number(myRate.sms).toFixed(4) : '0.0210';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* 1. WHATSAPP SECTION */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ background: '#F8FAFC', padding: '7px 12px', fontSize: '11px', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
            WHATSAPP OTP GATEWAY
          </span>
          <span className="sheets-badge sheets-badge-emerald">Active (Global)</span>
        </div>
        <table className="sheets-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Destination Coverage</th>
              <th>Avg Latency</th>
              <th>Unit Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>WhatsApp Business Cloud API</strong></td>
              <td><span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Global (All Countries)</span></td>
              <td style={{ fontFamily: 'var(--font-code)' }}>0.8s</td>
              <td style={{ fontFamily: 'var(--font-code)', color: '#059669', fontWeight: '700' }}>${waPrice}</td>
              <td><span style={{ color: '#059669', fontWeight: '700' }}>● Operational</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 2. TELEGRAM SECTION */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ background: '#F8FAFC', padding: '7px 12px', fontSize: '11px', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#0284C7', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284C7', display: 'inline-block' }}></span>
            TELEGRAM OTP GATEWAY
          </span>
          <span className="sheets-badge sheets-badge-blue">Active (Global)</span>
        </div>
        <table className="sheets-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Destination Coverage</th>
              <th>Avg Latency</th>
              <th>Unit Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Telegram Bot Gateway API</strong></td>
              <td><span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Global (All Countries)</span></td>
              <td style={{ fontFamily: 'var(--font-code)' }}>0.6s</td>
              <td style={{ fontFamily: 'var(--font-code)', color: '#0284C7', fontWeight: '700' }}>${tgPrice}</td>
              <td><span style={{ color: '#059669', fontWeight: '700' }}>● Operational</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. SMS SECTION */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ background: '#F8FAFC', padding: '7px 12px', fontSize: '11px', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }}></span>
            DIRECT SMS GATEWAY
          </span>
          <span className="sheets-badge sheets-badge-amber">Active (Malaysia Only)</span>
        </div>
        <table className="sheets-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Destination Coverage</th>
              <th>Direct Telco Routes</th>
              <th>Avg Latency</th>
              <th>Unit Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Direct Telco SMS</strong></td>
              <td>
                <span style={{ marginRight: '6px' }}>🇲🇾</span>
                <strong>Malaysia (+60) Only</strong>
              </td>
              <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Celcom, Digi, Maxis, U Mobile</td>
              <td style={{ fontFamily: 'var(--font-code)' }}>1.4s</td>
              <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700', color: '#334155' }}>${smsPrice}</td>
              <td><span style={{ color: '#059669', fontWeight: '700' }}>● Operational</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Test OTP Dispatcher */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '12px', background: '#FFFFFF', maxWidth: '560px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>{t.sandboxTitle || 'Send Test OTP'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{t.targetPhone || 'Phone Number'}</label>
            <input type="text" className="sheets-input sheets-input-code" value={simPhone} onChange={(e) => setSimPhone(e.target.value)} placeholder="+60123456789" />
          </div>
          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{t.channelMode || 'Channel'}</label>
            <select className="sheets-input" value={simChannel} onChange={(e) => setSimChannel(e.target.value)}>
              <option value="whatsapp">WhatsApp (Global)</option>
              <option value="telegram">Telegram (Global)</option>
              <option value="sms">SMS (Malaysia Only)</option>
            </select>
          </div>
        </div>
        <button className="sheets-btn sheets-btn-primary" onClick={handleSimulateQuickOtp} disabled={loading} style={{ width: '100%', padding: '7px' }}>
          {loading ? 'Sending...' : (t.execDispatch || 'Send Test OTP')}
        </button>
      </div>

    </div>
  );
}

if (typeof window !== 'undefined') {
  window.ServicesView = ServicesView;
}

export default ServicesView;
