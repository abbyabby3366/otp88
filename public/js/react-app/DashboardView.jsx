import React from 'react';
import { TableLoader } from './TableLoader.jsx';

// Tidy & Useful Overview Dashboard Component
function DashboardView({ t, session, adminMetrics, setActiveTab, logs = [], usersList = [], ratesList = [], loading = false }) {
  const isAdmin = session?.role === 'ADMIN';

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

  // Recent 5 logs preview
  const recentLogs = logs.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* 1. Core Summary Stats Ribbon Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'repeat(auto-fit, minmax(190px, 1fr))' : 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
        
        {/* Stat 1: Monthly OTP Sent */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {t.monthlyVolume || 'Monthly Volume'}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', fontFamily: 'var(--font-code)', lineHeight: 1.1 }}>
            {typeof monthlyOtps === 'number' ? monthlyOtps.toLocaleString() : (monthlyOtps || '0')}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#059669', fontWeight: '700' }}>● Live</span>
            <span>Total Spent: {totalSpent}</span>
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
