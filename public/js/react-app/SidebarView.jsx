// Left Navigation Sidebar Component
function SidebarView({
  t,
  lang,
  switchLanguage,
  activeTab,
  setActiveTab,
  session,
  logsCount,
  usersCount,
  handleLogout,
  toggleTheme,
  theme
}) {
  return (
    <aside className="sheets-sidebar">
      <div className="sheets-sidebar-top">
        <a href="/" className="sheets-sidebar-brand">
          <span style={{ background: '#059669', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: '900' }}>OTP</span>
          <div style={{ fontSize: '14px', fontWeight: '800', lineHeight: 1 }}>OTP88</div>
        </a>

        {/* USER NAVIGATION TABS */}
        <div className="sheets-nav-group">
          <div className="sheets-nav-header">{t.navTitle}</div>
          
          {/* 1. Dashboard */}
          <button className={`sheets-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span>{t.navDashboard}</span>
          </button>

          {/* 2. OTP Logs */}
          <button className={`sheets-nav-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
            <span>{t.navLogs} ({logsCount})</span>
          </button>

          {/* 3. Services */}
          <button className={`sheets-nav-item ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>
            <span>{t.navServices}</span>
          </button>

          {/* 4. API */}
          <button className={`sheets-nav-item ${activeTab === 'api' ? 'active' : ''}`} onClick={() => setActiveTab('api')}>
            <span>{t.navApi}</span>
          </button>

          {/* 5. Billing */}
          <button className={`sheets-nav-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>
            <span>{t.navBilling}</span>
          </button>

          {/* ADMIN ONLY NAVIGATION SECTION */}
          {session.role === 'ADMIN' && (
            <>
              <div className="sheets-nav-header" style={{ marginTop: '10px' }}>ADMIN PLANE</div>
              
              <button className={`sheets-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                <span>{t.navUsers} ({usersCount})</span>
              </button>

              <button className={`sheets-nav-item ${activeTab === 'admin-logs' ? 'active' : ''}`} onClick={() => setActiveTab('admin-logs')}>
                <span>{t.navAdminOtpLogs}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* SIDEBAR BOTTOM: LANGUAGE, USERNAME, LOGOUT */}
      <div className="sheets-sidebar-bottom">
        <div className="sheets-lang-switcher">
          <button className={`sheets-lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => switchLanguage('en')}>
            English
          </button>
          <button className={`sheets-lang-btn ${lang === 'zh' ? 'active' : ''}`} onClick={() => switchLanguage('zh')}>
            简体中文
          </button>
        </div>

        <div className="sheets-user-profile">
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, paddingRight: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {session.name || session.email}
            </span>
            <span style={{ fontSize: '10px', color: session.role === 'ADMIN' ? '#DC2626' : '#059669', fontWeight: '700' }}>
              ● {session.role === 'ADMIN' ? t.adminLive : t.userLive}
            </span>
          </div>
          <button onClick={handleLogout} className="sheets-btn sheets-btn-danger" style={{ fontSize: '10px', padding: '3px 7px' }} title={t.signOut}>
            {t.signOut}
          </button>
        </div>
      </div>
    </aside>
  );
}

if (typeof window !== 'undefined') {
  window.SidebarView = SidebarView;
}

export default SidebarView;

