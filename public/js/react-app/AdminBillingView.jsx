import React, { useState, useEffect } from 'react';

// Admin Billing & Multi-Tenant Balance Management View
function AdminBillingView({ t, usersList = [], jwtToken, showToast, refreshUsers }) {
  const [invoices, setInvoices] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [topupAmount, setTopupAmount] = useState(100);
  const [topupMethod, setTopupMethod] = useState('Manual Admin Credit');
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all invoices across all users
  const fetchInvoices = () => {
    if (!jwtToken) return;
    fetch('/api/admin/invoices', {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.invoices) setInvoices(data.invoices);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchInvoices();
  }, [jwtToken]);

  // Set default selected user
  useEffect(() => {
    if (usersList.length > 0 && !selectedUserId) {
      const firstUser = usersList.find(u => u.role !== 'ADMIN') || usersList[0];
      if (firstUser) setSelectedUserId(firstUser._id);
    }
  }, [usersList, selectedUserId]);

  const handleAdminTopup = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !jwtToken) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/billing/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          userId: selectedUserId,
          amount: parseFloat(topupAmount) || 0,
          method: topupMethod
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchInvoices();
        if (refreshUsers) refreshUsers();
      } else {
        showToast(data.error || 'Failed to credit user balance', 'error');
      }
    } catch (err) {
      showToast('Error crediting balance', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const totalPlatformBalance = usersList.reduce((acc, u) => acc + (u.balanceUsd || 0), 0);
  const selectedUser = usersList.find(u => u._id === selectedUserId);

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
            ${totalPlatformBalance.toFixed(2)} USD
          </div>
          <div className="sheets-kpi-sub">Across {usersList.length} user accounts</div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">TOTAL INVOICES COUNT</div>
          <div className="sheets-kpi-value" style={{ color: '#0284C7' }}>
            {invoices.length} Invoices
          </div>
          <div className="sheets-kpi-sub">● Processed Invoices</div>
        </div>
        <div className="sheets-kpi-cell">
          <div className="sheets-kpi-label">AVERAGE USER BALANCE</div>
          <div className="sheets-kpi-value" style={{ color: '#7C3AED' }}>
            ${usersList.length > 0 ? (totalPlatformBalance / usersList.length).toFixed(2) : '0.00'}
          </div>
          <div className="sheets-kpi-sub">Per Active User</div>
        </div>
      </div>

      {/* Manual Top-up / Balance Credit Box */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          CREDIT USER BALANCE (MANUAL TOP-UP)
        </div>

        <form onSubmit={handleAdminTopup} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Target User
            </label>
            <select
              className="sheets-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              style={{ width: '100%' }}
            >
              {usersList.map(u => (
                <option key={u._id} value={u._id}>
                  {u.name || u.email} ({u.email}) - Current: ${(u.balanceUsd || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Top-up Amount ($ USD)
            </label>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                type="number"
                step="5"
                min="1"
                className="sheets-input sheets-input-code"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                required
                style={{ width: '100%', fontWeight: '700' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Reference / Method
            </label>
            <input
              type="text"
              className="sheets-input"
              value={topupMethod}
              onChange={(e) => setTopupMethod(e.target.value)}
              placeholder="e.g. Bank Wire / USDT / Promo"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <button
              type="submit"
              className="sheets-btn sheets-btn-primary"
              disabled={processing || !selectedUserId}
              style={{ width: '100%', padding: '6px 14px', background: '#059669' }}
            >
              {processing ? 'Crediting...' : `+ Credit $${parseFloat(topupAmount || 0).toFixed(2)} to User`}
            </button>
          </div>
        </form>

        {selectedUser && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)', background: '#F8FAFC', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            Selected: <strong>{selectedUser.name || selectedUser.email}</strong> | Role: <span className="sheets-badge sheets-badge-blue">{selectedUser.role}</span> | Current Balance: <strong style={{ color: '#059669' }}>${(selectedUser.balanceUsd || 0).toFixed(2)}</strong>
          </div>
        )}
      </div>

      {/* All Users Invoices Table */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
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
            {filteredInvoices.length === 0 ? (
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

    </div>
  );
}

if (typeof window !== 'undefined') {
  window.AdminBillingView = AdminBillingView;
}

export default AdminBillingView;
