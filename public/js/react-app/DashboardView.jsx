// Dashboard Tab View (Overview KPIs + Live Delivery Stream)
function DashboardView({ t, session, adminMetrics, logs }) {
  return (
    <div>
      {/* KPI Cards */}
      <div className="sheets-kpi-grid" style={{ marginBottom: '12px' }}>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">{t.availBalance}</div>
          <div className="sheets-kpi-value" style={{ color: '#059669' }}>
            ${(session.balanceUsd || 50).toFixed(2)}
          </div>
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

      {/* Live Delivery Stream Table */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px' }}>
          <span style={{ fontWeight: '700' }}>{t.liveLogsTitle}</span>
          <span style={{ color: 'var(--text-muted)' }}>Auto WebSocket Live Stream</span>
        </div>
        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>{t.row}</th>
              <th>{t.txId}</th>
              <th>{t.recipient}</th>
              <th>{t.carrierRoute}</th>
              <th>{t.avgDelivery}</th>
              <th>{t.unitCost}</th>
              <th>{t.status}</th>
              <th>{t.timestamp}</th>
            </tr>
          </thead>
          <tbody>
            {(!logs || logs.length === 0) ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                  No live OTP logs recorded in MongoDB yet. Dispatch a test OTP from the Services tab to view live delivery stream.
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '10px' }}>{idx + 1}</td>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '600' }}>{log.id}</td>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>{log.to}</td>
                  <td>
                    <span className={`sheets-badge ${log.channel && log.channel.includes('WHATSAPP') ? 'sheets-badge-emerald' : log.channel && log.channel.includes('TELEGRAM') ? 'sheets-badge-blue' : 'sheets-badge-amber'}`}>
                      {log.channel}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-code)', color: '#059669', fontWeight: '700' }}>{log.latency}</td>
                  <td style={{ fontFamily: 'var(--font-code)' }}>{log.cost || '$0.0075'}</td>
                  <td><span style={{ color: '#059669', fontWeight: '700', fontSize: '11px' }}>{log.status}</span></td>
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

