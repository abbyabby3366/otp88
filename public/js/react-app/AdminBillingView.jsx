import React, { useState, useEffect } from 'react';
import SearchableSelect from './SearchableSelect.jsx';
import { TableLoader } from './TableLoader.jsx';

// Admin Billing, Multi-Tenant Balance Management & Platform Transaction Ledger
function AdminBillingView({ t, usersList = [], jwtToken, showToast, refreshUsers }) {
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('transactions'); // 'transactions' | 'invoices'
  const [txFilter, setTxFilter] = useState('ALL'); // 'ALL' | 'USAGE_OTP' | 'ADJUSTMENTS'
  const [selectedUserId, setSelectedUserId] = useState('');
  const [adjustmentAction, setAdjustmentAction] = useState('CREDIT'); // 'CREDIT' | 'DEBIT'
  const [adjustmentAmount, setAdjustmentAmount] = useState(100);
  const [adjustmentMethod, setAdjustmentMethod] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch all invoices across all users
  const fetchInvoices = () => {
    if (!jwtToken) return;
    setLoading(true);
    fetch('/api/admin/invoices', {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.invoices) setInvoices(data.invoices);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Fetch all platform transactions across all users
  const fetchTransactions = () => {
    if (!jwtToken) return;
    setLoading(true);
    fetch('/api/admin/billing/transactions', {
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
    fetchInvoices();
    fetchTransactions();
  }, [jwtToken]);

  // Set default selected user
  useEffect(() => {
    if (usersList.length > 0 && !selectedUserId) {
      const firstUser = usersList.find(u => u.role !== 'ADMIN') || usersList[0];
      if (firstUser) setSelectedUserId(firstUser._id);
    }
  }, [usersList, selectedUserId]);

  const handleAdminBalanceAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !jwtToken) return;
    const parsedAmount = parseFloat(adjustmentAmount) || 0;
    if (parsedAmount <= 0) {
      showToast('Please enter an amount greater than 0', 'error');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/admin/billing/adjust-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          userId: selectedUserId,
          amount: parsedAmount,
          action: adjustmentAction,
          method: adjustmentMethod.trim() || (adjustmentAction === 'DEBIT' ? 'Admin Manual Debit' : 'Manual Admin Credit')
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchInvoices();
        fetchTransactions();
        if (refreshUsers) refreshUsers();
      } else {
        showToast(data.error || `Failed to ${adjustmentAction.toLowerCase()} user balance`, 'error');
      }
    } catch (err) {
      showToast(`Error performing ${adjustmentAction.toLowerCase()} balance adjustment`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const totalPlatformBalance = usersList.reduce((acc, u) => acc + (u.balanceUsd || 0), 0);
  const selectedUser = usersList.find(u => u._id === selectedUserId);

  const filteredTransactions = transactions.filter(tx => {
    if (txFilter === 'USAGE_OTP' && tx.type !== 'USAGE_OTP') return false;
    if (txFilter === 'ADJUSTMENTS' && tx.type !== 'TOPUP' && tx.type !== 'ADMIN_CREDIT' && tx.type !== 'ADMIN_DEBIT') return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (tx.txId && tx.txId.toLowerCase().includes(term)) ||
      (tx.referenceId && tx.referenceId.toLowerCase().includes(term)) ||
      (tx.userName && tx.userName.toLowerCase().includes(term)) ||
      (tx.userEmail && tx.userEmail.toLowerCase().includes(term)) ||
      (tx.description && tx.description.toLowerCase().includes(term)) ||
      (tx.category && tx.category.toLowerCase().includes(term)) ||
      (tx.recipient && tx.recipient.toLowerCase().includes(term))
    );
  });

  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (inv.id && inv.id.toLowerCase().includes(term)) ||
      (inv.userName && inv.userName.toLowerCase().includes(term)) ||
      (inv.userEmail && inv.userEmail.toLowerCase().includes(term)) ||
      (inv.method && inv.method.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Top Platform Financial KPI Cards */}
      <div className="sheets-kpi-grid">
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">TOTAL PLATFORM BALANCES</div>
          <div className="sheets-kpi-value" style={{ color: '#059669', fontSize: '20px' }}>
            ${totalPlatformBalance.toFixed(4)} USD
          </div>
          <div className="sheets-kpi-sub">Across {usersList.length} user accounts</div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">TRANSACTIONS LOGGED</div>
          <div className="sheets-kpi-value" style={{ color: '#0284C7' }}>
            {transactions.length} Records
          </div>
          <div className="sheets-kpi-sub">● Real-time Ledger</div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">AVERAGE USER BALANCE</div>
          <div className="sheets-kpi-value" style={{ color: '#7C3AED' }}>
            ${usersList.length > 0 ? (totalPlatformBalance / usersList.length).toFixed(4) : '0.0000'}
          </div>
          <div className="sheets-kpi-sub">Per Active Tenant</div>
        </div>
      </div>

      {/* Edit User Balance Box (Credit & Debit stored in Transactions) */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            EDIT USER BALANCE
          </div>

          {/* Action Selector: Credit vs Debit */}
          <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setAdjustmentAction('CREDIT')}
              style={{
                padding: '4px 14px',
                fontSize: '11px',
                fontWeight: '700',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: adjustmentAction === 'CREDIT' ? '#059669' : 'transparent',
                color: adjustmentAction === 'CREDIT' ? '#FFFFFF' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>+</span> Credit (Add Balance)
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentAction('DEBIT')}
              style={{
                padding: '4px 14px',
                fontSize: '11px',
                fontWeight: '700',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: adjustmentAction === 'DEBIT' ? '#DC2626' : 'transparent',
                color: adjustmentAction === 'DEBIT' ? '#FFFFFF' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>-</span> Debit (Deduct Balance)
            </button>
          </div>
        </div>

        <form onSubmit={handleAdminBalanceAdjustment} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Target User
            </label>
            <SearchableSelect
              options={usersList}
              value={selectedUserId}
              onChange={(val) => setSelectedUserId(val)}
              placeholder="Select target user..."
              searchPlaceholder="Search name, email..."
              style={{ width: '100%' }}
              buttonStyle={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
              dropdownWidth="100%"
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              {adjustmentAction === 'CREDIT' ? 'Credit Amount ($ USD)' : 'Debit Amount ($ USD)'}
            </label>
            <input
              type="number"
              step="any"
              min="0.0001"
              className="sheets-input sheets-input-code"
              value={adjustmentAmount}
              onChange={(e) => setAdjustmentAmount(e.target.value)}
              required
              style={{ width: '100%', fontWeight: '700' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              {adjustmentAction === 'CREDIT' ? 'Reference / Top-up Method' : 'Reason / Note'}
            </label>
            <input
              type="text"
              className="sheets-input"
              value={adjustmentMethod}
              onChange={(e) => setAdjustmentMethod(e.target.value)}
              placeholder={adjustmentAction === 'CREDIT' ? 'e.g. Bank Wire / USDT / Promo Credit' : 'e.g. Manual Adjustment / Fee Deduction / Correction'}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <button
              type="submit"
              className="sheets-btn"
              disabled={processing || !selectedUserId || !adjustmentAmount || parseFloat(adjustmentAmount) <= 0}
              style={{
                width: '100%',
                padding: '6px 14px',
                background: adjustmentAction === 'CREDIT' ? '#059669' : '#DC2626',
                color: '#FFFFFF',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {processing
                ? 'Processing...'
                : adjustmentAction === 'CREDIT'
                ? `+ Credit $${parseFloat(adjustmentAmount || 0).toFixed(2)} to User`
                : `- Debit $${parseFloat(adjustmentAmount || 0).toFixed(2)} from User`}
            </button>
          </div>
        </form>

        {selectedUser && (
          <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary)', background: '#F8FAFC', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              Selected: <strong>{selectedUser.name || selectedUser.email}</strong> | Role: <span className="sheets-badge sheets-badge-blue">{selectedUser.role}</span> | Current Balance: <strong style={{ color: '#059669' }}>${(selectedUser.balanceUsd || 0).toFixed(4)}</strong>
            </div>
            {adjustmentAmount && parseFloat(adjustmentAmount) > 0 && (
              <div style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>
                Est. Balance After:{' '}
                <span style={{ color: adjustmentAction === 'CREDIT' ? '#059669' : ((selectedUser.balanceUsd || 0) - parseFloat(adjustmentAmount)) < 0 ? '#DC2626' : '#2563EB' }}>
                  ${(adjustmentAction === 'CREDIT'
                    ? (selectedUser.balanceUsd || 0) + parseFloat(adjustmentAmount)
                    : (selectedUser.balanceUsd || 0) - parseFloat(adjustmentAmount)
                  ).toFixed(4)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SUB-TABS: TRANSACTION LEDGER VS INVOICES */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
        <button
          className={`sheets-btn ${activeSubTab === 'transactions' ? 'sheets-btn-primary' : ''}`}
          onClick={() => setActiveSubTab('transactions')}
          style={{ fontSize: '11px', fontWeight: '700' }}
        >
          All Platform Transactions & Usage ({transactions.length})
        </button>
        <button
          className={`sheets-btn ${activeSubTab === 'invoices' ? 'sheets-btn-primary' : ''}`}
          onClick={() => setActiveSubTab('invoices')}
          style={{ fontSize: '11px', fontWeight: '700' }}
        >
          Invoices & Top-up Receipts ({invoices.length})
        </button>
      </div>

      {/* VIEW 1: UNIFIED TRANSACTION & USAGE LEDGER */}
      {activeSubTab === 'transactions' && (
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', background: '#FFFFFF' }}>
          <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
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
                className={`sheets-btn ${txFilter === 'ADJUSTMENTS' ? 'sheets-btn-primary' : ''}`}
                style={{ fontSize: '10px', padding: '2px 8px' }}
                onClick={() => setTxFilter('ADJUSTMENTS')}
              >
                Credits & Debits ({transactions.filter(t => t.type === 'TOPUP' || t.type === 'ADMIN_CREDIT' || t.type === 'ADMIN_DEBIT').length})
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="text"
                className="sheets-input sheets-input-code"
                placeholder="Search user, ID, phone, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '240px', padding: '3px 8px', fontSize: '11px' }}
              />
              <button className="sheets-btn" style={{ fontSize: '10px', padding: '2px 6px' }} onClick={fetchTransactions}>
                Refresh
              </button>
            </div>
          </div>

          <table className="sheets-table">
            <thead>
              <tr>
                <th style={{ width: '35px' }}>#</th>
                <th>User / Tenant</th>
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
                <TableLoader colSpan={9} message="Loading all platform billing ledgers..." />
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '18px', color: 'var(--text-muted)' }}>
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => {
                  const isDebitOrUsage = tx.type === 'USAGE_OTP' || tx.type === 'ADMIN_DEBIT' || (tx.amount && tx.amount < 0);
                  return (
                    <tr key={tx._id || tx.txId || idx}>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '10px' }}>{idx + 1}</td>
                      <td>
                        <strong>{tx.userName || 'User'}</strong>
                        {tx.userEmail && (
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{tx.userEmail}</div>
                        )}
                      </td>
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
                        <span className={`sheets-badge ${tx.type === 'ADMIN_DEBIT' || tx.category === 'Balance Debit' ? 'sheets-badge-danger' : (tx.type === 'ADMIN_CREDIT' || tx.type === 'TOPUP') ? 'sheets-badge-emerald' : tx.channel && tx.channel.includes('WHATSAPP') ? 'sheets-badge-emerald' : tx.channel && tx.channel.includes('TELEGRAM') ? 'sheets-badge-blue' : tx.channel && tx.channel.includes('SMS') ? 'sheets-badge-amber' : 'sheets-badge-purple'}`}>
                          {tx.category || tx.channel}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-code)', fontWeight: '800' }}>
                        {isDebitOrUsage ? (
                          <span style={{ color: '#DC2626' }}>
                            -${Math.abs(tx.amount).toFixed(tx.type === 'USAGE_OTP' ? 4 : 2)}
                          </span>
                        ) : (
                          <span style={{ color: '#059669' }}>
                            +${Math.abs(tx.amount).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-code)', fontWeight: '600', color: '#0F172A' }}>
                        ${(tx.balanceAfter !== undefined && tx.balanceAfter !== null) ? Number(tx.balanceAfter).toFixed(4) : '0.0000'}
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

      {/* VIEW 2: INVOICES TABLE */}
      {activeSubTab === 'invoices' && (
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', background: '#FFFFFF' }}>
          <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>ALL USER INVOICES & RECHARGE HISTORY ({filteredInvoices.length})</span>
            
            <input
              type="text"
              className="sheets-input sheets-input-code"
              placeholder="Search invoice, user or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '220px', padding: '4px 8px', fontSize: '11px' }}
            />
          </div>

          <table className="sheets-table">
            <thead>
              <tr>
                <th style={{ width: '35px' }}>#</th>
                <th>User</th>
                <th>Email</th>
                <th>Invoice ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoader colSpan={9} message="Loading all user invoices..." />
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '18px', color: 'var(--text-muted)' }}>
                    No billing transactions found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => (
                  <tr key={inv.id || idx}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '10px' }}>{idx + 1}</td>
                    <td><strong>{inv.userName || 'User'}</strong></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{inv.userEmail || '-'}</td>
                    <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700' }}>{inv.id}</td>
                    <td style={{ fontFamily: 'var(--font-code)' }}>{inv.date}</td>
                    <td style={{ fontFamily: 'var(--font-code)', fontWeight: '800', color: '#059669' }}>{inv.amount}</td>
                    <td>{inv.method}</td>
                    <td><span className="sheets-badge sheets-badge-emerald">{inv.status || 'PAID'}</span></td>
                    <td>
                      <button
                        className="sheets-btn"
                        style={{ padding: '2px 6px', fontSize: '10px' }}
                        onClick={() => showToast(`Invoice Receipt downloaded for ${inv.id}`)}
                      >
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
  window.AdminBillingView = AdminBillingView;
}

export default AdminBillingView;

