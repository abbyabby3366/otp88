import React from 'react';
import { formatUsd } from './utils/format.js';

// Channels available on the platform, their coverage and unit price, plus a live test send.
function ServicesView({ t, ratesList = [], emailRate, simPhone, setSimPhone, simChannel, setSimChannel, handleSendTestOtp, loading }) {
  const myRate = ratesList.find(r => r.code === 'MY') || {};
  const rateRange = (field) => {
    const vals = ratesList.map(r => r[field]).filter(v => typeof v === 'number' && !isNaN(v));
    if (vals.length === 0) return '—';
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return min === max ? formatUsd(min) : `${formatUsd(min)} – ${formatUsd(max)}`;
  };

  const channels = [
    {
      id: 'whatsapp',
      title: 'WhatsApp OTP',
      provider: 'VerifyWay WhatsApp OTP API',
      coverage: 'Global',
      rate: rateRange('whatsapp'),
      color: '#059669',
      dot: '#10B981',
      badge: 'sheets-badge-emerald'
    },
    {
      id: 'sms',
      title: 'SMS OTP',
      provider: 'Bulk360 direct telco routes',
      coverage: 'Malaysia (+60)',
      rate: myRate.sms !== null && myRate.sms !== undefined ? formatUsd(myRate.sms) : '—',
      color: '#D97706',
      dot: '#F59E0B',
      badge: 'sheets-badge-amber'
    },
    {
      id: 'email',
      title: 'Email OTP',
      provider: 'Resend transactional email',
      coverage: 'Global',
      rate: formatUsd(emailRate),
      color: '#0284C7',
      dot: '#0284C7',
      badge: 'sheets-badge-blue'
    }
  ];

  const isEmail = simChannel === 'email';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-card)' }}>
        <div style={{ background: 'var(--bg-ribbon)', padding: '7px 12px', fontSize: '11px', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)' }}>
          {t.servicesTitle || 'MESSAGING CHANNELS'}
        </div>
        <table className="sheets-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Provider</th>
              <th>Coverage</th>
              <th>Unit Rate (USD)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {channels.map(ch => (
              <tr key={ch.id}>
                <td>
                  <span style={{ color: ch.color, fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: ch.dot, display: 'inline-block' }}></span>
                    {ch.title}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{ch.provider}</td>
                <td style={{ fontWeight: '600' }}>{ch.coverage}</td>
                <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700', color: ch.color }}>{ch.rate}</td>
                <td><span className={`sheets-badge ${ch.badge}`}>Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
          Rates are charged per OTP sent and deducted from your balance. Failed deliveries are refunded automatically.
        </div>
      </div>

      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '12px', background: 'var(--bg-card)', maxWidth: '560px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>{t.sandboxTitle || 'Send a test OTP'}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Sends a real message through the selected channel and charges your balance at the rate above.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{isEmail ? 'Email address' : (t.targetPhone || 'Phone number')}</label>
            <input
              type={isEmail ? 'email' : 'tel'}
              className="sheets-input sheets-input-code"
              value={simPhone}
              onChange={(e) => setSimPhone(e.target.value)}
              placeholder={isEmail ? 'user@example.com' : '+60123456789'}
            />
          </div>
          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{t.channelMode || 'Channel'}</label>
            <select className="sheets-input" value={simChannel} onChange={(e) => setSimChannel(e.target.value)}>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS (Malaysia)</option>
              <option value="email">Email</option>
            </select>
          </div>
        </div>
        <button type="button" className="sheets-btn sheets-btn-primary" onClick={handleSendTestOtp} disabled={loading} style={{ width: '100%', padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          {loading && <div className="sheets-spinner sheets-spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF' }} />}
          <span>{loading ? 'Sending…' : (t.execDispatch || 'Send test OTP')}</span>
        </button>
      </div>
    </div>
  );
}

export default ServicesView;
