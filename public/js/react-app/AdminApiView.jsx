import React, { useState } from 'react';

// Admin Multi-Tenant API Keys & Credentials Directory View
function AdminApiView({ t, usersList = [], session, copyToClipboard, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = usersList.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.apiKeyLive && u.apiKeyLive.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* User API Keys Directory */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ background: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>USER API KEYS DIRECTORY ({filteredUsers.length} Users)</span>
          
          <input
            type="text"
            className="sheets-input sheets-input-code"
            placeholder="Search user or key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '200px', padding: '4px 8px', fontSize: '11px' }}
          />
        </div>

        <table className="sheets-table">
          <thead>
            <tr>
              <th style={{ width: '35px' }}>#</th>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Live API Key</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((usr, idx) => {
                let keyVal = usr.apiKeyLive || 'otp88_api_88a90184bcedf41';
                if (keyVal.startsWith('otp_live_')) keyVal = 'otp88_api_' + keyVal.slice(9);
                return (
                  <tr key={usr._id || idx}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '10px' }}>{idx + 1}</td>
                    <td><strong>{usr.name || usr.email}</strong></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{usr.email}</td>
                    <td>
                      <span className={`sheets-badge ${usr.role === 'ADMIN' ? 'sheets-badge-purple' : 'sheets-badge-blue'}`}>
                        {usr.role || 'USER'}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontFamily: 'var(--font-code)', fontWeight: '700', fontSize: '11px', background: '#F1F5F9', padding: '2px 6px', borderRadius: '3px' }}>
                        {keyVal}
                      </code>
                    </td>
                    <td style={{ fontFamily: 'var(--font-code)', fontWeight: '700', color: '#059669' }}>
                      ${(usr.balanceUsd || 0).toFixed(2)}
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
                          style={{ padding: '2px 8px', fontSize: '10px', fontWeight: '600' }}
                          onClick={() => copyToClipboard(keyVal, `${usr.name || 'User'}'s API Key`)}
                          title="Copy API Key"
                        >
                          Copy Key
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

if (typeof window !== 'undefined') {
  window.AdminApiView = AdminApiView;
}

export default AdminApiView;
