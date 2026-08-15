import React from 'react';

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
        <a href="/" className="sheets-sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
          <svg width="26" height="26" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <defs>
              <linearGradient id="sidebarBrandGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
              <linearGradient id="sidebarShieldBg" x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#050811" />
              </linearGradient>
              <linearGradient id="sidebarBoltGrad" x1="14" y1="8" x2="26" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="60%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>
            </defs>
            <path d="M20 3L35 8.5V19.5C35 28.2 28.6 34.5 20 37C11.4 34.5 5 28.2 5 19.5V8.5L20 3Z" fill="url(#sidebarShieldBg)" stroke="url(#sidebarBrandGrad)" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M20 5V35" stroke="url(#sidebarBrandGrad)" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="2 2"/>
            <path d="M7 19.5H33" stroke="url(#sidebarBrandGrad)" strokeWidth="1" strokeOpacity="0.15"/>
            <path d="M21.5 8.5L13 20H19.5L17.5 30.5L27 18H20.5L21.5 8.5Z" fill="url(#sidebarBoltGrad)" stroke="#060913" strokeWidth="0.8" strokeLinejoin="round"/>
            <circle cx="21.5" cy="8.5" r="1.5" fill="#34D399"/>
            <circle cx="27" cy="18" r="1.5" fill="#38BDF8"/>
            <circle cx="17.5" cy="30.5" r="1.5" fill="#818CF8"/>
          </svg>
          <div style={{ fontSize: '15px', fontWeight: '800', lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary)', whiteSpace: 'nowrap', display: 'inline-block' }}>
            OTP<span style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'nowrap' }}>88</span>
          </div>
        </a>

        {/* USER NAVIGATION TABS */}
        <div className="sheets-nav-group">
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
              <div className="sheets-nav-header" style={{ marginTop: '10px' }}>ADMIN PANEL</div>
              
              <button className={`sheets-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                <span>{t.navUsers} ({usersCount})</span>
              </button>

              <button className={`sheets-nav-item ${activeTab === 'admin-logs' ? 'active' : ''}`} onClick={() => setActiveTab('admin-logs')}>
                <span>{t.navAdminOtpLogs}</span>
              </button>

              <button className={`sheets-nav-item ${activeTab === 'sms360' ? 'active' : ''}`} onClick={() => setActiveTab('sms360')}>
                <span>{t.navSms360 || 'SMS360'}</span>
              </button>

              <button className={`sheets-nav-item ${activeTab === 'whatsapp-otp' ? 'active' : ''}`} onClick={() => setActiveTab('whatsapp-otp')}>
                <span>{t.navWhatsAppOtp || 'WhatsApp OTP'}</span>
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
              {session.role === 'ADMIN' && session.name === 'System Administrator' ? (session.email || 'admin') : (session.name || session.email)}
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

