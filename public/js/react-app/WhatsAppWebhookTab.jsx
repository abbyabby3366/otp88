import React, { useState } from 'react';

export default function WhatsAppWebhookTab({
  config,
  setConfig,
  logs,
  jwtToken,
  showToast,
  savingConfig,
  handleSaveConfig,
  loadData
}) {
  const [simDlrStatus, setSimDlrStatus] = useState('DELIVERED');
  const [simDlrPhone, setSimDlrPhone] = useState('+60122273341');
  const [simDlrMsgId, setSimDlrMsgId] = useState('');
  const [simDlrErrorCode, setSimDlrErrorCode] = useState('0');
  const [simulatingDlr, setSimulatingDlr] = useState(false);
  const [simDlrResult, setSimDlrResult] = useState(null);

  const currentOriginWebhook = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/whatsapp/dlr`
    : 'https://api.otp88.com/api/webhooks/whatsapp/dlr';

  const handleSetCurrentOriginWebhook = async () => {
    const updated = { ...config, webhookUrl: currentOriginWebhook };
    setConfig(updated);
    if (jwtToken) {
      try {
        await fetch('/api/admin/whatsapp/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
          body: JSON.stringify(updated)
        });
        if (showToast) showToast(`✅ Webhook URL updated to: ${currentOriginWebhook}`);
      } catch (e) {}
    }
  };

  const handleSimulateDlr = async (e) => {
    if (e) e.preventDefault();
    setSimulatingDlr(true);
    try {
      const targetPhone = simDlrPhone.trim().replace(/[^0-9]/g, '') || (logs[0]?.recipient?.replace(/[^0-9]/g, '') || '60122273341');
      const targetMsgId = simDlrMsgId.trim() || (logs[0]?.id || 'VW-882049-MSG');
      const payload = {
        id: targetMsgId,
        msgid: targetMsgId,
        status: simDlrStatus,
        "error-code": parseInt(simDlrErrorCode) || 0,
        recipient: '+' + targetPhone,
        msisdn: targetPhone,
        channel: 'whatsapp',
        cost: parseFloat(config.ratePerOtp) || 0.0075,
        delivered_at: new Date().toISOString()
      };
      const res = await fetch('/api/webhooks/whatsapp/dlr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({ status: simDlrStatus }));
      setSimDlrResult({ payload, response: data });
      if (showToast) showToast(`✅ WhatsApp DLR Processed! Status for ${targetPhone} updated to ${simDlrStatus}`);
      loadData();
    } catch (err) {
      if (showToast) showToast('Failed to trigger test WhatsApp webhook callback', 'error');
    } finally {
      setSimulatingDlr(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Webhook Configuration Card */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ background: '#F8FAFC', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: '800' }}>🔔 DELIVERY NOTIFICATION & STATUS WEBHOOK (DLR ENDPOINT)</span>
          <span className="sheets-badge sheets-badge-emerald" style={{ fontSize: '9px', padding: '2px 6px' }}>● Live Endpoint</span>
        </div>
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
            VerifyWay & WhatsApp routers return the final handset delivery receipt (DLR/DN) in real-time to your webhook URL. When a receipt is received, OTP88 automatically updates the status of the corresponding message in MongoDB Atlas and the live logs.
          </p>

          <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>Your Webhook Callback URL:</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleSetCurrentOriginWebhook}
                  className="sheets-btn"
                  style={{ fontSize: '10px', padding: '2px 8px', background: '#ECFDF5', border: '1px solid #10B981', color: '#047857', fontWeight: '700' }}
                  title="Set callback URL using current domain host"
                >
                  ⚡ Auto-Set to Current Domain
                </button>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(config.webhookUrl || currentOriginWebhook); if (showToast) showToast('Copied Webhook URL!'); }}
                  className="sheets-btn"
                  style={{ fontSize: '10px', padding: '2px 8px' }}
                >
                  📋 Copy URL
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                  className="sheets-btn sheets-btn-primary"
                  style={{ fontSize: '10px', padding: '2px 10px', background: '#059669' }}
                >
                  {savingConfig ? 'Saving...' : '💾 Save URL'}
                </button>
              </div>
            </div>
            <input
              type="text"
              className="sheets-input sheets-input-code"
              value={config.webhookUrl}
              onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
              style={{ width: '100%', fontSize: '12px', fontWeight: '700', color: '#0284C7' }}
              placeholder={currentOriginWebhook}
            />
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              * Current active host endpoint: <code style={{ fontFamily: 'var(--font-code)', color: '#059669', fontWeight: '700' }}>{currentOriginWebhook}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive DLR Callback Tester & Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
          <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🧪 TEST & SIMULATE INCOMING WHATSAPP DLR WEBHOOK</span>
            <span className="sheets-badge sheets-badge-blue" style={{ fontSize: '9px' }}>Simulator</span>
          </div>
          <form onSubmit={handleSimulateDlr} style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Delivery Status (`status`)</label>
              <select className="sheets-input" value={simDlrStatus} onChange={(e) => setSimDlrStatus(e.target.value)} style={{ width: '100%', fontSize: '11px', fontWeight: '700' }}>
                <option value="DELIVERED">DELIVERED (Handset Acknowledged - Error Code 0)</option>
                <option value="READ">READ (Handset Opened - Blue Tick)</option>
                <option value="UNDELIVERED">UNDELIVERED (Handset Offline / Expired - Error Code 20)</option>
                <option value="FAILED">FAILED (Network Reject / Invalid Number - Error Code 1)</option>
                <option value="EXPIRED">EXPIRED (Validity Period Exceeded - Error Code 23)</option>
                <option value="SENT">SENT (Gateway Dispatched - Pending)</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Recipient MSISDN (`recipient`)</label>
                <input type="text" className="sheets-input sheets-input-code" value={simDlrPhone} onChange={(e) => setSimDlrPhone(e.target.value)} placeholder="+60122273341" style={{ width: '100%', fontSize: '11px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Router Error Code (`error-code`)</label>
                <input type="number" className="sheets-input sheets-input-code" value={simDlrErrorCode} onChange={(e) => setSimDlrErrorCode(e.target.value)} placeholder="0" style={{ width: '100%', fontSize: '11px' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)' }}>Target Message ID (`id`)</label>
                {logs.length > 0 && (
                  <button type="button" onClick={() => setSimDlrMsgId(logs[0].id)} className="sheets-btn" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    Use Latest: {logs[0].id.slice(0, 15)}...
                  </button>
                )}
              </div>
              <input type="text" className="sheets-input sheets-input-code" value={simDlrMsgId} onChange={(e) => setSimDlrMsgId(e.target.value)} placeholder={logs[0]?.id || 'VW-882049-MSG'} style={{ width: '100%', fontSize: '11px' }} />
            </div>
            <button type="submit" disabled={simulatingDlr} className="sheets-btn sheets-btn-primary" style={{ fontSize: '11px', padding: '7px 14px', marginTop: '4px', background: '#059669' }}>
              {simulatingDlr ? 'Simulating Webhook...' : '🚀 Trigger Simulated WhatsApp Callback'}
            </button>
          </form>
        </div>

        {/* Payload Specification Display */}
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
          <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700' }}>
            INCOMING WHATSAPP DLR JSON PAYLOAD & RESPONSE
          </div>
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ background: '#0F172A', color: '#38BDF8', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-code)', fontSize: '11px', overflowX: 'auto' }}>
              <pre style={{ margin: 0 }}>{JSON.stringify(simDlrResult?.payload || {
                id: simDlrMsgId || logs[0]?.id || 'VW-882049-MSG',
                status: simDlrStatus,
                "error-code": parseInt(simDlrErrorCode) || 0,
                recipient: simDlrPhone || '+60122273341',
                channel: 'whatsapp',
                cost: parseFloat(config.ratePerOtp) || 0.0075,
                delivered_at: new Date().toISOString()
              }, null, 2)}</pre>
            </div>
            {simDlrResult?.response && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>Server Webhook Response:</div>
                <div style={{ background: '#F8FAFC', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: '4px', fontFamily: 'var(--font-code)', fontSize: '10px', color: '#059669', fontWeight: '700' }}>
                  {JSON.stringify(simDlrResult.response)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
