// Admin Users Management Spreadsheet View
function UsersView({ t, usersList, handleCreateUser, handleTopupUser, copyToClipboard, newUserName, setNewUserName, newUserEmail, setNewUserEmail, newUserBalance, setNewUserBalance }) {
  return (
    <div>
      {/* Create New Tenant Bar */}
      <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 0.8fr auto', gap: '8px', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '10px', marginBottom: '12px' }}>
        <div>
          <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{t.tenantName}</label>
          <input type="text" className="sheets-input" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="e.g. Binance SG KYC" required />
        </div>
        <div>
          <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{t.tenantEmail}</label>
          <input type="email" className="sheets-input" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="dev@client.com" required />
        </div>
        <div>
          <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{t.tenantBalance}</label>
          <input type="number" step="10" className="sheets-input sheets-input-code" value={newUserBalance} onChange={(e) => setNewUserBalance(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button type="submit" className="sheets-btn sheets-btn-primary" style={{ padding: '6px 12px' }}>
            + {t.addUser}
          </button>
        </div>
      </form>

      {/* Users Spreadsheet Grid */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px' }}>
          <span style={{ fontWeight: '700' }}>{t.usersTitle}</span>
          <span style={{ color: 'var(--text-muted)' }}>Total Tenants: {usersList.length}</span>
        </div>
        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '35px' }}>#</th>
              <th>{t.tenantName}</th>
              <th>{t.tenantEmail}</th>
              <th>{t.tenantRole}</th>
              <th>{t.tenantBalance}</th>
              <th>API Key</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!usersList || usersList.length === 0) ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                  No registered tenant users in MongoDB. Add a tenant above or register a new user.
                </td>
              </tr>
            ) : (
              usersList.map((usr, idx) => (
                <tr key={usr._id || idx}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '10px' }}>{idx + 1}</td>
                  <td><strong>{usr.name}</strong></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{usr.email}</td>
                  <td><span className="sheets-badge sheets-badge-blue">{usr.role || 'USER'}</span></td>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '800', color: '#059669' }}>${(usr.balanceUsd || 0).toFixed(2)}</td>
                  <td style={{ fontFamily: 'var(--font-code)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {usr.apiKeyLive ? (usr.apiKeyLive.slice(0, 12) + '•••') : 'otp_live_88•••'}
                  </td>
                  <td>
                    <span className={`sheets-badge ${usr.status === 'PAUSED' ? 'sheets-badge-amber' : 'sheets-badge-emerald'}`}>
                      {usr.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="sheets-btn sheets-btn-primary" style={{ padding: '2px 6px', fontSize: '10px' }} onClick={() => handleTopupUser(usr._id)}>
                        {t.topUpBtn}
                      </button>
                      <button className="sheets-btn" style={{ padding: '2px 6px', fontSize: '10px' }} onClick={() => copyToClipboard(usr.apiKeyLive || 'otp_live_88a90184bcedf', 'API Key')}>
                        Copy
                      </button>
                    </div>
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
  window.UsersView = UsersView;
}

export default UsersView;

