import React, { useState, useEffect, useRef } from 'react';

// Admin Users Management Spreadsheet View
function UsersView({
  t,
  usersList = [],
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
  copyToClipboard,
  newUserName,
  setNewUserName,
  newUserEmail,
  setNewUserEmail,
  newUserBalance,
  setNewUserBalance
}) {
  const [editingUser, setEditingUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editBalance, setEditBalance] = useState('50');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const backdropMouseDownRef = useRef(false);
  const addBackdropMouseDownRef = useRef(false);

  useEffect(() => {
    if (!editingUser && !showAddModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (editingUser) handleCloseEdit();
        if (showAddModal && !creating) setShowAddModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingUser, showAddModal, creating]);

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
    setDeleting(false);
  };

  const handleBackdropMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      backdropMouseDownRef.current = true;
    } else {
      backdropMouseDownRef.current = false;
    }
  };

  const handleBackdropMouseUp = (e) => {
    if (backdropMouseDownRef.current && e.target === e.currentTarget) {
      handleCloseEdit();
    }
    backdropMouseDownRef.current = false;
  };

  const handleDeleteClick = async () => {
    if (!editingUser || !handleDeleteUser) return;
    const confirmMsg = t.deleteUserConfirm || `Are you sure you want to delete user "${editingUser.name || editingUser.email}"? This action cannot be undone.`;
    if (window.confirm(confirmMsg)) {
      setDeleting(true);
      const success = await handleDeleteUser(editingUser._id);
      setDeleting(false);
      if (success) {
        setEditingUser(null);
      }
    }
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
      {/* Top Header Bar with Users Directory Title and Add User Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
            {t.usersTitle || 'USERS DIRECTORY'}
          </h2>
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', background: '#F1F5F9', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: '12px' }}>
            {(t.totalUsers || 'Total Users')}: {usersList.length}
          </span>
        </div>
        <button
          type="button"
          className="sheets-btn sheets-btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '600' }}
          onClick={() => setShowAddModal(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t.addUser || 'Add User'}
        </button>
      </div>

      {/* Users Spreadsheet Grid */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
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
        <div
          className="sheets-modal-backdrop"
          onMouseDown={handleBackdropMouseDown}
          onMouseUp={handleBackdropMouseUp}
        >
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

              <div className="sheets-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="sheets-btn sheets-btn-danger"
                  onClick={handleDeleteClick}
                  disabled={saving || deleting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', fontSize: '11px', fontWeight: '600' }}
                  title={t.deleteUser || 'Delete User'}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  {deleting ? (t.deleting || 'Deleting...') : (t.deleteUser || 'Delete User')}
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="sheets-btn"
                    onClick={handleCloseEdit}
                    disabled={saving || deleting}
                  >
                    {t.cancel || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="sheets-btn sheets-btn-primary"
                    disabled={saving || deleting}
                  >
                    {saving ? (t.saving || 'Saving...') : (t.saveChanges || 'Save Changes')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal Dialog */}
      {showAddModal && (
        <div
          className="sheets-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              addBackdropMouseDownRef.current = true;
            } else {
              addBackdropMouseDownRef.current = false;
            }
          }}
          onMouseUp={(e) => {
            if (addBackdropMouseDownRef.current && e.target === e.currentTarget && !creating) {
              setShowAddModal(false);
            }
            addBackdropMouseDownRef.current = false;
          }}
        >
          <div className="sheets-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="sheets-modal-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                {t.addUserTitle || 'Add New User'}
              </span>
              <button
                type="button"
                onClick={() => !creating && setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setCreating(true);
              const success = await handleCreateUser(e);
              setCreating(false);
              if (success !== false) {
                setShowAddModal(false);
              }
            }}>
              <div className="sheets-modal-body">
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {t.tenantName || 'User Name'}
                  </label>
                  <input
                    type="text"
                    className="sheets-input"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder={t.placeholderName || 'e.g. John Doe / dev_user'}
                    autoFocus
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
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder={t.placeholderEmail || 'user@example.com'}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {t.tenantBalance || 'Balance (USD)'}
                  </label>
                  <input
                    type="number"
                    step="10"
                    className="sheets-input sheets-input-code"
                    value={newUserBalance}
                    onChange={(e) => setNewUserBalance(e.target.value)}
                  />
                </div>
              </div>

              <div className="sheets-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="sheets-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={creating}
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="sheets-btn sheets-btn-primary"
                  disabled={creating}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {creating ? (t.creating || 'Creating...') : `+ ${t.addUser || 'Add User'}`}
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
