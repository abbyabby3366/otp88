import React from 'react';

// Overview & KPIs Spreadsheet View
function OverviewView({ t, session, adminMetrics }) {
  return (
    <div>
      <div className="sheets-kpi-grid">
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">{t.availBalance}</div>
          <div className="sheets-kpi-value" style={{ color: '#059669' }}>${(session.balanceUsd || 50).toFixed(2)}</div>
          <div className="sheets-kpi-sub">{t.autoReload}</div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">{t.deliverySla}</div>
          <div className="sheets-kpi-value" style={{ color: '#0284C7' }}>99.98%</div>
          <div className="sheets-kpi-sub">{t.allGreen}</div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">{t.avgLatency}</div>
          <div className="sheets-kpi-value" style={{ color: '#7C3AED' }}>0.82s</div>
          <div className="sheets-kpi-sub">{t.singaporePipe}</div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">{t.monthlyVolume}</div>
          <div className="sheets-kpi-value">{adminMetrics?.totalMonthlyOtps || '14.8M'}</div>
          <div className="sheets-kpi-sub">{t.growthRate}</div>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ background: '#F8FAFC', padding: '6px 10px', fontSize: '11px', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)' }}>
          {t.servicesTitle || 'MESSAGING CHANNELS'}
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
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.OverviewView = OverviewView;
}

export default OverviewView;
