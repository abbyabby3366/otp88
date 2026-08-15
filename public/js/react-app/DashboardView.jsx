import React, { useState, useMemo } from 'react';

const DEFAULT_GLOBAL_RATES = [
  { country: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾', whatsapp: 0.0075, telegram: 0.0035, sms: 0.0210, avgLatency: '0.8s', successRate: '99.98%', directRoutes: ['Celcom', 'Digi', 'Maxis', 'U Mobile'] },
  { country: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬', whatsapp: 0.0075, telegram: 0.0035, sms: null, avgLatency: '0.8s', successRate: '99.98%', directRoutes: ['WhatsApp Global', 'Telegram Bot'] },
  { country: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩', whatsapp: 0.0075, telegram: 0.0035, sms: null, avgLatency: '0.8s', successRate: '99.98%', directRoutes: ['WhatsApp Global', 'Telegram Bot'] },
  { country: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭', whatsapp: 0.0075, telegram: 0.0035, sms: null, avgLatency: '0.8s', successRate: '99.98%', directRoutes: ['WhatsApp Global', 'Telegram Bot'] },
  { country: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳', whatsapp: 0.0075, telegram: 0.0035, sms: null, avgLatency: '0.8s', successRate: '99.98%', directRoutes: ['WhatsApp Global', 'Telegram Bot'] },
  { country: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭', whatsapp: 0.0075, telegram: 0.0035, sms: null, avgLatency: '0.8s', successRate: '99.98%', directRoutes: ['WhatsApp Global', 'Telegram Bot'] },
  { country: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸', whatsapp: 0.0075, telegram: 0.0035, sms: null, avgLatency: '0.8s', successRate: '99.98%', directRoutes: ['WhatsApp Global', 'Telegram Bot'] },
  { country: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧', whatsapp: 0.0075, telegram: 0.0035, sms: null, avgLatency: '0.8s', successRate: '99.98%', directRoutes: ['WhatsApp Global', 'Telegram Bot'] },
  { country: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺', whatsapp: 0.0075, telegram: 0.0035, sms: null, avgLatency: '0.8s', successRate: '99.98%', directRoutes: ['WhatsApp Global', 'Telegram Bot'] },
  { country: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳', whatsapp: 0.0075, telegram: 0.0035, sms: null, avgLatency: '0.8s', successRate: '99.98%', directRoutes: ['WhatsApp Global', 'Telegram Bot'] },
  { country: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪', whatsapp: 0.0075, telegram: 0.0035, sms: null, avgLatency: '0.8s', successRate: '99.98%', directRoutes: ['WhatsApp Global', 'Telegram Bot'] },
  { country: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵', whatsapp: 0.0075, telegram: 0.0035, sms: null, avgLatency: '0.8s', successRate: '99.98%', directRoutes: ['WhatsApp Global', 'Telegram Bot'] }
];

// Dashboard Tab View (Overview KPIs + OTP Channel & Destination Pricing)
function DashboardView({ t, session, adminMetrics, ratesList, setActiveTab }) {
  const [searchTerm, setSearchTerm] = useState('');

  const activeRates = useMemo(() => {
    const list = (ratesList && ratesList.length > 0) ? ratesList : DEFAULT_GLOBAL_RATES;
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase().trim();
    return list.filter(r => 
      (r.country && r.country.toLowerCase().includes(q)) ||
      (r.code && r.code.toLowerCase().includes(q)) ||
      (r.dialCode && r.dialCode.toLowerCase().includes(q))
    );
  }, [ratesList, searchTerm]);

  // Derive Malaysia or primary default rates for the channel summary
  const myRate = (ratesList && ratesList.find(r => r.code === 'MY')) || DEFAULT_GLOBAL_RATES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* KPI Overview Cards */}
      <div className="sheets-kpi-grid">
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">{t.availBalance || 'AVAILABLE BALANCE'}</div>
          <div className="sheets-kpi-value" style={{ color: '#059669' }}>
            ${(session?.balanceUsd !== undefined ? session.balanceUsd : 50).toFixed(2)}
          </div>
          <div className="sheets-kpi-sub">{t.autoReload || '● Active'}</div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">{t.deliverySla || 'DELIVERY RATE'}</div>
          <div className="sheets-kpi-value" style={{ color: '#0284C7' }}>
            {adminMetrics?.carrierSuccessRate || adminMetrics?.deliveryRate || '100.0%'}
          </div>
          <div className="sheets-kpi-sub">{t.allGreen || '● Systems Operational'}</div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">{t.avgLatency || 'AVG LATENCY'}</div>
          <div className="sheets-kpi-value" style={{ color: '#7C3AED' }}>
            {adminMetrics?.avgLatency || myRate?.avgLatency || '0.55s'}
          </div>
          <div className="sheets-kpi-sub">{t.singaporePipe || 'Region: Malaysia'}</div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">{t.monthlyVolume || 'TOTAL OTP SENT'}</div>
          <div className="sheets-kpi-value">
            {adminMetrics?.totalMonthlyOtps || adminMetrics?.totalOtps !== undefined ? String(adminMetrics.totalOtps ?? adminMetrics.totalMonthlyOtps) : '0'}
          </div>
          <div className="sheets-kpi-sub">
            {adminMetrics?.totalSpentUsd ? `$${adminMetrics.totalSpentUsd} total spent` : '● Live Usage Sync'}
          </div>
        </div>
      </div>

      {/* OTP Channel Pricing Cards */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
              {t.pricingOverviewTitle || 'OTP PRICING & CHANNELS'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
              {t.pricingOverviewSub || 'Live per-message delivery rates across all messaging routes'}
            </span>
          </div>
          {session?.role === 'ADMIN' && setActiveTab && (
            <button
              className="sheets-btn sheets-btn-primary"
              style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => setActiveTab('admin-rates')}
            >
              <span>⚙️</span>
              <span>{t.configurePricingBtn || 'Set Pricing in Admin'}</span>
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {/* WhatsApp OTP Card */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#10B981' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>💬</span>
                <span style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A' }}>WhatsApp OTP</span>
              </div>
              <span className="sheets-badge sheets-badge-emerald" style={{ fontSize: '9px', padding: '2px 6px' }}>58% Primary</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0 2px' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', fontFamily: 'var(--font-code)', color: '#059669' }}>
                ${(myRate.whatsapp ?? 0.0075).toFixed(4)}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ OTP</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery Speed:</span>
                <strong style={{ color: '#059669', fontFamily: 'var(--font-code)' }}>~0.8s (Instant)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Route Protocol:</span>
                <span style={{ color: 'var(--text-muted)' }}>Direct Meta Business API</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Deliverability:</span>
                <strong style={{ color: '#0284C7' }}>99.98% SLA</strong>
              </div>
            </div>
          </div>

          {/* Telegram OTP Card */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#0284C7' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>✈️</span>
                <span style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A' }}>Telegram OTP</span>
              </div>
              <span className="sheets-badge sheets-badge-blue" style={{ fontSize: '9px', padding: '2px 6px' }}>Lowest Cost</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0 2px' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', fontFamily: 'var(--font-code)', color: '#0284C7' }}>
                ${(myRate.telegram ?? 0.0035).toFixed(4)}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ OTP</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery Speed:</span>
                <strong style={{ color: '#0284C7', fontFamily: 'var(--font-code)' }}>~0.6s (Ultra Fast)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Route Protocol:</span>
                <span style={{ color: 'var(--text-muted)' }}>Telegram Direct Bot Gateway</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Deliverability:</span>
                <strong style={{ color: '#0284C7' }}>100% Guaranteed</strong>
              </div>
            </div>
          </div>

          {/* SMS Direct Telco Card */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#F59E0B' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>📱</span>
                <span style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A' }}>SMS OTP</span>
              </div>
              <span className="sheets-badge sheets-badge-amber" style={{ fontSize: '9px', padding: '2px 6px' }}>Direct Telco</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0 2px' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', fontFamily: 'var(--font-code)', color: '#D97706' }}>
                ${(myRate.sms ?? 0.0210).toFixed(4)}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ OTP (MY)</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery Speed:</span>
                <strong style={{ color: '#D97706', fontFamily: 'var(--font-code)' }}>~1.4s</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Route Protocol:</span>
                <span style={{ color: 'var(--text-muted)' }}>Celcom / Digi / Maxis / U Mobile</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Device Compatibility:</span>
                <strong style={{ color: '#059669' }}>100% Handset Reach</strong>
              </div>
            </div>
          </div>

          {/* Voice Call OTP Card */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#8B5CF6' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>📞</span>
                <span style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A' }}>Voice Call OTP</span>
              </div>
              <span className="sheets-badge sheets-badge-purple" style={{ fontSize: '9px', padding: '2px 6px' }}>Fallback</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0 2px' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', fontFamily: 'var(--font-code)', color: '#7C3AED' }}>
                $0.0240
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ OTP</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery Speed:</span>
                <strong style={{ color: '#7C3AED', fontFamily: 'var(--font-code)' }}>~2.1s</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Route Protocol:</span>
                <span style={{ color: 'var(--text-muted)' }}>Automated Voice TTS Dispatch</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Use Case:</span>
                <strong style={{ color: '#059669' }}>Fail-safe Delivery Assured</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Destination Rates Table */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', gap: '8px' }}>
          <div>
            <span style={{ fontWeight: '800', fontSize: '11px', color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
              {t.ratesTitle || 'DESTINATION CARRIER RATES (USD / OTP)'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginLeft: '8px' }}>
              ({activeRates.length} countries supported)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              className="sheets-input"
              placeholder={t.searchRatesPlaceholder || 'Search country, ISO, dial code...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '220px', padding: '3px 8px', fontSize: '11px' }}
            />
            {searchTerm && (
              <button
                className="sheets-btn"
                onClick={() => setSearchTerm('')}
                style={{ fontSize: '10px', padding: '3px 6px' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>ISO</th>
              <th>{t.country || 'Country / Region'}</th>
              <th>Dial Code</th>
              <th>WhatsApp OTP ($)</th>
              <th>Telegram OTP ($)</th>
              <th>SMS OTP ($)</th>
              <th>Direct Routes</th>
              <th>Latency</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {activeRates.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  No matching countries found for "{searchTerm}".
                </td>
              </tr>
            ) : (
              activeRates.map((rate) => (
                <tr key={rate.code}>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {rate.code}
                  </td>
                  <td>
                    <span style={{ marginRight: '6px', fontSize: '14px' }}>{rate.flag || '🌐'}</span>
                    <strong>{rate.country}</strong>
                  </td>
                  <td style={{ fontFamily: 'var(--font-code)', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {rate.dialCode}
                  </td>
                  <td style={{ fontFamily: 'var(--font-code)', color: '#059669', fontWeight: '800' }}>
                    ${(rate.whatsapp ?? 0.0075).toFixed(4)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-code)', color: '#0284C7', fontWeight: '800' }}>
                    ${(rate.telegram ?? 0.0035).toFixed(4)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-code)' }}>
                    {rate.sms !== null && rate.sms !== undefined ? (
                      <strong style={{ color: '#D97706' }}>${Number(rate.sms).toFixed(4)}</strong>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {rate.directRoutes ? rate.directRoutes.join(', ') : (rate.code === 'MY' ? 'Celcom, Digi, Maxis' : 'Direct Cloud Route')}
                  </td>
                  <td style={{ fontFamily: 'var(--font-code)', fontSize: '11px', color: '#059669', fontWeight: '600' }}>
                    {rate.avgLatency || '0.8s'}
                  </td>
                  <td>
                    <span className="sheets-badge sheets-badge-emerald" style={{ fontSize: '9px', padding: '2px 5px' }}>
                      Active
                    </span>
                  </td>
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

