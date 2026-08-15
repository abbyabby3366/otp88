import React, { useState } from 'react';

// Admin Users Management Spreadsheet View
function UsersView({
  t,
  usersList = [],
  handleCreateUser,
  handleUpdateUser,
  copyToClipboard,
  newUserName,
  setNewUserName,
  newUserEmail,
  setNewUserEmail,
  newUserBalance,
  setNewUserBalance
}) {
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editBalance, setEditBalance] = useState('50');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'USER');
    setEditStatus(user.status || 'ACTIVE');
    setEditBalance(user.balanceUsd !== undefined ? user.balanceUsd.toString() : '50');
    setEditPassword('');
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
    setSaving(false);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingUser || !handleUpdateUser) return;
    setSaving(true);
    const payload = {
      name: editName,
      email: editEmail,
      role: editRole,
      status: editStatus,
      balanceUsd: parseFloat(editBalance) || 0
    };
    if (editPassword && editPassword.trim().length >= 6) {
      payload.password = editPassword.trim();
    }
    const success = await handleUpdateUser(editingUser._id, payload);
    setSaving(false);
    if (success) {
      setEditingUser(null);
    }
  };

  return (
    <div>
      {/* Create New User Bar */}
      <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 0.8fr auto', gap: '8px', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '10px', marginBottom: '12px' }}>
        <div>
          <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{t.tenantName || 'User Name'}</label>
          <input
            type="text"
            className="sheets-input"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder={t.placeholderName || 'e.g. John Doe / dev_user'}
            required
          />
        </div>
        <div>
          <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{t.tenantEmail || 'Email Address'}</label>
          <input
            type="email"
            className="sheets-input"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder={t.placeholderEmail || 'user@example.com'}
            required
          />
        </div>
        <div>
          <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>{t.tenantBalance || 'Balance (USD)'}</label>
          <input
            type="number"
            step="10"
            className="sheets-input sheets-input-code"
            value={newUserBalance}
            onChange={(e) => setNewUserBalance(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button type="submit" className="sheets-btn sheets-btn-primary" style={{ padding: '6px 14px' }}>
            + {t.addUser || 'Add User'}
          </button>
        </div>
      </form>

      {/* Users Spreadsheet Grid */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px' }}>
          <span style={{ fontWeight: '700' }}>{t.usersTitle || 'USERS DIRECTORY'}</span>
          <span style={{ color: 'var(--text-muted)' }}>{(t.totalUsers || 'Total Users')}: {usersList.length}</span>
        </div>
        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '35px' }}>#</th>
              <th>{t.tenantName || 'User Name'}</th>
              <th>{t.tenantEmail || 'Email Address'}</th>
              <th>{t.tenantRole || 'Role'}</th>
              <th>{t.tenantBalance || 'Balance (USD)'}</th>
              <th>API Key</th>
              <th>{t.statusLabel || 'Status'}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!usersList || usersList.length === 0) ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                  No users found. Add a user above or register a new account.
                </td>
              </tr>
            ) : (
              usersList.map((usr, idx) => (
                <tr key={usr._id || idx}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '10px' }}>{idx + 1}</td>
                  <td><strong>{usr.name || usr.email}</strong></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{usr.email}</td>
                  <td>
                    <span className={`sheets-badge ${usr.role === 'ADMIN' ? 'sheets-badge-purple' : 'sheets-badge-blue'}`}>
                      {usr.role || 'USER'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-code)', fontWeight: '800', color: '#059669' }}>
                    ${(usr.balanceUsd || 0).toFixed(2)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-code)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {usr.apiKeyLive ? (usr.apiKeyLive.slice(0, 12) + '•••') : 'otp_live_88•••'}
                  </td>
                  <td>
                    <span className={`sheets-badge ${usr.status === 'PAUSED' ? 'sheets-badge-amber' : usr.status === 'SUSPENDED' ? 'sheets-badge-danger' : 'sheets-badge-emerald'}`}>
                      {usr.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="sheets-btn"
                        style={{ padding: '2px 6px', fontSize: '10px', background: '#F1F5F9' }}
                        onClick={() => handleOpenEdit(usr)}
                        title="Edit User"
                      >
                        {t.editUser || 'Edit'}
                      </button>
                      <button
                        className="sheets-btn"
                        style={{ padding: '2px 6px', fontSize: '10px' }}
                        onClick={() => copyToClipboard(usr.apiKeyLive || 'otp_live_88a90184bcedf', 'API Key')}
                        title="Copy API Key"
                      >
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

      {/* Edit User Modal Dialog */}
      {editingUser && (
        <div className="sheets-modal-backdrop" onClick={handleCloseEdit}>
          <div className="sheets-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="sheets-modal-header">
              <span>{t.editUserTitle || 'Edit User Details'}</span>
              <button
                type="button"
                onClick={handleCloseEdit}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="sheets-modal-body">
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {t.tenantName || 'User Name'}
                  </label>
                  <input
                    type="text"
                    className="sheets-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {t.tenantEmail || 'Email Address'}
                  </label>
                  <input
                    type="email"
                    className="sheets-input"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      {t.tenantRole || 'Role'}
                    </label>
                    <select
                      className="sheets-select"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      {t.statusLabel || 'Status'}
                    </label>
                    <select
                      className="sheets-select"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PAUSED">PAUSED</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {t.tenantBalance || 'Balance (USD)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="sheets-input sheets-input-code"
                    value={editBalance}
                    onChange={(e) => setEditBalance(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {t.passwordOptional || 'New Password (optional, min 6 chars)'}
                  </label>
                  <input
                    type="password"
                    className="sheets-input"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep unchanged"
                  />
                </div>
              </div>

              <div className="sheets-modal-footer">
                <button
                  type="button"
                  className="sheets-btn"
                  onClick={handleCloseEdit}
                  disabled={saving}
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="sheets-btn sheets-btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (t.saveChanges || 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.UsersView = UsersView;
}

export default UsersView;
