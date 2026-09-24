import React, { useState, useEffect } from 'react';
import { firstOfMonthIso, todayIso, daysAgoIso, formatUsd, EMPTY } from './utils/format.js';

// Overview dashboard. Every figure comes from the server; anything not yet available shows a dash.
function DashboardView({
  t,
  session,
  adminMetrics,
  setActiveTab,
  logs = [],
  usersList = [],
  ratesList = [],
  emailRate,
  loading = false,
  fromDate = '',
  toDate = '',
  onDateRangeChange
}) {
  const isAdmin = session?.role === 'ADMIN';

  const [localFrom, setLocalFrom] = useState(fromDate || firstOfMonthIso());
  const [localTo, setLocalTo] = useState(toDate || todayIso());
  const [activePreset, setActivePreset] = useState('month');

  useEffect(() => {
    if (fromDate && fromDate !== localFrom) setLocalFrom(fromDate);
    if (toDate && toDate !== localTo) setLocalTo(toDate);
  }, [fromDate, toDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyRange = (newFrom, newTo, preset = 'custom') => {
    setLocalFrom(newFrom);
    setLocalTo(newTo);
    setActivePreset(preset);
    if (onDateRangeChange) onDateRangeChange(newFrom, newTo);
  };

  const selectPreset = (preset) => {
    const today = todayIso();
    const ranges = {
      today: [today, today],
      '7days': [daysAgoIso(6), today],
      '30days': [daysAgoIso(29), today],
      month: [firstOfMonthIso(), today],
      all: ['2024-01-01', today]
    };
    const [start, end] = ranges[preset] || ranges.month;
    applyRange(start, end, preset);
  };

  const rateRange = (field) => {
    const vals = ratesList.map(r => r[field]).filter(v => typeof v === 'number' && !isNaN(v));
    if (vals.length === 0) return EMPTY;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return min === max ? `${formatUsd(min)} / OTP` : `${formatUsd(min)} – ${formatUsd(max)} / OTP`;
  };

  const m = adminMetrics || {};
  const periodOtps = typeof m.monthlyOtps === 'number' ? m.monthlyOtps.toLocaleString() : EMPTY;
  const deliveryRate = m.deliveryRate || EMPTY;
  const avgLatency = m.avgLatency || EMPTY;
  const balanceValue = session?.balanceUsd ?? m.balanceUsd;
  const balance = balanceValue === null || balanceValue === undefined ? EMPTY : formatUsd(balanceValue);
  const totalSpent = m.totalSpentUsd !== undefined ? formatUsd(m.totalSpentUsd) : EMPTY;
  const totalUsers = usersList.length || m.totalTenants || 0;
  const hasTraffic = (m.totalOtps || 0) > 0 || logs.length > 0;

  const card = { background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' };
  const label = { fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' };
  const value = (color) => ({ fontSize: '24px', fontWeight: '900', color, fontFamily: 'var(--font-code)', lineHeight: 1.1 });
  const hint = { fontSize: '10px', color: 'var(--text-muted)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Date range */}
      <div style={{ ...card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginRight: '4px' }}>{t.filterDateRange || 'Date range'}:</span>
          {[
            { id: 'today', label: t.today || 'Today' },
            { id: '7days', label: t.last7Days || 'Last 7 days' },
            { id: '30days', label: t.last30Days || 'Last 30 days' },
            { id: 'month', label: t.thisMonth || 'This month' },
            { id: 'all', label: t.allTime || 'All time' }
          ].map(btn => (
            <button key={btn.id} type="button" className={`sheets-btn ${activePreset === btn.id ? 'sheets-btn-primary' : ''}`} onClick={() => selectPreset(btn.id)} style={{ padding: '2px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}>
              {btn.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
            {t.fromDate || 'From'}
            <input type="date" className="sheets-input sheets-input-code" value={localFrom} onChange={(e) => applyRange(e.target.value, localTo)} style={{ padding: '2px 6px', fontSize: '11px', width: '125px' }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
            {t.toDate || 'To'}
            <input type="date" className="sheets-input sheets-input-code" value={localTo} onChange={(e) => applyRange(localFrom, e.target.value)} style={{ padding: '2px 6px', fontSize: '11px', width: '125px' }} />
          </label>
        </div>
      </div>

      {/* Key figures */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isAdmin ? 190 : 210}px, 1fr))`, gap: '10px' }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={label}>{t.monthlyVolume || 'OTPs sent'}</div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-code)', background: 'var(--bg-main)', padding: '1px 5px', borderRadius: '3px' }}>
              {m.fromDate || localFrom} ~ {m.toDate || localTo}
            </span>
          </div>
          <div style={value('var(--text-primary)')}>{loading && !adminMetrics ? '…' : periodOtps}</div>
          <div style={hint}>Spent in period: {totalSpent}</div>
        </div>

        <div style={card}>
          <div style={label}>{t.deliverySla || 'Delivery rate'}</div>
          <div style={value('#059669')}>{deliveryRate}</div>
          <div style={hint}>{hasTraffic ? 'Delivered, read or awaiting receipt, over all attempts' : 'No traffic yet'}</div>
        </div>

        <div style={card}>
          <div style={label}>{t.avgLatency || 'Average latency'}</div>
          <div style={value('#0284C7')}>{avgLatency}</div>
          <div style={hint}>{hasTraffic ? 'Across the last 100 messages' : 'No traffic yet'}</div>
        </div>

        <div style={card}>
          <div style={label}>{t.availBalance || 'Account balance'}</div>
          <div style={value('#059669')}>{balance}</div>
          <div style={{ ...hint, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Deducted per OTP sent</span>
            {setActiveTab && (
              <button type="button" className="sheets-btn" style={{ padding: '1px 6px', fontSize: '9px', fontWeight: '700' }} onClick={() => setActiveTab('billing')}>
                Top up
              </button>
            )}
          </div>
        </div>

        {isAdmin && (
          <div style={card}>
            <div style={label}>Users</div>
            <div style={value('#7C3AED')}>{totalUsers}</div>
            <div style={{ ...hint, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Registered accounts</span>
              {setActiveTab && (
                <button type="button" className="sheets-btn" style={{ padding: '1px 6px', fontSize: '9px', fontWeight: '700' }} onClick={() => setActiveTab('users')}>
                  Manage
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Channels & recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
        <div style={{ ...card, padding: 0, overflow: 'hidden', gap: 0 }}>
          <div style={{ background: 'var(--bg-ribbon)', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
            <span>{t.pricingOverviewTitle || 'CHANNELS & RATES'}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>USD per OTP</span>
          </div>
          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
            {[
              { name: 'WhatsApp OTP', rate: rateRange('whatsapp'), color: '#059669' },
              { name: 'SMS OTP (Malaysia)', rate: rateRange('sms'), color: '#D97706' },
              { name: 'Email OTP', rate: emailRate !== null && emailRate !== undefined ? `${formatUsd(emailRate)} / OTP` : EMPTY, color: '#0284C7' }
            ].map(ch => (
              <div key={ch.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{ch.name}</span>
                <strong style={{ color: ch.color, fontFamily: 'var(--font-code)' }}>{ch.rate}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...card, padding: 0, overflow: 'hidden', gap: 0 }}>
          <div style={{ background: 'var(--bg-ribbon)', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
            <span>{t.liveLogsTitle || 'RECENT ACTIVITY'}</span>
            {setActiveTab && (
              <button type="button" className="sheets-btn" style={{ padding: '0 6px', fontSize: '9px', fontWeight: '700' }} onClick={() => setActiveTab('logs')}>View all</button>
            )}
          </div>
          {logs.length === 0 ? (
            <div style={{ padding: '18px 14px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
              No OTPs sent yet. Use the API or the Services tab to send your first one.
            </div>
          ) : (
            <table className="sheets-table" style={{ fontSize: '11px' }}>
              <tbody>
                {logs.slice(0, 6).map((log, i) => (
                  <tr key={log.id || i}>
                    <td style={{ fontFamily: 'var(--font-code)', color: 'var(--text-secondary)' }}>{log.channel}</td>
                    <td style={{ fontWeight: '600' }}>{log.to}</td>
                    <td>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: ['DELIVERED', 'SENT', 'READ'].includes(String(log.status).toUpperCase()) ? '#059669' : '#DC2626' }}>{log.status}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', textAlign: 'right' }}>{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
