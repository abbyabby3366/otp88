import React, { useState, useEffect, useMemo } from 'react';

// Format date-time helper (YYYY-MM-DD HH:mm:ss)
function formatDateTime(val) {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const EVENT_CONFIGS = {
  'otp.delivered': { status: 'DELIVERED', errorCode: '0', latency: '0.8s' },
  'otp.read': { status: 'READ', errorCode: '0', latency: '1.4s' },
  'otp.undelivered': { status: 'UNDELIVERED', errorCode: '20', latency: '30.0s', errorDescription: 'Subscriber handset is unreachable, offline, or out of cellular network coverage.' },
  'otp.failed': { status: 'FAILED', errorCode: '1', latency: '0.4s', errorDescription: 'Network rejection: destination mobile number is invalid, barred, or unreachable.' },
  'otp.expired': { status: 'EXPIRED', errorCode: '23', latency: '300.0s', errorDescription: 'OTP code validity period exceeded before recipient acknowledgment.' },
  'otp.sent': { status: 'SENT', errorCode: '0', latency: '0.2s' }
};

// Generate sample webhook payload object across all status events
function getWebhookSamplePayload({ channel = 'whatsapp', event = 'otp.delivered' }) {
  const costMap = { sms: '0.0210', telegram: '0.0035', whatsapp: '0.0500' };
  const cfg = EVENT_CONFIGS[event] || EVENT_CONFIGS['otp.delivered'];

  return {
    event,
    msgId: 'msg_live_8820a9bc4',
    channel,
    phoneNumber: '+60123456789',
    status: cfg.status,
    errorCode: cfg.errorCode,
    remark: 'Login verification #1024',
    errorDescription: cfg.errorDescription,
    cost: costMap[channel] || '0.0500',
    currency: 'USD',
    latency: cfg.latency,
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
function WebhooksView({ t, session, setSession, jwtToken, copyToClipboard, showToast, setActiveTab, onNavigateToLogs }) {
  const [webhookUrlInput, setWebhookUrlInput] = useState(session?.webhookUrl || '');
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookSampleChannel, setWebhookSampleChannel] = useState('whatsapp');
  const [webhookSampleEvent, setWebhookSampleEvent] = useState('otp.delivered');
  const [webhookReceiverLang, setWebhookReceiverLang] = useState('node');

  const [webhookLogs, setWebhookLogs] = useState([]);
  const [loadingWebhookLogs, setLoadingWebhookLogs] = useState(false);
  const [isWebhookSampleOpen, setIsWebhookSampleOpen] = useState(true);

  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedHandler, setCopiedHandler] = useState(false);

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
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '14px', background: '#FFFFFF' }}>
        <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
          <span>Webhook URL Endpoint</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          {t.webhookUrlDesc || 'Configure your HTTPS endpoint to receive real-time delivery receipts (DLR) and message status event callbacks.'}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="sheets-input sheets-input-code"
            placeholder="https://your-api.com/api/webhooks/otp88"
            value={webhookUrlInput}
            onChange={(e) => setWebhookUrlInput(e.target.value)}
            style={{ fontWeight: '600', color: '#0284C7', flex: '1 1 300px' }}
          />
          <button
            type="button"
            className="sheets-btn"
            onClick={handleTestWebhook}
            disabled={isTestingWebhook || !webhookUrlInput.trim()}
            style={{ minWidth: '100px' }}
          >
            {isTestingWebhook ? 'Testing...' : 'Test Webhook'}
          </button>
          <button
            type="button"
            className="sheets-btn sheets-btn-primary"
            onClick={handleSaveWebhook}
            disabled={isSavingWebhook}
            style={{ minWidth: '110px' }}
          >
            {isSavingWebhook ? 'Saving...' : (t.saveWebhook || 'Save Webhook')}
          </button>
        </div>
      </div>

      {/* 2. Webhook Delivery Logs Navigation Action Card */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '12px 14px', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span>Webhook Delivery History & Retry Telemetry</span>
            <span className="sheets-badge sheets-badge-emerald" style={{ fontSize: '9px', padding: '1px 6px' }}>
              {webhookLogs.length} events
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Inspect full execution audit history, HTTP responses, retry telemetry, latency metrics, and JSON payloads.
          </div>
        </div>

        <div>
          <button
            type="button"
            className="sheets-btn sheets-btn-primary"
            onClick={() => {
              if (onNavigateToLogs) {
                onNavigateToLogs();
              } else if (setActiveTab) {
                setActiveTab('webhook-logs');
              }
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700', padding: '6px 14px' }}
          >
            <span>View Webhook Logs</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* 3. Sample Webhook Payload & Event Schema Card (Collapsible) */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div
          onClick={() => setIsWebhookSampleOpen(!isWebhookSampleOpen)}
          style={{
            background: '#F8FAFC',
            padding: '10px 14px',
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
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', transition: 'transform 0.2s ease', transform: isWebhookSampleOpen ? 'rotate(90deg)' : 'rotate(0deg)', fontSize: '10px' }}>
              ▶
            </span>
            <span>Sample Webhook Payload & Events</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
              (POST body sent to your Webhook URL)
            </span>
          </div>
        </div>

        {/* Collapsible Content */}
        {isWebhookSampleOpen && (
          <>
            {/* Filters / Control Bar for Sample Payload & Receiver */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: '#F8FAFC', alignItems: 'center' }}>
              {/* Channel Selector */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Channel:
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
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
                      style={{ fontSize: '11px', padding: '3px 8px', flex: 1 }}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Selector (Clean Dropdown) */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Event Type:
                </div>
                <select
                  className="sheets-input"
                  value={webhookSampleEvent}
                  onChange={(e) => setWebhookSampleEvent(e.target.value)}
                  style={{ fontSize: '11px', padding: '4px 8px', width: '100%', fontWeight: '600', color: 'var(--text-primary)' }}
                >
                  {availableEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Receiver Language Selector */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Listener Language:
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { id: 'node', label: 'Node.js' },
                    { id: 'python', label: 'Python' },
                    { id: 'php', label: 'PHP' }
                  ].map(lang => (
                    <button
                      key={lang.id}
                      type="button"
                      className={`sheets-btn ${webhookReceiverLang === lang.id ? 'sheets-btn-primary' : ''}`}
                      onClick={() => setWebhookReceiverLang(lang.id)}
                      style={{ fontSize: '11px', padding: '3px 8px', flex: 1 }}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Code Views Side-by-Side on Desktop */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', background: '#0F172A' }}>
              {/* Left: JSON Payload */}
              <div style={{ padding: '12px', borderRight: '1px solid #1E293B', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    // Webhook JSON Payload
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (copyToClipboard) {
                        copyToClipboard(sampleWebhookJson, 'Sample Webhook Payload JSON');
                      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(sampleWebhookJson);
                      }
                      setCopiedJson(true);
                      setTimeout(() => setCopiedJson(false), 2000);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: copiedJson ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      border: `1px solid ${copiedJson ? '#10B981' : 'rgba(255, 255, 255, 0.15)'}`,
                      color: copiedJson ? '#10B981' : '#F1F5F9',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {copiedJson ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre style={{ margin: 0, color: '#38BDF8', fontFamily: 'var(--font-code)', fontSize: '11px', lineHeight: 1.45, overflowX: 'auto', flexGrow: 1 }}>
                  {sampleWebhookJson}
                </pre>
              </div>

              {/* Right: Handler Implementation */}
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    // Backend Webhook Handler ({webhookReceiverLang.toUpperCase()})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (copyToClipboard) {
                        copyToClipboard(activeReceiverSnippet, `${webhookReceiverLang.toUpperCase()} webhook listener snippet`);
                      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(activeReceiverSnippet);
                      }
                      setCopiedHandler(true);
                      setTimeout(() => setCopiedHandler(false), 2000);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: copiedHandler ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      border: `1px solid ${copiedHandler ? '#10B981' : 'rgba(255, 255, 255, 0.15)'}`,
                      color: copiedHandler ? '#10B981' : '#F1F5F9',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {copiedHandler ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre style={{ margin: 0, color: '#A7F3D0', fontFamily: 'var(--font-code)', fontSize: '11px', lineHeight: 1.45, overflowX: 'auto', flexGrow: 1 }}>
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
