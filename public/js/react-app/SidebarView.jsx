import React from 'react';
import BrandLogo from './BrandLogo.jsx';
import { APP_VERSION } from './version.js';

// Left navigation. One entry per feature; admins see extra sections.
function SidebarView({ t, lang, switchLanguage, activeTab, setActiveTab, session, logsCount, usersCount, handleLogout }) {
  const isAdmin = session.role === 'ADMIN';

  const NavItem = ({ id, label, activeIds = [id] }) => (
    <button
      type="button"
      className={`sheets-nav-item ${activeIds.includes(activeTab) ? 'active' : ''}`}
      onClick={() => setActiveTab(id)}
    >
      <span>{label}</span>
    </button>
  );

  return (
    <aside className="sheets-sidebar">
      <div className="sheets-sidebar-top">
        <a href="/" className="sheets-sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
          <BrandLogo size={26} idPrefix="sidebar" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              OTP<span style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>88</span>
            </div>
            <span className="version-badge">{APP_VERSION}</span>
          </div>
        </a>

        <div className="sheets-nav-group">
          <NavItem id="dashboard" label={t.navDashboard} />

          {!isAdmin && (
            <>
              <NavItem id="logs" label={`${t.navLogs} (${logsCount})`} />
              <NavItem id="api" label={t.navApi || 'API & Keys'} />
              <NavItem id="webhooks" label={t.navWebhooks || 'Webhooks'} activeIds={['webhooks', 'webhook-logs']} />
              <NavItem id="billing" label={t.navBilling} />
              <NavItem id="services" label={t.navServices} />
            </>
          )}

          {isAdmin && (
            <>
              <div className="sheets-nav-header" style={{ marginTop: '8px' }}>{t.navAdminSection || 'ADMIN'}</div>
              <NavItem id="users" label={`${t.navUsers} (${usersCount})`} />
              <NavItem id="logs" label={t.navAdminOtpLogs || 'OTP Logs'} />
              <NavItem id="api" label={t.navAdminApi || 'API & Keys'} />
              <NavItem id="webhooks" label={t.navAdminWebhooks || 'Webhooks'} activeIds={['webhooks', 'webhook-logs']} />
              <NavItem id="billing" label={t.navAdminBilling || 'Billing & Top-up'} />

              <div className="sheets-nav-header" style={{ marginTop: '10px' }}>{t.navServicesSection || 'CHANNELS'}</div>
              <NavItem id="rates" label={t.navAdminRates || 'OTP Pricing'} />
              <NavItem id="sms360" label={t.navSmsOtp || 'SMS OTP'} />
              <NavItem id="whatsapp-otp" label={t.navWhatsAppOtp || 'WhatsApp OTP'} />
              <NavItem id="email-otp" label={t.navEmailOtp || 'Email OTP'} />
            </>
          )}
        </div>
      </div>

      <div className="sheets-sidebar-bottom">
        <div className="sheets-lang-switcher">
          <button type="button" className={`sheets-lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => switchLanguage('en')}>English</button>
          <button type="button" className={`sheets-lang-btn ${lang === 'zh' ? 'active' : ''}`} onClick={() => switchLanguage('zh')}>简体中文</button>
        </div>

        <div className="sheets-user-profile">
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, paddingRight: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={session.email}>
              {session.name || session.email}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{isAdmin ? 'Administrator' : 'Developer'}</span>
          </div>
          <button type="button" onClick={handleLogout} className="sheets-btn sheets-btn-danger" style={{ fontSize: '10px', padding: '3px 7px' }} title={t.signOut}>
            {t.signOut}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default SidebarView;
