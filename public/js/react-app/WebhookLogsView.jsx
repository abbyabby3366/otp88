import React, { useState, useEffect, useMemo } from 'react';
import WebhookLogsTable from './WebhookLogsTable.jsx';
import { apiFetch } from './api.js';

export default function WebhookLogsView({
  t = {},
  jwtToken,
  session,
  copyToClipboard,
  showToast,
  onBack,
  setActiveTab
}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    if (!jwtToken) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/user/webhook/logs', {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching webhook logs:', err);
      if (showToast) showToast('Failed to load webhook logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [jwtToken]);

  // Compute KPI metrics
  const stats = useMemo(() => {
    const total = logs.length;
    const successful = logs.filter(l => (l.httpStatus >= 200 && l.httpStatus < 300) || l.status === 'DELIVERED').length;
    const failed = total - successful;
    const avgLatencyMs = total > 0
      ? Math.round(logs.reduce((acc, l) => acc + (l.latencyMs || 0), 0) / total)
      : 0;

    return { total, successful, failed, avgLatencyMs };
  }, [logs]);

  // Filter logs based on user selection
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Channel filter
      if (channelFilter !== 'ALL') {
        const ch = (log.channel || '').toUpperCase();
        if (channelFilter === 'WHATSAPP' && !ch.includes('WHATSAPP')) return false;
        if (channelFilter === 'SMS' && !ch.includes('SMS')) return false;
        if (channelFilter === 'TELEGRAM' && !ch.includes('TELEGRAM')) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const is2xx = (log.httpStatus >= 200 && log.httpStatus < 300) || log.status === 'DELIVERED';
        if (statusFilter === 'SUCCESS' && !is2xx) return false;
        if (statusFilter === 'FAILED' && is2xx) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const msgId = (log.msgId || '').toLowerCase();
        const phone = (log.phoneNumber || '').toLowerCase();
        const event = (log.event || '').toLowerCase();
        const targetUrl = (log.targetUrl || '').toLowerCase();
        if (!msgId.includes(q) && !phone.includes(q) && !event.includes(q) && !targetUrl.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [logs, channelFilter, statusFilter, searchQuery]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (setActiveTab) {
      setActiveTab(session?.role === 'ADMIN' ? 'admin-webhooks' : 'webhooks');
    }
  };

  return (
    <div className="sheets-tab-content">
      {/* Top Header with Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="sheets-btn"
            onClick={handleBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600', padding: '6px 12px', background: 'var(--bg-card)' }}
          >
            <span>←</span>
            <span>{t.backToWebhooks || 'Back to Webhooks'}</span>
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Webhook Delivery Logs</span>
              <span className="sheets-badge sheets-badge-emerald" style={{ fontSize: '10px' }}>
                {logs.length} Total Events
              </span>
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Real-time HTTP delivery audit trail, upstream carrier acknowledgments, latency metrics, and payload inspector
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="sheets-btn sheets-btn-primary"
            onClick={fetchLogs}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }}
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            <span>{loading ? 'Refreshing...' : 'Refresh Logs'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip - matching Billing page UI */}
      <div className="sheets-kpi-grid" style={{ marginBottom: '10px' }}>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">TOTAL DISPATCHES</div>
          <div className="sheets-kpi-value">{stats.total}</div>
          <div className="sheets-kpi-sub" style={{ color: 'var(--text-muted)' }}>All-time webhook attempts</div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">DELIVERED (HTTP 2XX)</div>
          <div className="sheets-kpi-value" style={{ color: '#059669' }}>{stats.successful}</div>
          <div className="sheets-kpi-sub">
            {stats.total > 0 ? `${((stats.successful / stats.total) * 100).toFixed(1)}% success rate` : '100%'}
          </div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">FAILED / RETRIED</div>
          <div className="sheets-kpi-value" style={{ color: stats.failed > 0 ? '#DC2626' : 'var(--text-muted)' }}>
            {stats.failed}
          </div>
          <div className="sheets-kpi-sub" style={{ color: stats.failed > 0 ? '#DC2626' : 'var(--text-muted)' }}>
            Non-2xx or network errors
          </div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">AVG RESPONSE LATENCY</div>
          <div className="sheets-kpi-value" style={{ color: '#0284C7' }}>
            {stats.avgLatencyMs ? `${stats.avgLatencyMs}ms` : '< 1s'}
          </div>
          <div className="sheets-kpi-sub" style={{ color: 'var(--text-muted)' }}>Round-trip HTTP execution</div>
        </div>
      </div>

      {/* Filter Ribbon - Single Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '6px 10px', gap: '8px', marginBottom: '10px' }}>
        {/* Channel Filter Pills on Left */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginRight: '4px' }}>Channel:</span>
          {[
            { id: 'ALL', label: 'All Channels' },
            { id: 'WHATSAPP', label: 'WhatsApp' },
            { id: 'SMS', label: 'SMS' },
            { id: 'TELEGRAM', label: 'Telegram' }
          ].map(ch => (
            <button
              key={ch.id}
              type="button"
              className={`sheets-btn ${channelFilter === ch.id ? 'sheets-btn-primary' : ''}`}
              onClick={() => setChannelFilter(ch.id)}
              style={{ fontSize: '11px', padding: '2px 8px', whiteSpace: 'nowrap' }}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {/* Search & Status Filter on Right */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="text"
            className="sheets-input sheets-input-code"
            placeholder="Search Msg ID, Phone, URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '200px', padding: '4px 6px', fontSize: '11px' }}
          />

          <select
            className="sheets-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '4px 6px', fontSize: '11px', width: 'auto' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">HTTP 200 (Success)</option>
            <option value="FAILED">HTTP 4xx/5xx (Failed)</option>
          </select>
        </div>
      </div>

      {/* Webhook Logs Table Card */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-card)' }}>
        <WebhookLogsTable
          logs={filteredLogs}
          loading={loading}
          copyToClipboard={copyToClipboard}
          showToast={showToast}
        />
      </div>
    </div>
  );
}

