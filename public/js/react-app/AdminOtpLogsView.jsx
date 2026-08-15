import React, { useState, useEffect } from 'react';

// Admin OTP Usage & Audit Logs Component
function AdminOtpLogsView({ t, jwtToken, showToast }) {
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (jwtToken) {
      fetch('/api/admin/otp-audit-logs', { headers: { 'Authorization': `Bearer ${jwtToken}` } })
        .then(res => res.json())
        .then(data => { if (data.success && data.logs) setAuditLogs(data.logs); })
        .catch(() => {});
    }
  }, [jwtToken]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px' }}>
          <span style={{ fontWeight: '700' }}>ADMIN & SYSTEM OTP AUDIT TELEMETRY (REAL USAGE TRACKING)</span>
          <span style={{ color: 'var(--text-muted)' }}>MFA, Password Resets & Auth Dispatches</span>
        </div>
        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '35px' }}>#</th>
              <th>Audit ID</th>
              <th>Target MSISDN</th>
              <th>Channel</th>
              <th>Audit Event / Action</th>
              <th>Actor / Trigger</th>
              <th>Latency</th>
              <th>Status</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                  No system audit events recorded in MongoDB yet.
                </td>
              </tr>
            ) : (
              auditLogs.map((log, idx) => (
                <tr key={log.id || idx}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '10px' }}>{idx + 1}</td>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>{log.id}</td>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>{log.target}</td>
                  <td>
                    <span className={`sheets-badge ${
                      log.channel === 'WHATSAPP' ? 'sheets-badge-emerald' :
                      log.channel === 'TELEGRAM' ? 'sheets-badge-blue' :
                      log.channel === 'VOICE_OTP' ? 'sheets-badge-purple' : 'sheets-badge-amber'
                    }`}>
                      {log.channel}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-code)', fontSize: '11px', fontWeight: '700', color: '#1E293B' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{log.actor}</td>
                  <td style={{ fontFamily: 'var(--font-code)', color: '#059669' }}>{log.latency}</td>
                  <td><span className="sheets-badge sheets-badge-emerald">{log.status}</span></td>
                  <td style={{ fontFamily: 'var(--font-code)', color: 'var(--text-muted)' }}>{log.time}</td>
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
  window.AdminOtpLogsView = AdminOtpLogsView;
}

export default AdminOtpLogsView;

