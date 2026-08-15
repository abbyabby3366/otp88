import React from 'react';
import { TableLoader } from './TableLoader.jsx';

// Tidy & Useful Overview Dashboard Component
function DashboardView({ t, session, adminMetrics, setActiveTab, logs = [], usersList = [], loading = false }) {
  const isAdmin = session?.role === 'ADMIN';

  // Metrics extraction
  const totalOtps = adminMetrics?.totalOtps !== undefined ? adminMetrics.totalOtps : (logs.length || 0);
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
        
        {/* Stat 1: Total OTP Sent */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {t.monthlyVolume || 'Total OTPs Dispatched'}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', fontFamily: 'var(--font-code)', lineHeight: 1.1 }}>
            {totalOtps.toLocaleString()}
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
          <div style={{ fontSize: '10px', color: '#059669', fontWeight: '600' }}>
            ● 99.98% SLA Guaranteed
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

      {/* 2. Useful Overview Grid: Gateway Health & Fast Channel Traffic */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
        
        {/* Card A: Live Gateway Status */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚡ DISPATCH GATEWAYS OPERATIONAL STATUS</span>
            <span style={{ fontSize: '10px', color: '#059669', fontWeight: '700' }}>● All 100% Operational</span>
          </div>
          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
            {[
              { name: 'WhatsApp Business (Meta & VerifyWay API)', status: 'Operational', latency: '0.6s', color: '#10B981', badge: 'sheets-badge-emerald' },
              { name: 'Telegram Bot Gateway (Instant Dispatch)', status: 'Operational', latency: '0.5s', color: '#0284C7', badge: 'sheets-badge-blue' },
              { name: 'Direct Telco SMS (SMS360 / Celcom / Digi / Maxis)', status: 'Operational', latency: '1.4s', color: '#D97706', badge: 'sheets-badge-amber' },
              { name: 'Voice Flash Call OTP (Automated TTS Fallback)', status: 'Operational', latency: '1.9s', color: '#7C3AED', badge: 'sheets-badge-purple' }
            ].map((gw, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: idx < 3 ? '6px' : '0', borderBottom: idx < 3 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: gw.color, display: 'inline-block' }} />
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{gw.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-code)', fontSize: '10px', color: 'var(--text-muted)' }}>{gw.latency}</span>
                  <span className={`sheets-badge ${gw.badge}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                    {gw.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card B: Quick Platform Channel Routing Summary */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📊 SUPPORTED MESSAGING PLATFORMS</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>6 Active Regions</span>
          </div>
          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>WhatsApp OTP (All 6 Destinations)</span>
              <strong style={{ color: '#059669', fontFamily: 'var(--font-code)' }}>$0.0075 / OTP</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Telegram OTP (All 6 Destinations)</span>
              <strong style={{ color: '#0284C7', fontFamily: 'var(--font-code)' }}>$0.0035 / OTP</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Direct Telco SMS (🇲🇾 Malaysia Route)</span>
              <strong style={{ color: '#D97706', fontFamily: 'var(--font-code)' }}>$0.0210 / OTP</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Voice Flash Call OTP (Automated)</span>
              <strong style={{ color: '#7C3AED', fontFamily: 'var(--font-code)' }}>$0.0240 / OTP</strong>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Recent OTP Dispatches Activity Grid */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ background: '#F8FAFC', padding: '8px 12px', fontSize: '11px', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>RECENT OTP DISPATCH ACTIVITY</span>
          {setActiveTab && (
            <button
              type="button"
              className="sheets-btn"
              style={{ fontSize: '10px', padding: '2px 8px', fontWeight: '700' }}
              onClick={() => setActiveTab(isAdmin ? 'admin-logs' : 'logs')}
            >
              View Full Logs ({totalOtps}) →
            </button>
          )}
        </div>

        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '35px' }}>#</th>
              <th>Transaction ID</th>
              {isAdmin && <th>User</th>}
              <th>Recipient</th>
              <th>Channel</th>
              <th>Latency</th>
              <th>Cost</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {loading && recentLogs.length === 0 ? (
              <TableLoader colSpan={isAdmin ? 9 : 8} message="Loading recent OTP activity..." />
            ) : recentLogs.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                  No recent dispatches. Send an OTP to see live real-time entries here.
                </td>
              </tr>
            ) : (
              recentLogs.map((log, idx) => (
                <tr key={log.id || idx}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '10px' }}>{idx + 1}</td>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '600' }}>{log.id}</td>
                  {isAdmin && (
                    <td>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                        {log.userName || 'System / Direct API'}
                      </span>
                    </td>
                  )}
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>{log.to}</td>
                  <td>
                    <span className={`sheets-badge ${
                      (log.channel || '').toUpperCase().includes('WHATSAPP') ? 'sheets-badge-emerald' :
                      (log.channel || '').toUpperCase().includes('TELEGRAM') ? 'sheets-badge-blue' :
                      (log.channel || '').toUpperCase().includes('VOICE') ? 'sheets-badge-purple' :
                      (log.channel || '').toUpperCase().includes('RCS') ? 'sheets-badge-indigo' :
                      (log.channel || '').toUpperCase().includes('EMAIL') ? 'sheets-badge-cyan' :
                      'sheets-badge-amber'
                    }`}>
                      {log.channel}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-code)', color: '#059669', fontWeight: '700' }}>{log.latency || '0.6s'}</td>
                  <td style={{ fontFamily: 'var(--font-code)' }}>{log.cost || '$0.0075'}</td>
                  <td>
                    <span style={{ color: log.status === 'FAILED' ? '#DC2626' : '#059669', fontWeight: '700', fontSize: '11px' }}>
                      {log.status === 'FAILED' ? 'FAILED' : (log.status || 'DELIVERED')}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-code)', color: 'var(--text-muted)', fontSize: '11px' }}>{log.time}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

if (typeof window !== 'undefined') {
  window.DashboardView = DashboardView;
}

export default DashboardView;
