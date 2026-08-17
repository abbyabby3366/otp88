import React, { useState, useEffect, useMemo } from 'react';

// Generate sample webhook payload object across all status events
function getWebhookSamplePayload({ channel = 'whatsapp', event = 'otp.delivered' }) {
  const costMap = { sms: '0.0210', telegram: '0.0035', whatsapp: '0.0500' };

  let status = 'DELIVERED';
  let errorCode = '0';
  let errorDescription = undefined;
  let latency = '0.8s';

  if (event === 'otp.delivered') {
    status = 'DELIVERED';
    errorCode = '0';
    latency = '0.8s';
  } else if (event === 'otp.read') {
    status = 'READ';
    errorCode = '0';
    latency = '1.4s';
  } else if (event === 'otp.undelivered') {
    status = 'UNDELIVERED';
    errorCode = '20';
    errorDescription = 'Subscriber handset is unreachable, offline, or out of cellular network coverage.';
    latency = '30.0s';
  } else if (event === 'otp.failed') {
    status = 'FAILED';
    errorCode = '1';
    errorDescription = 'Network rejection: destination mobile number is invalid, barred, or unreachable.';
    latency = '0.4s';
  } else if (event === 'otp.expired') {
    status = 'EXPIRED';
    errorCode = '23';
    errorDescription = 'OTP code validity period exceeded before recipient acknowledgment.';
    latency = '300.0s';
  } else if (event === 'otp.sent') {
    status = 'SENT';
    errorCode = '0';
    latency = '0.2s';
  }

  return {
    event,
    msgId: 'msg_live_8820a9bc4',
    channel,
    phoneNumber: '+60123456789',
    status,
    errorCode,
    remark: 'Login verification #1024',
    errorDescription,
    cost: costMap[channel] || '0.0500',
    currency: 'USD',
    latency,
    timestamp: new Date().toISOString()
  };
}

// Webhook listener code snippet generator
function getWebhookReceiverSnippet(lang = 'node') {
  if (lang === 'node') {
    return `// Node.js (Express) Webhook Listener
const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/webhooks/otp88', (req, res) => {
  const { event, msgId, channel, phoneNumber, status, errorCode, remark, cost } = req.body;
  
  console.log(\`Received [\${event}] for \${channel} to \${phoneNumber}: Status = \${status} (Remark: \${remark || 'N/A'})\`);

  if (status === 'DELIVERED') {
    // Handset received OTP successfully
  } else if (status === 'READ') {
    // Handset opened & read message (WhatsApp Blue Tick)
  } else if (status === 'UNDELIVERED' || status === 'FAILED' || status === 'EXPIRED') {
    // Delivery failed -> trigger multi-channel waterfall fallback
  }

  // Acknowledge receipt with HTTP 200 OK immediately
  res.status(200).json({ received: true });
});

app.listen(3000, () => console.log('Webhook server listening on port 3000'));`;
  }

  if (lang === 'python') {
    return `# Python (FastAPI) Webhook Listener
from fastapi import FastAPI, Request

app = FastAPI()

@app.post("/api/webhooks/otp88")
async def handle_otp88_webhook(request: Request):
    payload = await request.json()
    event = payload.get("event")
    channel = payload.get("channel")
    status = payload.get("status")
    remark = payload.get("remark")
    
    print(f"Received [{event}] on {channel}: status={status}, remark={remark}")
    
    # Return 200 OK
    return {"received": True}`;
  }

  if (lang === 'php') {
    return `<?php
// PHP Webhook Listener
$rawBody = file_get_contents('php://input');
$event = json_decode($rawBody, true);

if ($event) {
    $channel = $event['channel'] ?? 'unknown';
    $status = $event['status'] ?? 'unknown';
    $remark = $event['remark'] ?? '';
    error_log("OTP88 Webhook: channel={$channel}, status={$status}, remark={$remark}");
}

// Acknowledge receipt with HTTP 200
http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['received' => true]);
?>`;
  }

  return '';
}

// Dedicated Webhooks View Component
function WebhooksView({ t, session, setSession, jwtToken, copyToClipboard, showToast }) {
  const [webhookUrlInput, setWebhookUrlInput] = useState(session?.webhookUrl || '');
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookSampleChannel, setWebhookSampleChannel] = useState('whatsapp');
  const [webhookSampleEvent, setWebhookSampleEvent] = useState('otp.delivered');
  const [webhookReceiverLang, setWebhookReceiverLang] = useState('node');

  const [webhookLogs, setWebhookLogs] = useState([]);
  const [loadingWebhookLogs, setLoadingWebhookLogs] = useState(false);
  const [isWebhookLogsOpen, setIsWebhookLogsOpen] = useState(true);
  const [isWebhookSampleOpen, setIsWebhookSampleOpen] = useState(true);

  const fetchWebhookLogs = async () => {
    if (!jwtToken) return;
    setLoadingWebhookLogs(true);
    try {
      const res = await fetch('/api/user/webhook/logs', {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (data.success && data.logs) {
        setWebhookLogs(data.logs);
      }
    } catch (e) {
    } finally {
      setLoadingWebhookLogs(false);
    }
  };

  useEffect(() => {
    if (jwtToken) {
      fetchWebhookLogs();
    }
  }, [jwtToken]);

  useEffect(() => {
    if (session?.webhookUrl !== undefined && session.webhookUrl !== null) {
      setWebhookUrlInput(session.webhookUrl);
    }
  }, [session?.webhookUrl]);

  // Channel-specific available events
  const availableEvents = useMemo(() => {
    if (webhookSampleChannel === 'whatsapp') {
      return [
        { id: 'otp.delivered', label: 'otp.delivered (Delivered - Handset ACK)' },
        { id: 'otp.read', label: 'otp.read (Read - Blue Tick)' },
        { id: 'otp.undelivered', label: 'otp.undelivered (Offline / Unreachable)' },
        { id: 'otp.failed', label: 'otp.failed (Network Reject)' },
        { id: 'otp.expired', label: 'otp.expired (Timeout Exceeded)' },
        { id: 'otp.sent', label: 'otp.sent (Dispatched)' }
      ];
    }
    if (webhookSampleChannel === 'sms') {
      return [
        { id: 'otp.delivered', label: 'otp.delivered (Delivered - Telco ACK)' },
        { id: 'otp.undelivered', label: 'otp.undelivered (No Cellular Coverage)' },
        { id: 'otp.failed', label: 'otp.failed (Invalid Number / Barred)' },
        { id: 'otp.expired', label: 'otp.expired (Expired in SMSC Queue)' },
        { id: 'otp.sent', label: 'otp.sent (Enroute / Dispatched)' }
      ];
    }
    return [
      { id: 'otp.delivered', label: 'otp.delivered (Delivered)' },
      { id: 'otp.read', label: 'otp.read (Read in Chat)' },
      { id: 'otp.failed', label: 'otp.failed (Bot Blocked / Invalid User)' },
      { id: 'otp.expired', label: 'otp.expired (Verification Timeout)' },
      { id: 'otp.sent', label: 'otp.sent (Sent)' }
    ];
  }, [webhookSampleChannel]);

  useEffect(() => {
    if (!availableEvents.some(ev => ev.id === webhookSampleEvent)) {
      setWebhookSampleEvent('otp.delivered');
    }
  }, [availableEvents, webhookSampleEvent]);

  const sampleWebhookJson = useMemo(() => {
    return JSON.stringify(
      getWebhookSamplePayload({ channel: webhookSampleChannel, event: webhookSampleEvent }),
      null,
      2
    );
  }, [webhookSampleChannel, webhookSampleEvent]);

  const activeReceiverSnippet = useMemo(() => {
    return getWebhookReceiverSnippet(webhookReceiverLang);
  }, [webhookReceiverLang]);

  // Handle Save Webhook URL
  const handleSaveWebhook = async () => {
    const cleanUrl = webhookUrlInput.trim();
    if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      if (showToast) showToast('Webhook URL must start with http:// or https://', 'error');
      return;
    }

    setIsSavingWebhook(true);
    try {
      const res = await fetch('/api/user/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': jwtToken ? `Bearer ${jwtToken}` : ''
        },
        body: JSON.stringify({ webhookUrl: cleanUrl })
      });
      const data = await res.json();
      if (data.success) {
        if (setSession) {
          setSession(prev => {
            const next = { ...prev, webhookUrl: cleanUrl };
            localStorage.setItem('otp88_session', JSON.stringify(next));
            return next;
          });
        }
        if (showToast) showToast('Webhook URL saved successfully!');
      } else {
        if (showToast) showToast(data.error || 'Failed to update Webhook URL', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error saving Webhook URL', 'error');
    } finally {
      setIsSavingWebhook(false);
    }
  };

  // Handle Test Ping Webhook
  const handleTestWebhook = async () => {
    const targetUrl = webhookUrlInput.trim() || session?.webhookUrl;
    if (!targetUrl) {
      if (showToast) showToast('Please enter and save a Webhook URL first.', 'error');
      return;
    }

    setIsTestingWebhook(true);
    try {
      const res = await fetch('/api/user/webhook/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': jwtToken ? `Bearer ${jwtToken}` : ''
        },
        body: JSON.stringify({
          webhookUrl: targetUrl,
          channel: webhookSampleChannel,
          event: webhookSampleEvent
        })
      });
      const data = await res.json();
      if (data.success) {
        if (showToast) showToast(data.message || 'Test webhook delivered successfully!');
      } else {
        if (showToast) showToast(data.error || 'Could not reach test webhook', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Error sending test webhook ping', 'error');
    } finally {
      setIsTestingWebhook(false);
      fetchWebhookLogs();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 1. Webhook URL Configuration Card */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '12px', background: '#FFFFFF' }}>
        <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🔗 Webhook URL Endpoint</span>
          <span className="sheets-badge sheets-badge-emerald" style={{ fontSize: '9px', padding: '1px 5px' }}>
            ● Real-time DLR Callbacks
          </span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          {t.webhookUrlDesc || 'Configure your HTTPS endpoint to receive real-time delivery receipts (DLR) and message status event callbacks.'}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            className="sheets-input sheets-input-code"
            placeholder="https://your-api.com/api/webhooks/otp88"
            value={webhookUrlInput}
            onChange={(e) => setWebhookUrlInput(e.target.value)}
            style={{ fontWeight: '600', color: '#0284C7' }}
          />
          <button
            type="button"
            className="sheets-btn"
            onClick={handleTestWebhook}
            disabled={isTestingWebhook || !webhookUrlInput.trim()}
            style={{ minWidth: '95px' }}
          >
            {isTestingWebhook ? 'Testing...' : 'Test Webhook'}
          </button>
          <button
            type="button"
            className="sheets-btn sheets-btn-primary"
            onClick={handleSaveWebhook}
            disabled={isSavingWebhook}
            style={{ minWidth: '105px' }}
          >
            {isSavingWebhook ? 'Saving...' : (t.saveWebhook || 'Save Webhook')}
          </button>
        </div>
      </div>

      {/* 2. Webhook Delivery History & Retry Logs Card (Collapsible) */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div
          onClick={() => setIsWebhookLogsOpen(!isWebhookLogsOpen)}
          style={{
            background: '#F8FAFC',
            padding: '8px 12px',
            borderBottom: isWebhookLogsOpen ? '1px solid var(--border-subtle)' : 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', transition: 'transform 0.2s ease', transform: isWebhookLogsOpen ? 'rotate(90deg)' : 'rotate(0deg)', fontSize: '10px' }}>
              ▶
            </span>
            <span>Webhook Delivery History & Retry Telemetry</span>
            <span className="sheets-badge sheets-badge-emerald" style={{ fontSize: '9px', padding: '1px 5px' }}>
              {webhookLogs.length} events
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="sheets-btn"
              disabled={loadingWebhookLogs}
              onClick={fetchWebhookLogs}
              style={{ fontSize: '10px', padding: '2px 8px' }}
            >
              {loadingWebhookLogs ? 'Refreshing...' : '🔄 Refresh Logs'}
            </button>
            <button
              type="button"
              className="sheets-btn"
              onClick={() => setIsWebhookLogsOpen(!isWebhookLogsOpen)}
              style={{ fontSize: '10px', padding: '2px 8px' }}
            >
              {isWebhookLogsOpen ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        {isWebhookLogsOpen && (
          <div style={{ overflowX: 'auto' }}>
            <table className="sheets-table">
              <thead>
                <tr>
                  <th style={{ width: '30px' }}>#</th>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Latency</th>
                  <th>Target Endpoint</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {loadingWebhookLogs ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                      Loading webhook delivery history...
                    </td>
                  </tr>
                ) : webhookLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                      No webhook deliveries recorded yet. Send an OTP or click "Test Webhook" to view real-time delivery receipts and retry telemetry here.
                    </td>
                  </tr>
                ) : (
                  webhookLogs.map((log, idx) => (
                    <tr key={log.id || idx}>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '10px' }}>
                        {idx + 1}
                      </td>
                      <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700', color: '#0284C7' }}>
                        {log.event}
                      </td>
                      <td>
                        <span className={`sheets-badge ${log.success ? 'sheets-badge-emerald' : 'sheets-badge-red'}`}>
                          {log.httpStatus ? `HTTP ${log.httpStatus}` : (log.success ? '200 OK' : 'FAILED')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: log.attempts > 1 ? '700' : 'normal', color: log.attempts > 1 ? '#D97706' : 'inherit' }}>
                          {log.attempts === 1 ? '1 / 1 (Instant)' : `${log.attempts} / 3 (Retried)`}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-code)', color: '#059669', fontWeight: '700' }}>
                        {log.latencyMs ? `${log.latencyMs}ms` : '< 1s'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-code)', fontSize: '10px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.targetUrl}>
                        {log.targetUrl}
                      </td>
                      <td style={{ fontFamily: 'var(--font-code)', color: 'var(--text-muted)', fontSize: '10px', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Sample Webhook Payload & Event Schema Card (Collapsible) */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div
          onClick={() => setIsWebhookSampleOpen(!isWebhookSampleOpen)}
          style={{
            background: '#F8FAFC',
            padding: '8px 12px',
            borderBottom: isWebhookSampleOpen ? '1px solid var(--border-subtle)' : 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', transition: 'transform 0.2s ease', transform: isWebhookSampleOpen ? 'rotate(90deg)' : 'rotate(0deg)', fontSize: '10px' }}>
              ▶
            </span>
            <span>Sample Webhook Payload & Events</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
              (POST body sent to your Webhook URL)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="sheets-btn"
              onClick={() => copyToClipboard(sampleWebhookJson, 'Sample Webhook Payload JSON')}
              style={{ fontSize: '10px', padding: '2px 8px', fontWeight: '700' }}
            >
              Copy JSON
            </button>
            <button
              type="button"
              className="sheets-btn"
              onClick={() => setIsWebhookSampleOpen(!isWebhookSampleOpen)}
              style={{ fontSize: '10px', padding: '2px 8px' }}
            >
              {isWebhookSampleOpen ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isWebhookSampleOpen && (
          <>
            {/* Filters for Sample Payload */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px', background: '#FAFAFA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', width: '55px' }}>Channel:</span>
                {[
                  { id: 'whatsapp', label: 'WhatsApp' },
                  { id: 'sms', label: 'SMS' },
                  { id: 'telegram', label: 'Telegram' }
                ].map(ch => (
                  <button
                    key={ch.id}
                    type="button"
                    className={`sheets-btn ${webhookSampleChannel === ch.id ? 'sheets-btn-primary' : ''}`}
                    onClick={() => setWebhookSampleChannel(ch.id)}
                    style={{ fontSize: '10px', padding: '2px 8px' }}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Status / Event Buttons based on Channel */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', width: '55px' }}>Event:</span>
                {availableEvents.map(ev => (
                  <button
                    key={ev.id}
                    type="button"
                    className={`sheets-btn ${webhookSampleEvent === ev.id ? 'sheets-btn-primary' : ''}`}
                    onClick={() => setWebhookSampleEvent(ev.id)}
                    style={{ fontSize: '10px', padding: '2px 8px' }}
                  >
                    {ev.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', width: '55px' }}>Receiver:</span>
                {[
                  { id: 'node', label: 'Node.js (Express)' },
                  { id: 'python', label: 'Python (FastAPI)' },
                  { id: 'php', label: 'PHP' }
                ].map(lang => (
                  <button
                    key={lang.id}
                    type="button"
                    className={`sheets-btn ${webhookReceiverLang === lang.id ? 'sheets-btn-primary' : ''}`}
                    onClick={() => setWebhookReceiverLang(lang.id)}
                    style={{ fontSize: '10px', padding: '2px 8px' }}
                  >
                    {lang.label}
                  </button>
                ))}
                <div style={{ marginLeft: 'auto' }}>
                  <button
                    type="button"
                    className="sheets-btn"
                    onClick={() => copyToClipboard(activeReceiverSnippet, `${webhookReceiverLang.toUpperCase()} webhook listener snippet`)}
                    style={{ fontSize: '10px', padding: '2px 8px' }}
                  >
                    Copy Handler Code
                  </button>
                </div>
              </div>
            </div>

            {/* Code Views Side-by-Side on Desktop */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', background: '#0F172A' }}>
              {/* Left: JSON Payload */}
              <div style={{ padding: '12px', borderRight: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  // Webhook JSON Payload
                </div>
                <pre style={{ margin: 0, color: '#38BDF8', fontFamily: 'var(--font-code)', fontSize: '11px', lineHeight: 1.45, overflowX: 'auto' }}>
                  {sampleWebhookJson}
                </pre>
              </div>

              {/* Right: Handler Implementation */}
              <div style={{ padding: '12px' }}>
                <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  // Backend Webhook Handler ({webhookReceiverLang.toUpperCase()})
                </div>
                <pre style={{ margin: 0, color: '#A7F3D0', fontFamily: 'var(--font-code)', fontSize: '11px', lineHeight: 1.45, overflowX: 'auto' }}>
                  {activeReceiverSnippet}
                </pre>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.WebhooksView = WebhooksView;
}

export default WebhooksView;
