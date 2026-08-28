import React, { useState, useMemo } from 'react';
import { TableLoader } from './TableLoader.jsx';

// Format date-time helper (YYYY-MM-DD HH:mm:ss)
function formatDateTime(val) {
  if (!val) return '-';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      return trimmed;
    }
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function WebhookLogsTable({
  logs = [],
  loading = false,
  copyToClipboard,
  showToast
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPayload, setSelectedPayload] = useState(null);

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, currentPage, pageSize]);

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '30px' }}>#</th>
              <th style={{ minWidth: '130px' }}>Tx / Message ID</th>
              <th>Event</th>
              <th>Channel</th>
              <th>Recipient</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>
                <span className="header-tooltip-wrapper">
                  Latency
                  <span className="header-tooltip-icon" title="HTTP execution and round-trip response duration to target webhook URL endpoint.">i</span>
                  <span className="header-tooltip-bubble">
                    HTTP execution and round-trip response duration to target webhook URL endpoint.
                  </span>
                </span>
              </th>
              <th>Target Endpoint</th>
              <th style={{ minWidth: '120px' }}>Time</th>
              <th style={{ width: '50px', textAlign: 'center' }}>JSON</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoader colSpan={11} message="Loading webhook delivery history..." />
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  No webhook deliveries recorded yet. Send an OTP or click "Test Webhook" to view real-time delivery receipts and retry telemetry here.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log, idx) => {
                const rowNum = (currentPage - 1) * pageSize + idx + 1;
                const msgId = log.msgId || log.payload?.msgId || '-';
                const channel = (log.channel || log.payload?.channel || 'whatsapp').toLowerCase();
                const recipient = log.payload?.phoneNumber || log.phoneNumber || '-';

                return (
                  <tr key={log.id || idx}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '10px' }}>
                      {rowNum}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-code)', fontSize: '10.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {msgId}
                        </span>
                        {msgId !== '-' && copyToClipboard && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msgId, 'Transaction ID')}
                            title="Copy Transaction ID"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              padding: '1px 3px',
                              color: 'var(--text-muted)',
                              fontSize: '10px'
                            }}
                          >
                            📋
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700', color: '#0284C7', whiteSpace: 'nowrap' }}>
                      {log.event}
                    </td>
                    <td>
                      <span className={`sheets-badge ${
                        channel.includes('whatsapp') ? 'sheets-badge-emerald' :
                        channel.includes('telegram') ? 'sheets-badge-blue' :
                        'sheets-badge-amber'
                      }`}>
                        {channel.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-code)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                      {recipient ? (recipient.startsWith('+') ? recipient : '+' + recipient.replace(/[^0-9]/g, '')) : '-'}
                    </td>
                    <td>
                      <span
                        className={`sheets-badge ${log.success ? 'sheets-badge-emerald' : 'sheets-badge-red'}`}
                        title={log.error || log.statusText || ''}
                      >
                        {log.httpStatus ? `HTTP ${log.httpStatus}` : (log.success ? '200 OK' : 'FAILED')}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: log.attempts > 1 ? '700' : 'normal', color: log.attempts > 1 ? '#D97706' : 'inherit' }}>
                        {log.attempts === 1 ? '1 / 1 (Instant)' : `${log.attempts} / 3 (Retried)`}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-code)', color: '#059669', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      {log.latencyMs ? `${log.latencyMs}ms` : '< 1s'}
                    </td>
                    <td
                      style={{
                        fontFamily: 'var(--font-code)',
                        fontSize: '10px',
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={log.targetUrl}
                    >
                      {log.targetUrl}
                    </td>
                    <td style={{ fontFamily: 'var(--font-code)', color: 'var(--text-muted)', fontSize: '10px', whiteSpace: 'nowrap' }}>
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="sheets-btn"
                        style={{ fontSize: '10px', padding: '1px 5px' }}
                        title="View payload payload JSON"
                        onClick={() => setSelectedPayload(log)}
                      >
                        {'{ }'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Compact Pagination Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '6px 12px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          Showing {logs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, logs.length)} of {logs.length} entries
        </div>
        
        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="sheets-input"
              style={{ padding: '2px 6px', fontSize: '11px', height: '24px' }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="sheets-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{ padding: '2px 8px', fontSize: '11px', height: '24px', whiteSpace: 'nowrap' }}
            >
              ◀ Prev
            </button>
            <span style={{ fontFamily: 'var(--font-code)', fontWeight: '700', whiteSpace: 'nowrap', display: 'inline-block', minWidth: '32px', textAlign: 'center' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="sheets-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{ padding: '2px 8px', fontSize: '11px', height: '24px', whiteSpace: 'nowrap' }}
            >
              Next ▶
            </button>
          </div>
        </div>
      </div>

      {/* JSON Payload Inspection Modal */}
      {selectedPayload && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => setSelectedPayload(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '6px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: '700', fontSize: '12px' }}>
                🔍 Webhook Payload Inspector - {selectedPayload.event}
              </div>
              <button
                type="button"
                className="sheets-btn"
                onClick={() => setSelectedPayload(null)}
                style={{ padding: '2px 6px', fontSize: '11px' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '12px 16px', overflowY: 'auto', background: '#0F172A', flex: 1 }}>
              <pre style={{ margin: 0, color: '#38BDF8', fontFamily: 'var(--font-code)', fontSize: '11px', lineHeight: 1.45 }}>
                {JSON.stringify(selectedPayload.payload || selectedPayload, null, 2)}
              </pre>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: '#F8FAFC' }}>
              {copyToClipboard && (
                <button
                  type="button"
                  className="sheets-btn sheets-btn-primary"
                  onClick={() => {
                    copyToClipboard(JSON.stringify(selectedPayload.payload || selectedPayload, null, 2), 'Webhook Payload JSON');
                    setSelectedPayload(null);
                  }}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  📋 Copy JSON
                </button>
              )}
              <button
                type="button"
                className="sheets-btn"
                onClick={() => setSelectedPayload(null)}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WebhookLogsTable;
