// User Billing & Top-up Spreadsheet View
function BillingView({ t, session, setSession, jwtToken, showToast }) {
  const [topupAmount, setTopupAmount] = React.useState(100);
  const [invoices, setInvoices] = React.useState([]);

  React.useEffect(() => {
    if (jwtToken) {
      fetch('/api/billing/invoices', {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.invoices) setInvoices(data.invoices);
        })
        .catch(() => {});
    }
  }, [jwtToken]);

  const handleSimulateTopup = async (method) => {
    if (!jwtToken) return;
    try {
      const res = await fetch('/api/billing/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ amount: topupAmount, method })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        if (data.invoice) setInvoices(prev => [data.invoice, ...prev]);
        if (data.newBalance !== undefined && setSession) {
          setSession(prev => {
            const updated = { ...prev, balanceUsd: data.newBalance };
            localStorage.setItem('otp88_session', JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch (e) {
      showToast('Top-up error', 'error');
    }
  };

  return (
    <div>
      {/* KPI Balance Strip */}
      <div className="sheets-kpi-grid" style={{ marginBottom: '12px' }}>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">{t.currentBalance}</div>
          <div className="sheets-kpi-value" style={{ color: '#059669', fontSize: '22px' }}>
            ${(session.balanceUsd || 50).toFixed(2)}
          </div>
          <div className="sheets-kpi-sub">{t.autoReload}</div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">Estimated Remaining OTPs</div>
          <div className="sheets-kpi-value" style={{ color: '#0284C7' }}>
            ~{Math.floor(((session.balanceUsd || 50) / 0.0075)).toLocaleString()} OTPs
          </div>
          <div className="sheets-kpi-sub">Based on WhatsApp $0.0075/msg</div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">Current Billing Tier</div>
          <div className="sheets-kpi-value" style={{ color: '#7C3AED' }}>Tier 1: Growth</div>
          <div className="sheets-kpi-sub">Pay-As-You-Go Standard</div>
        </div>
      </div>

      {/* Top-up Selection Box */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '12px', marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
          {t.topUpCredits}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
          {[50, 100, 250, 500, 1000].map((amt) => (
            <button
              key={amt}
              type="button"
              className={`sheets-btn ${topupAmount === amt ? 'sheets-btn-primary' : ''}`}
              onClick={() => setTopupAmount(amt)}
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              + ${amt} USD
            </button>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Custom: $</span>
            <input
              type="number"
              className="sheets-input sheets-input-code"
              style={{ width: '80px', padding: '5px' }}
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="sheets-btn sheets-btn-primary" style={{ padding: '6px 14px' }} onClick={() => handleSimulateTopup('Stripe')}>
            {t.payWithCard}
          </button>
          <button className="sheets-btn" style={{ padding: '6px 14px' }} onClick={() => handleSimulateTopup('USDT Crypto')}>
            {t.payWithCrypto}
          </button>
        </div>
      </div>

      {/* Invoices History Table */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ background: '#F8FAFC', padding: '6px 10px', fontSize: '11px', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)' }}>
          {t.invoicesHistory}
        </div>
        <table className="sheets-table">
          <thead>
            <tr>
              <th>{t.invoiceId}</th>
              <th>{t.date}</th>
              <th>{t.amount}</th>
              <th>{t.method}</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                  No transaction history recorded in MongoDB. Top-up credits above to generate your first invoice.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>{inv.id}</td>
                  <td style={{ fontFamily: 'var(--font-code)' }}>{inv.date}</td>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '800', color: '#059669' }}>{inv.amount}</td>
                  <td>{inv.method}</td>
                  <td><span className="sheets-badge sheets-badge-emerald">PAID</span></td>
                  <td>
                    <button className="sheets-btn" style={{ padding: '2px 6px', fontSize: '10px' }} onClick={() => showToast(`Downloaded PDF for ${inv.id}`)}>
                      PDF
                    </button>
                  </td>
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
  window.BillingView = BillingView;
}

export default BillingView;

