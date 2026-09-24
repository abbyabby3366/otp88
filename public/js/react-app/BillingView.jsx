import React, { useState, useEffect } from 'react';
import { TableLoader } from './TableLoader.jsx';
import { TopupModal } from './TopupModal.jsx';
import { PaginationBar } from './PaginationBar.jsx';
import { apiFetch } from './api.js';

// User Billing & Transaction Ledger View
function BillingView({ t = {}, session, setSession, jwtToken, showToast, ratesList = [] }) {
  const [topupAmount, setTopupAmount] = useState(100);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('transactions'); // 'transactions' | 'invoices'
  const [txFilter, setTxFilter] = useState('ALL'); // 'ALL' | 'USAGE_OTP' | 'TOPUP'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoicePageSize, setInvoicePageSize] = useState(10);

  const waRate = (ratesList && ratesList.length > 0 && ratesList[0]?.whatsapp !== undefined && ratesList[0]?.whatsapp !== null)
    ? Number(ratesList[0].whatsapp)
    : 0.0075;
  const userBalance = session?.balanceUsd !== undefined ? session.balanceUsd : 50;

  const fetchBillingData = () => {
    if (!jwtToken) return;
    setLoading(true);
    
    // Fetch Invoices
    apiFetch('/api/billing/invoices', {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.invoices) setInvoices(data.invoices);
      })
      .catch(() => { /* keep the previous data; the status bar shows connectivity */ });

    // Fetch Transactions Ledger
    apiFetch('/api/billing/transactions', {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.transactions) setTransactions(data.transactions);
      })
      .catch(() => { /* keep the previous data; the status bar shows connectivity */ })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBillingData();
  }, [jwtToken]);

  const handleSimulateTopup = async (method) => {
    if (!jwtToken) return;
    try {
      const res = await apiFetch('/api/billing/topup', {
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

  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      (inv.id && inv.id.toLowerCase().includes(q)) ||
      (inv.method && inv.method.toLowerCase().includes(q)) ||
      (inv.amount && String(inv.amount).toLowerCase().includes(q))
    );
  });

  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedInvoices = filteredInvoices.slice((invoicePage - 1) * invoicePageSize, invoicePage * invoicePageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* KPI Balance Strip */}
      <div className="sheets-kpi-grid">
        <div className="sheets-kpi-cell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <div className="sheets-kpi-label">{t.currentBalance || 'AVAILABLE BALANCE'}</div>
                <div className="sheets-kpi-value" style={{ color: '#059669', fontSize: '22px' }}>
                  ${(session?.balanceUsd !== undefined ? session.balanceUsd : 50).toFixed(4)}
                </div>
              </div>
              <button
                type="button"
                className="sheets-btn sheets-btn-primary"
                onClick={() => setShowTopupModal(true)}
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                {t.topUpCredits || 'Top-up Balance'}
              </button>
            </div>
            <div className="sheets-kpi-sub">{t.autoReload || '● Active'}</div>
          </div>
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

      {/* Top-up Balance Modal */}
      <TopupModal
        isOpen={showTopupModal}
        onClose={() => setShowTopupModal(false)}
        session={session}
        topupAmount={topupAmount}
        setTopupAmount={setTopupAmount}
        onSimulateTopup={handleSimulateTopup}
        t={t}
      />

      {/* SUB-TABS: TRANSACTION LEDGER VS INVOICES */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
        <button
          className={`sheets-btn ${activeSubTab === 'transactions' ? 'sheets-btn-primary' : ''}`}
          onClick={() => { setActiveSubTab('transactions'); setCurrentPage(1); }}
          style={{ fontSize: '11px', fontWeight: '700' }}
        >
          Transaction & Usage Ledger ({transactions.length})
        </button>
        <button
          className={`sheets-btn ${activeSubTab === 'invoices' ? 'sheets-btn-primary' : ''}`}
          onClick={() => { setActiveSubTab('invoices'); setInvoicePage(1); }}
          style={{ fontSize: '11px', fontWeight: '700' }}
        >
          Invoices & Receipts ({invoices.length})
        </button>
      </div>

      {/* VIEW 1: TRANSACTION & USAGE LEDGER */}
      {activeSubTab === 'transactions' && (
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-card)' }}>
          <div style={{ background: 'var(--bg-ribbon)', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                className={`sheets-btn ${txFilter === 'ALL' ? 'sheets-btn-primary' : ''}`}
                style={{ fontSize: '10px', padding: '2px 8px' }}
                onClick={() => { setTxFilter('ALL'); setCurrentPage(1); }}
              >
                All ({transactions.length})
              </button>
              <button
                className={`sheets-btn ${txFilter === 'USAGE_OTP' ? 'sheets-btn-primary' : ''}`}
                style={{ fontSize: '10px', padding: '2px 8px' }}
                onClick={() => { setTxFilter('USAGE_OTP'); setCurrentPage(1); }}
              >
                OTP Usage ({transactions.filter(t => t.type === 'USAGE_OTP').length})
              </button>
              <button
                className={`sheets-btn ${txFilter === 'TOPUP' ? 'sheets-btn-primary' : ''}`}
                style={{ fontSize: '10px', padding: '2px 8px' }}
                onClick={() => { setTxFilter('TOPUP'); setCurrentPage(1); }}
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
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); setInvoicePage(1); }}
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
                <th>Channel / Method</th>
                <th>Amount ($)</th>
                <th>Balance After</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoader colSpan={7} message="Loading transaction ledger..." />
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '18px', color: 'var(--text-muted)' }}>
                    No transactions found. Send an OTP to see live balance deductions.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx, idx) => {
                  const isUsage = tx.type === 'USAGE_OTP' || (tx.amount && tx.amount < 0);
                  const rowNum = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={tx._id || tx.txId || idx}>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '10px' }}>{rowNum}</td>
                      <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {tx.referenceId || tx.txId}
                      </td>
                      <td>
                        <span className={`sheets-badge ${
                          (tx.category || tx.channel || tx.method || '').toUpperCase().includes('WHATSAPP') ? 'sheets-badge-emerald' :
                          (tx.category || tx.channel || tx.method || '').toUpperCase().includes('TELEGRAM') ? 'sheets-badge-blue' :
                          (tx.category || tx.channel || tx.method || '').toUpperCase().includes('VOICE') ? 'sheets-badge-purple' :
                          (tx.category || tx.channel || tx.method || '').toUpperCase().includes('RCS') ? 'sheets-badge-indigo' :
                          (tx.category || tx.channel || tx.method || '').toUpperCase().includes('EMAIL') ? 'sheets-badge-cyan' :
                          (tx.category || tx.channel || tx.method || '').toUpperCase().includes('SMS') || (tx.category || tx.channel || tx.method || '').toUpperCase().includes('360') || (tx.category || tx.channel || tx.method || '').toUpperCase().includes('TELCO') ? 'sheets-badge-amber' :
                          'sheets-badge-emerald'
                        }`}>
                          {(tx.category || tx.channel || tx.method || '').toUpperCase().includes('WHATSAPP') ? 'WHATSAPP API' :
                           (tx.category || tx.channel || tx.method || '').toUpperCase().includes('SMS') || (tx.category || tx.channel || tx.method || '').toUpperCase().includes('360') || (tx.category || tx.channel || tx.method || '').toUpperCase().includes('TELCO') ? 'SMS' :
                           (tx.category || tx.channel || tx.method || '').toUpperCase().includes('TELEGRAM') ? 'TELEGRAM' :
                           tx.category || tx.channel || tx.method || 'GENERAL'}
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
                        ${(tx.balanceAfter !== undefined && tx.balanceAfter !== null) ? Number(tx.balanceAfter).toFixed(4) : (session?.balanceUsd || 50).toFixed(4)}
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

          {/* Compact Pagination Bar for Transactions */}
          <PaginationBar
            totalItems={filteredTransactions.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}

      {/* VIEW 2: INVOICES HISTORY */}
      {activeSubTab === 'invoices' && (
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-card)' }}>
          <div style={{ background: 'var(--bg-ribbon)', padding: '8px 12px', fontSize: '11px', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>{t.invoicesHistory || 'INVOICES & TOP-UP RECEIPTS'} ({invoices.length})</span>
            <input
              type="text"
              className="sheets-input"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setInvoicePage(1); }}
              style={{ width: '180px', padding: '2px 6px', fontSize: '11px' }}
            />
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
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                    No invoice history found.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => (
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

          {/* Compact Pagination Bar for Invoices */}
          <PaginationBar
            totalItems={filteredInvoices.length}
            currentPage={invoicePage}
            pageSize={invoicePageSize}
            onPageChange={(p) => setInvoicePage(p)}
            onPageSizeChange={(sz) => { setInvoicePageSize(sz); setInvoicePage(1); }}
            pageSizeOptions={[10, 25, 50]}
          />
        </div>
      )}
    </div>
  );
}


export default BillingView;
