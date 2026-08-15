import React, { useState, useEffect } from 'react';
import { TableLoader } from './TableLoader.jsx';

// Tidy & Useful Overview Dashboard Component
function DashboardView({ 
  t, 
  session, 
  adminMetrics, 
  setActiveTab, 
  logs = [], 
  usersList = [], 
  ratesList = [], 
  loading = false,
  fromDate = '',
  toDate = '',
  onDateRangeChange
}) {
  const isAdmin = session?.role === 'ADMIN';

  // Local date range state synced with props
  const [localFrom, setLocalFrom] = useState(() => {
    if (fromDate) return fromDate;
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}-01`;
  });

  const [localTo, setLocalTo] = useState(() => {
    if (toDate) return toDate;
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [activePreset, setActivePreset] = useState('month');

  useEffect(() => {
    if (fromDate && fromDate !== localFrom) setLocalFrom(fromDate);
    if (toDate && toDate !== localTo) setLocalTo(toDate);
  }, [fromDate, toDate]);

  const handleApplyRange = (newFrom, newTo, preset = 'custom') => {
    setLocalFrom(newFrom);
    setLocalTo(newTo);
    setActivePreset(preset);
    if (onDateRangeChange) {
      onDateRangeChange(newFrom, newTo);
    }
  };

  const handlePresetSelect = (preset) => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    let start = `${yyyy}-${mm}-01`;
    let end = todayStr;

    if (preset === 'today') {
      start = todayStr;
      end = todayStr;
    } else if (preset === '7days') {
      const p = new Date();
      p.setDate(p.getDate() - 6);
      const py = p.getFullYear();
      const pm = String(p.getMonth() + 1).padStart(2, '0');
      const pd = String(p.getDate()).padStart(2, '0');
      start = `${py}-${pm}-${pd}`;
      end = todayStr;
    } else if (preset === '30days') {
      const p = new Date();
      p.setDate(p.getDate() - 29);
      const py = p.getFullYear();
      const pm = String(p.getMonth() + 1).padStart(2, '0');
      const pd = String(p.getDate()).padStart(2, '0');
      start = `${py}-${pm}-${pd}`;
      end = todayStr;
    } else if (preset === 'month') {
      start = `${yyyy}-${mm}-01`;
      end = todayStr;
    } else if (preset === 'all') {
      start = '2024-01-01';
      end = todayStr;
    }

    handleApplyRange(start, end, preset);
  };

  // Calculate dynamic rates from actual rates configuration
  const activeRates = (ratesList && ratesList.length > 0) ? ratesList : [
    { country: 'Malaysia', code: 'MY', whatsapp: 0.0075, telegram: 0.0035, sms: 0.0210 }
  ];

  const formatRateRange = (channelProp, defaultVal) => {
    const vals = activeRates
      .map(r => r[channelProp])
      .filter(v => typeof v === 'number' && !isNaN(v) && v > 0);

    if (vals.length === 0) {
      return `$${Number(defaultVal).toFixed(4)} / OTP`;
    }
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (min === max) {
      return `$${min.toFixed(4)} / OTP`;
    }
    return `$${min.toFixed(4)} - $${max.toFixed(4)} / OTP`;
  };

  const whatsappRateText = formatRateRange('whatsapp', 0.0075);
  const telegramRateText = formatRateRange('telegram', 0.0035);
  const smsRateText = formatRateRange('sms', 0.0210);

  // Metrics extraction
  const totalOtps = adminMetrics?.totalOtps !== undefined ? adminMetrics.totalOtps : (logs.length || 0);
  const monthlyOtps = adminMetrics?.monthlyOtps !== undefined
    ? adminMetrics.monthlyOtps
    : (adminMetrics?.totalMonthlyOtps !== undefined
      ? adminMetrics.totalMonthlyOtps
      : totalOtps);
  const successRate = adminMetrics?.carrierSuccessRate || adminMetrics?.deliveryRate || '99.98%';
  const avgLatency = adminMetrics?.avgLatency || '0.55s';
  const balance = (session?.balanceUsd !== undefined ? session.balanceUsd : (adminMetrics?.balanceUsd ?? 50.00)).toFixed(4);
  const totalSpent = adminMetrics?.totalSpentUsd ? `$${adminMetrics.totalSpentUsd}` : '$0.0000';
  const totalUsers = usersList.length || adminMetrics?.totalTenants || 2;

  const displayFromDate = adminMetrics?.fromDate || localFrom;
  const displayToDate = adminMetrics?.toDate || localTo;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Date Range Filter Bar */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {/* Preset Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginRight: '4px' }}>
            {t.filterDateRange || 'Date Range'}:
          </span>
          {[
            { id: 'month', label: t.thisMonth || 'This Month' },
            { id: '7days', label: t.last7Days || 'Last 7 Days' },
            { id: '30days', label: t.last30Days || 'Last 30 Days' },
            { id: 'today', label: t.today || 'Today' },
            { id: 'all', label: t.allTime || 'All Time' }
          ].map(btn => (
            <button
              key={btn.id}
              type="button"
              className={`sheets-btn ${activePreset === btn.id ? 'sheets-btn-primary' : ''}`}
              onClick={() => handlePresetSelect(btn.id)}
              style={{ padding: '2px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Custom From & To Date Pickers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{t.fromDate || 'From'}:</span>
            <input
              type="date"
              className="sheets-input sheets-input-code"
              value={localFrom}
              onChange={(e) => handleApplyRange(e.target.value, localTo, 'custom')}
              style={{ padding: '2px 6px', fontSize: '11px', width: '125px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{t.toDate || 'To'}:</span>
            <input
              type="date"
              className="sheets-input sheets-input-code"
              value={localTo}
              onChange={(e) => handleApplyRange(localFrom, e.target.value, 'custom')}
              style={{ padding: '2px 6px', fontSize: '11px', width: '125px' }}
            />
          </div>
        </div>
      </div>

      {/* 1. Core Summary Stats Ribbon Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'repeat(auto-fit, minmax(190px, 1fr))' : 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
        
        {/* Stat 1: Monthly OTP Sent with From Date and To Date */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {t.monthlyVolume || 'Monthly Volume'}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-code)', background: 'var(--bg-subtle, #F1F5F9)', padding: '1px 5px', borderRadius: '3px' }}>
              {displayFromDate} ~ {displayToDate}
            </span>
          </div>

          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', fontFamily: 'var(--font-code)', lineHeight: 1.1 }}>
            {typeof monthlyOtps === 'number' ? monthlyOtps.toLocaleString() : (monthlyOtps || '0')}
          </div>

          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#059669', fontWeight: '700' }}>● Live</span>
              <span>Total Spent: {totalSpent}</span>
            </div>
          </div>
        </div>

        {/* Stat 2: Delivery Success Rate */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {t.deliverySla || 'Delivery Success Rate'}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669', fontFamily: 'var(--font-code)', lineHeight: 1.1 }}>
            {successRate}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            High-availability carrier routing
          </div>
        </div>

        {/* Stat 3: Avg Latency */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {t.avgLatency || 'Average Latency'}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0284C7', fontFamily: 'var(--font-code)', lineHeight: 1.1 }}>
            {avgLatency}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Direct Telephony & Cloud APIs
          </div>
        </div>

        {/* Stat 4: Account Balance */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {t.availBalance || 'Account Balance'}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669', fontFamily: 'var(--font-code)', lineHeight: 1.1 }}>
            ${balance}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Auto-deduct on Send</span>
            {setActiveTab && (
              <button
                type="button"
                className="sheets-btn"
                style={{ padding: '1px 6px', fontSize: '9px', fontWeight: '700' }}
                onClick={() => setActiveTab(isAdmin ? 'admin-billing' : 'billing')}
              >
                Top up →
              </button>
            )}
          </div>
        </div>

        {/* Stat 5: Tenants / Users (Admin only) */}
        {isAdmin && (
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Active Users
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#7C3AED', fontFamily: 'var(--font-code)', lineHeight: 1.1 }}>
              {totalUsers}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Multi-tenant Isolation</span>
              {setActiveTab && (
                <button
                  type="button"
                  className="sheets-btn"
                  style={{ padding: '1px 6px', fontSize: '9px', fontWeight: '700' }}
                  onClick={() => setActiveTab('users')}
                >
                  Manage →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Overview Grid (2 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
        
        {/* Card: Quick Platform Channel Routing Summary */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>SUPPORTED MESSAGING PLATFORMS</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Multi-Channel Coverage</span>
          </div>
          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>WhatsApp OTP</span>
              <strong style={{ color: '#059669', fontFamily: 'var(--font-code)' }}>{whatsappRateText}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Telegram OTP</span>
              <strong style={{ color: '#0284C7', fontFamily: 'var(--font-code)' }}>{telegramRateText}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Direct Telco SMS</span>
              <strong style={{ color: '#D97706', fontFamily: 'var(--font-code)' }}>{smsRateText}</strong>
            </div>
          </div>
        </div>

        {/* Slot 2: Ready for second widget */}
        <div style={{ minHeight: '120px' }} />

      </div>

    </div>
  );
}

if (typeof window !== 'undefined') {
  window.DashboardView = DashboardView;
}

export default DashboardView;
