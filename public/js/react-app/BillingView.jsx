import React, { useState, useEffect } from 'react';
import { TableLoader } from './TableLoader.jsx';

// User Billing & Transaction Ledger View
function BillingView({ t, session, setSession, jwtToken, showToast, ratesList = [] }) {
  const [topupAmount, setTopupAmount] = useState(100);
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('transactions'); // 'transactions' | 'invoices'
  const [txFilter, setTxFilter] = useState('ALL'); // 'ALL' | 'USAGE_OTP' | 'TOPUP'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const waRate = (ratesList && ratesList.length > 0 && ratesList[0]?.whatsapp !== undefined && ratesList[0]?.whatsapp !== null)
    ? Number(ratesList[0].whatsapp)
    : 0.0075;
  const userBalance = session?.balanceUsd !== undefined ? session.balanceUsd : 50;

  const fetchBillingData = () => {
    if (!jwtToken) return;
    setLoading(true);
    
    // Fetch Invoices
    fetch('/api/billing/invoices', {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.invoices) setInvoices(data.invoices);
      })
      .catch(() => {});

    // Fetch Transactions Ledger
    fetch('/api/billing/transactions', {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.transactions) setTransactions(data.transactions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBillingData();
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
        if (data.newBalance !== undefined && setSession) {
          setSession(prev => {
            const updated = { ...prev, balanceUsd: data.newBalance };
            localStorage.setItem('otp88_session', JSON.stringify(updated));
            return updated;
          });
        }
        fetchBillingData();
      }
    } catch (e) {
      showToast('Top-up error', 'error');
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (txFilter === 'USAGE_OTP' && tx.type !== 'USAGE_OTP') return false;
    if (txFilter === 'TOPUP' && tx.type !== 'TOPUP' && tx.type !== 'ADMIN_CREDIT') return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      (tx.txId && tx.txId.toLowerCase().includes(q)) ||
      (tx.referenceId && tx.referenceId.toLowerCase().includes(q)) ||
      (tx.description && tx.description.toLowerCase().includes(q)) ||
      (tx.category && tx.category.toLowerCase().includes(q)) ||
      (tx.recipient && tx.recipient.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* KPI Balance Strip */}
      <div className="sheets-kpi-grid">
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">{t.currentBalance || 'AVAILABLE BALANCE'}</div>
          <div className="sheets-kpi-value" style={{ color: '#059669', fontSize: '22px' }}>
            ${(session.balanceUsd !== undefined ? session.balanceUsd : 50).toFixed(4)}
          </div>
          <div className="sheets-kpi-sub">{t.autoReload || '● Active'}</div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">Estimated Remaining OTPs</div>
          <div className="sheets-kpi-value" style={{ color: '#0284C7' }}>
            ~{Math.floor(userBalance / (waRate || 0.0075)).toLocaleString()} OTPs
          </div>
          <div className="sheets-kpi-sub">WhatsApp @ ${waRate.toFixed(4)} / OTP</div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">Plan / Tier</div>
          <div className="sheets-kpi-value" style={{ color: '#7C3AED' }}>Standard</div>
          <div className="sheets-kpi-sub">Pay-As-You-Go</div>
        </div>
      </div>

      {/* Top-up Selection Box */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '0.02em' }}>
          {t.topUpCredits || 'ACCOUNT BALANCE RECHARGE'}
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
          <button className="sheets-btn sheets-btn-primary" style={{ padding: '6px 14px' }} onClick={() => handleSimulateTopup('Credit Card (Stripe)')}>
            {t.payWithCard || 'Pay with Credit Card'}
          </button>
          <button className="sheets-btn" style={{ padding: '6px 14px' }} onClick={() => handleSimulateTopup('USDT Crypto')}>
            {t.payWithCrypto || 'Pay with Crypto (USDT)'}
          </button>
        </div>
      </div>

      {/* SUB-TABS: TRANSACTION LEDGER VS INVOICES */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
        <button
          className={`sheets-btn ${activeSubTab === 'transactions' ? 'sheets-btn-primary' : ''}`}
          onClick={() => setActiveSubTab('transactions')}
          style={{ fontSize: '11px', fontWeight: '700' }}
        >
          Transaction & Usage Ledger ({transactions.length})
        </button>
        <button
          className={`sheets-btn ${activeSubTab === 'invoices' ? 'sheets-btn-primary' : ''}`}
          onClick={() => setActiveSubTab('invoices')}
          style={{ fontSize: '11px', fontWeight: '700' }}
        >
          Invoices & Receipts ({invoices.length})
        </button>
      </div>

      {/* VIEW 1: TRANSACTION & USAGE LEDGER */}
      {activeSubTab === 'transactions' && (
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', background: '#FFFFFF' }}>
          <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                className={`sheets-btn ${txFilter === 'ALL' ? 'sheets-btn-primary' : ''}`}
                style={{ fontSize: '10px', padding: '2px 8px' }}
                onClick={() => setTxFilter('ALL')}
              >
                All ({transactions.length})
              </button>
              <button
                className={`sheets-btn ${txFilter === 'USAGE_OTP' ? 'sheets-btn-primary' : ''}`}
                style={{ fontSize: '10px', padding: '2px 8px' }}
                onClick={() => setTxFilter('USAGE_OTP')}
              >
                OTP Usage ({transactions.filter(t => t.type === 'USAGE_OTP').length})
              </button>
              <button
                className={`sheets-btn ${txFilter === 'TOPUP' ? 'sheets-btn-primary' : ''}`}
                style={{ fontSize: '10px', padding: '2px 8px' }}
                onClick={() => setTxFilter('TOPUP')}
              >
                Top-ups ({transactions.filter(t => t.type === 'TOPUP' || t.type === 'ADMIN_CREDIT').length})
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                className="sheets-input"
                placeholder="Search reference ID, phone, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '240px', padding: '3px 8px', fontSize: '11px' }}
              />
              <button className="sheets-btn" style={{ fontSize: '10px', padding: '2px 6px' }} onClick={fetchBillingData}>
                Refresh
              </button>
            </div>
          </div>

          <table className="sheets-table">
            <thead>
              <tr>
                <th style={{ width: '35px' }}>#</th>
                <th>Reference / Tx ID</th>
                <th>Spent Where / Description</th>
                <th>Channel / Method</th>
                <th>Amount ($)</th>
                <th>Balance After</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoader colSpan={8} message="Loading transaction ledger..." />
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '18px', color: 'var(--text-muted)' }}>
                    No transactions found. Send an OTP to see live balance deductions.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => {
                  const isUsage = tx.type === 'USAGE_OTP' || (tx.amount && tx.amount < 0);
                  return (
                    <tr key={tx._id || tx.txId || idx}>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '10px' }}>{idx + 1}</td>
                      <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {tx.referenceId || tx.txId}
                      </td>
                      <td>
                        <strong>{tx.description}</strong>
                        {tx.recipient && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px', fontFamily: 'var(--font-code)' }}>
                            ({tx.recipient})
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`sheets-badge ${tx.channel && tx.channel.includes('WHATSAPP') ? 'sheets-badge-emerald' : tx.channel && tx.channel.includes('TELEGRAM') ? 'sheets-badge-blue' : tx.channel && tx.channel.includes('SMS') ? 'sheets-badge-amber' : 'sheets-badge-purple'}`}>
                          {tx.category || tx.channel}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-code)', fontWeight: '800' }}>
                        {isUsage ? (
                          <span style={{ color: '#DC2626' }}>
                            -${Math.abs(tx.amount).toFixed(4)}
                          </span>
                        ) : (
                          <span style={{ color: '#059669' }}>
                            +${Math.abs(tx.amount).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-code)', fontWeight: '600', color: '#0F172A' }}>
                        ${(tx.balanceAfter !== undefined && tx.balanceAfter !== null) ? Number(tx.balanceAfter).toFixed(4) : (session.balanceUsd || 50).toFixed(4)}
                      </td>
                      <td style={{ fontFamily: 'var(--font-code)', color: 'var(--text-muted)', fontSize: '11px' }}>
                        {tx.date} {tx.time}
                      </td>
                      <td>
                        <span className="sheets-badge sheets-badge-emerald" style={{ fontSize: '9px', padding: '1px 5px' }}>
                          {tx.status || 'DELIVERED'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: INVOICES HISTORY */}
      {activeSubTab === 'invoices' && (
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', background: '#FFFFFF' }}>
          <div style={{ background: '#F8FAFC', padding: '8px 12px', fontSize: '11px', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)' }}>
            {t.invoicesHistory || 'INVOICES & TOP-UP RECEIPTS'}
          </div>
          <table className="sheets-table">
            <thead>
              <tr>
                <th>{t.invoiceId || 'Invoice ID'}</th>
                <th>{t.date || 'Date'}</th>
                <th>{t.amount || 'Amount'}</th>
                <th>{t.method || 'Method'}</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoader colSpan={6} message="Loading invoices & receipts..." />
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                    No invoice history found.
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
      )}
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.BillingView = BillingView;
}

export default BillingView;

