import React, { useState, useEffect, useMemo } from 'react';
import SearchableSelect from './SearchableSelect.jsx';
import { TableLoader } from './TableLoader.jsx';

// Admin All-Users OTP Logs & Audit View
function AdminOtpLogsView({ t, jwtToken, showToast, usersList = [] }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const fetchAllLogs = () => {
    if (!jwtToken) return;
    setLoading(true);
    fetch('/api/logs', { headers: { 'Authorization': `Bearer ${jwtToken}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.logs) setLogs(data.logs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAllLogs();
  }, [jwtToken]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const channelUpper = (log.channel || '').toUpperCase();
      const matchPlatform = platformFilter === 'ALL' || 
        channelUpper.includes(platformFilter) ||
        (platformFilter === 'SMS' && (channelUpper.includes('SMS') || channelUpper.includes('BULK360') || channelUpper.includes('TELCO')));
      const matchStatus = statusFilter === 'ALL' || ((log.status || '').toUpperCase() === statusFilter);
      const matchUser = userFilter === 'ALL' || log.userId === userFilter || ((log.userName || '').toLowerCase().includes(userFilter.toLowerCase()));
      const matchSearch = !searchTerm || 
        (log.to && log.to.includes(searchTerm)) || 
        (log.id && log.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.userName && log.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.message && log.message.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchPlatform && matchStatus && matchUser && matchSearch;
    });
  }, [logs, platformFilter, statusFilter, userFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Filter Ribbon */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '6px 10px', gap: '8px', flexWrap: 'wrap' }}>
        
        {/* User and Channel Selectors */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>User:</span>
          <SearchableSelect
            options={usersList}
            value={userFilter}
            onChange={(val) => { setUserFilter(val); setCurrentPage(1); }}
            includeAllOption={true}
            allLabel="All Users"
            allValue="ALL"
            placeholder="All Users"
            searchPlaceholder="Search user name or email..."
            buttonStyle={{ minWidth: '140px', maxWidth: '180px' }}
            dropdownWidth="260px"
          />

          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginLeft: '4px' }}>Channel:</span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'WHATSAPP', label: 'WhatsApp' },
            { id: 'TELEGRAM', label: 'Telegram' },
            { id: 'SMS', label: 'SMS' },
            { id: 'VOICE', label: 'Voice' },
            { id: 'RCS', label: 'RCS' },
            { id: 'EMAIL', label: 'Email' }
          ].map(p => (
            <button
              key={p.id}
              type="button"
              className={`sheets-btn ${platformFilter === p.id ? 'sheets-btn-primary' : ''}`}
              onClick={() => { setPlatformFilter(p.id); setCurrentPage(1); }}
              style={{ padding: '2px 7px', fontSize: '11px', whiteSpace: 'nowrap' }}
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
            placeholder="Search phone, ID or user..."
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

          <button
            type="button"
            className="sheets-btn"
            onClick={fetchAllLogs}
            disabled={loading}
            style={{ padding: '3px 8px', fontSize: '11px' }}
            title="Refresh logs"
          >
            {loading ? '...' : '↻'}
          </button>
        </div>
      </div>

      {/* Spreadsheet Data Grid */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '35px' }}>#</th>
              <th>{t.txId || 'Transaction ID'}</th>
              <th>User</th>
              <th>{t.recipient || 'Recipient Phone'}</th>
              <th>{t.carrierRoute || 'Channel'}</th>
              <th>Message Content</th>
              <th>Latency</th>
              <th>{t.unitCost || 'Cost'}</th>
              <th>{t.status || 'Status'}</th>
              <th>{t.timestamp || 'Time'}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoader colSpan={10} message="Loading all users' OTP audit logs from MongoDB Atlas..." />
            ) : paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
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
                  <td>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      {log.userName || 'System / Direct API'}
                    </span>
                  </td>
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
                  <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-primary)' }} title={log.message || (log.otpCode ? `Your ${log.senderId || 'Alibaba'} verification code is ${log.otpCode}. Valid for 5 minutes.` : 'Authentication OTP Message')}>
                    {log.message || (log.otpCode ? `Your ${log.senderId || 'Alibaba'} verification code is ${log.otpCode}. Valid for 5 minutes.` : '-')}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '6px 12px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Showing {filteredLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} total entries
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
                <option value="15">15</option>
                <option value="30">30</option>
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

      </div>
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.AdminOtpLogsView = AdminOtpLogsView;
}

export default AdminOtpLogsView;
