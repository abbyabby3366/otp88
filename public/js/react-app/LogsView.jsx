import React, { useState, useMemo } from 'react';

// User OTP Logs Component (with Filters & Pagination)
function LogsView({ t, logs }) {
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchPlatform = platformFilter === 'ALL' || (log.channel && log.channel.toUpperCase().includes(platformFilter));
      const matchStatus = statusFilter === 'ALL' || (log.status && log.status.toUpperCase() === statusFilter);
      const matchSearch = !searchTerm || 
        (log.to && log.to.includes(searchTerm)) || 
        (log.id && log.id.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchPlatform && matchStatus && matchSearch;
    });
  }, [logs, platformFilter, statusFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const handlePlatformChange = (p) => {
    setPlatformFilter(p);
    setCurrentPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Filter Ribbon */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '6px 10px', gap: '8px', flexWrap: 'wrap' }}>
        
        {/* Platform Buttons */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginRight: '4px' }}>Channel:</span>
          {[
            { id: 'ALL', label: 'All Channels' },
            { id: 'WHATSAPP', label: 'WhatsApp' },
            { id: 'TELEGRAM', label: 'Telegram' },
            { id: 'SMS', label: 'SMS' },
            { id: 'VOICE', label: 'Voice' }
          ].map(p => (
            <button
              key={p.id}
              type="button"
              className={`sheets-btn ${platformFilter === p.id ? 'sheets-btn-primary' : ''}`}
              onClick={() => handlePlatformChange(p.id)}
              style={{ padding: '3px 8px', fontSize: '11px' }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Search & Status Filter */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="text"
            className="sheets-input sheets-input-code"
            placeholder="Search phone / ID..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ width: '180px', padding: '4px 6px', fontSize: '11px' }}
          />

          <select
            className="sheets-input"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '4px 6px', fontSize: '11px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Spreadsheet Data Grid */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '35px' }}>#</th>
              <th>{t.txId || 'Transaction ID'}</th>
              <th>{t.recipient || 'Phone Number'}</th>
              <th>{t.carrierRoute || 'Channel'}</th>
              <th>Latency</th>
              <th>{t.unitCost || 'Cost'}</th>
              <th>{t.status || 'Status'}</th>
              <th>{t.timestamp || 'Time'}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  No OTP logs match the selected filter criteria.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log, idx) => (
                <tr key={log.id || idx}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '10px' }}>
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '600' }}>{log.id}</td>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>{log.to}</td>
                  <td>
                    <span className={`sheets-badge ${
                      log.channel && log.channel.includes('WHATSAPP') ? 'sheets-badge-emerald' :
                      log.channel && log.channel.includes('TELEGRAM') ? 'sheets-badge-blue' :
                      log.channel && log.channel.includes('VOICE') ? 'sheets-badge-purple' : 'sheets-badge-amber'
                    }`}>
                      {log.channel}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-code)', color: '#059669', fontWeight: '700' }}>{log.latency}</td>
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

        {/* Compact Pagination Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '4px 10px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px' }}>
          <div style={{ color: 'var(--text-muted)' }}>
            Showing {filteredLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
          </div>
          
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="sheets-input"
              style={{ padding: '2px 4px', fontSize: '10px' }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>

            <button
              className="sheets-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{ padding: '2px 6px', fontSize: '10px' }}
            >
              ◀ Prev
            </button>
            <span style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              className="sheets-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{ padding: '2px 6px', fontSize: '10px' }}
            >
              Next ▶
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.LogsView = LogsView;
}

export default LogsView;
