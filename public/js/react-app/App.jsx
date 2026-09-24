import React, { useState, useEffect, useCallback } from 'react';
import { OTP88_I18N } from './i18n.js';
import { apiJson, LANG_KEY, TAB_KEY } from './api.js';
import { getTabFromPath, getPathFromTab, getAuthModeFromPath, normalizeTab, TABS } from './routes.js';
import useAuth from './hooks/useAuth.js';
import useMetrics from './hooks/useMetrics.js';
import useConsoleData from './hooks/useConsoleData.js';
import { APP_VERSION } from './version.js';
import DashboardView from './DashboardView.jsx';
import ServicesView from './ServicesView.jsx';
import ApiView from './ApiView.jsx';
import WebhooksView from './WebhooksView.jsx';
import WebhookLogsView from './WebhookLogsView.jsx';
import BillingView from './BillingView.jsx';
import UsersView from './UsersView.jsx';
import RatesView from './RatesView.jsx';
import AuthView from './AuthView.jsx';
import LogsView from './LogsView.jsx';
import AdminOtpLogsView from './AdminOtpLogsView.jsx';
import AdminApiView from './AdminApiView.jsx';
import AdminBillingView from './AdminBillingView.jsx';
import Sms360View from './Sms360View.jsx';
import WhatsAppOtpView from './WhatsAppOtpView.jsx';
import EmailOtpView from './EmailOtpView.jsx';
import SidebarView from './SidebarView.jsx';
import PageLoader from './PageLoader.jsx';
import BrandLogo from './BrandLogo.jsx';

const TAB_TITLES = {
  dashboard: (t) => t.navDashboard,
  logs: (t) => t.navLogs,
  services: (t) => t.navServices,
  rates: (t, isAdmin) => (isAdmin ? t.navAdminRates : t.navRates) || 'Rates',
  api: (t) => t.navApi || 'API & Keys',
  webhooks: (t) => t.navWebhooks || 'Webhooks',
  'webhook-logs': (t) => t.navWebhookLogs || 'Webhook Delivery Logs',
  billing: (t) => t.navBilling || 'Billing & Top-up',
  users: (t) => t.navUsers || 'Manage Users',
  sms360: (t) => t.navSmsOtp || 'SMS OTP',
  'whatsapp-otp': (t) => t.navWhatsAppOtp || 'WhatsApp OTP',
  'email-otp': (t) => t.navEmailOtp || 'Email OTP'
};

export default function App() {
  // --- Language & toast ---
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(LANG_KEY) || 'en'; } catch (e) { return 'en'; }
  });
  const t = OTP88_I18N[lang] || OTP88_I18N.en;
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
  }, []);

  const switchLanguage = (next) => {
    setLang(next);
    try { localStorage.setItem(LANG_KEY, next); } catch (e) { /* ignore */ }
    showToast(next === 'zh' ? '已切换至简体中文' : 'Switched to English');
  };

  // --- Navigation ---
  const [activeTab, _setActiveTab] = useState('dashboard');

  const navigateToTab = useCallback((tab, role, replace = false) => {
    const id = normalizeTab(tab, role);
    _setActiveTab(id);
    try { localStorage.setItem(TAB_KEY, id); } catch (e) { /* ignore */ }
    const targetPath = getPathFromTab(id, role);
    if (window.location.pathname !== targetPath) {
      if (replace) window.history.replaceState({ tab: id }, '', targetPath);
      else window.history.pushState({ tab: id }, '', targetPath);
    }
  }, []);

  // --- Session ---
  const auth = useAuth({
    lang,
    showToast,
    onSignedIn: (user) => {
      const fromUrl = getTabFromPath(window.location.pathname);
      let saved = null;
      try { saved = localStorage.getItem(TAB_KEY); } catch (e) { /* ignore */ }
      navigateToTab(fromUrl || saved || 'dashboard', user.role, true);
    },
    onSignedOut: () => _setActiveTab('dashboard')
  });
  const { session, setSession, jwtToken } = auth;
  const isAdmin = session?.role === 'ADMIN';
  const setActiveTab = useCallback((tab) => navigateToTab(tab, session?.role), [navigateToTab, session?.role]);

  // Restore the tab from the URL (or the last visited tab) when a session already exists
  useEffect(() => {
    if (!session) return;
    const fromUrl = getTabFromPath(window.location.pathname);
    let saved = null;
    try { saved = localStorage.getItem(TAB_KEY); } catch (e) { /* ignore */ }
    navigateToTab(fromUrl || saved || 'dashboard', session.role, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Browser back / forward
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      if (session) {
        const tab = getTabFromPath(path);
        if (tab) _setActiveTab(normalizeTab(tab, session.role));
      } else {
        auth._setAuthMode(getAuthModeFromPath(path));
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [session, auth]);

  // --- Data ---
  const metrics = useMetrics({ jwtToken, setSession });
  const data = useConsoleData({ jwtToken, session, setSession, showToast, lang });

  // Refresh logs and metrics when switching tabs so figures are current
  useEffect(() => {
    if (!jwtToken) return;
    data.fetchLogs();
    metrics.fetchMetrics();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Console is light; the sign-in screen is dark
  useEffect(() => {
    document.body.className = session ? 'theme-light' : 'theme-dark';
    document.documentElement.setAttribute('data-theme', session ? 'light' : 'dark');
  }, [session]);

  // --- Backend reachability indicator ---
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const res = await fetch('/api/health', { signal: controller.signal, cache: 'no-store' });
        clearTimeout(timer);
        if (!cancelled) setIsBackendOnline(res.ok);
      } catch (e) {
        if (!cancelled) setIsBackendOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 15000);
    const onOffline = () => setIsBackendOnline(false);
    window.addEventListener('online', check);
    window.addEventListener('offline', onOffline);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('online', check);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // --- Test send from the Services tab ---
  const [simPhone, setSimPhone] = useState('+60123456789');
  const [simChannel, setSimChannel] = useState('whatsapp');
  const [sendingTest, setSendingTest] = useState(false);

  const handleSendTestOtp = async () => {
    setSendingTest(true);
    try {
      const { data: result } = await apiJson('/v1/otp/send', {
        method: 'POST',
        body: JSON.stringify({ to: simPhone, channel: simChannel, senderName: 'OTP88' })
      });
      if (result.success) {
        showToast(`${t.dispatched || 'Sent'} ${result.otpCode} via ${result.channelUsed} (${result.latency})`);
        data.fetchLogs();
        metrics.fetchMetrics();
        auth.fetchUserProfile();
      } else {
        showToast(result.error || 'Send failed', 'error');
      }
    } catch (e) {
      showToast('Could not reach the server', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => showToast(`${label} ${t.copied || 'copied'}`));
  };

  const tabTitle = (TAB_TITLES[activeTab] || TAB_TITLES.dashboard)(t, isAdmin);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {toast.show && (
        <div className={`toast show ${toast.type === 'error' ? 'toast-error' : ''}`}>
          {toast.type === 'error' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}

      {auth.initialBooting && (
        <PageLoader message={lang === 'zh' ? '正在启动 OTP88 控制台...' : 'Loading OTP88 console...'} />
      )}

      {!session ? (
        <>
          <header style={{ padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#fff', fontSize: '20px', fontWeight: '800' }}>
                <BrandLogo size={32} idPrefix="header" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>OTP<span className="text-gradient">88</span></span>
                  <span className="version-badge">{APP_VERSION}</span>
                </div>
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <a href="/" className="auth-header-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                  {t.backToHome || 'Back to Home'}
                </a>
                <div className="auth-lang-switch">
                  <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => switchLanguage('en')}>EN</button>
                  <button type="button" className={lang === 'zh' ? 'active' : ''} onClick={() => switchLanguage('zh')}>中文</button>
                </div>
              </div>
            </div>
          </header>

          <main className="auth-page-wrapper">
            <AuthView
              t={t}
              lang={lang}
              authMode={auth.authMode}
              setAuthMode={auth.setAuthMode}
              username={auth.username}
              setUsername={auth.setUsername}
              password={auth.password}
              setPassword={auth.setPassword}
              phoneNumber={auth.phoneNumber}
              setPhoneNumber={auth.setPhoneNumber}
              showPassword={auth.showPassword}
              setShowPassword={auth.setShowPassword}
              handleLogin={auth.handleLogin}
              handleRegister={auth.handleRegister}
              handleResetPasswordSendOtp={auth.handleResetPasswordSendOtp}
              handleResetPasswordVerify={auth.handleResetPasswordVerify}
              resetStep={auth.resetStep}
              setResetStep={auth.setResetStep}
              resetOtpCode={auth.resetOtpCode}
              setResetOtpCode={auth.setResetOtpCode}
              newPassword={auth.newPassword}
              setNewPassword={auth.setNewPassword}
              loading={auth.loading}
              errorMessage={auth.errorMessage}
            />
          </main>
        </>
      ) : (
        <div className="sheets-app-layout">
          <SidebarView
            t={t}
            lang={lang}
            switchLanguage={switchLanguage}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            session={session}
            logsCount={data.logs.length}
            usersCount={data.usersList.length}
            handleLogout={() => auth.signOut()}
          />

          <section className="sheets-main-viewport">
            <header className="sheets-top-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{tabTitle}</span>
                <span style={{ color: 'var(--border-subtle)' }}>|</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isAdmin ? 'Admin Panel' : 'Developer Console'}</span>
              </div>
            </header>

            <div style={{ padding: '10px', flex: 1 }}>
              {activeTab === 'dashboard' && (
                <DashboardView
                  t={t}
                  session={session}
                  adminMetrics={metrics.metrics}
                  ratesList={data.ratesList}
                  emailRate={data.emailRate}
                  setActiveTab={setActiveTab}
                  logs={data.logs}
                  usersList={data.usersList}
                  loading={data.loadingLogs || metrics.loading}
                  fromDate={metrics.fromDate}
                  toDate={metrics.toDate}
                  onDateRangeChange={metrics.changeDateRange}
                />
              )}

              {activeTab === 'logs' && (isAdmin
                ? <AdminOtpLogsView t={t} jwtToken={jwtToken} showToast={showToast} usersList={data.usersList} />
                : <LogsView t={t} logs={data.logs} loading={data.loadingLogs} />
              )}

              {activeTab === 'services' && (
                <ServicesView
                  t={t}
                  ratesList={data.ratesList}
                  emailRate={data.emailRate}
                  simPhone={simPhone}
                  setSimPhone={setSimPhone}
                  simChannel={simChannel}
                  setSimChannel={setSimChannel}
                  handleSendTestOtp={handleSendTestOtp}
                  loading={sendingTest}
                />
              )}

              {activeTab === 'rates' && (
                <RatesView
                  t={t}
                  ratesList={data.ratesList}
                  session={session}
                  handleSaveRate={data.saveRates}
                  loading={data.loadingRates || data.savingRates}
                />
              )}

              {activeTab === 'api' && (isAdmin
                ? <AdminApiView t={t} usersList={data.usersList} session={session} loading={data.loadingUsers} copyToClipboard={copyToClipboard} showToast={showToast} />
                : <ApiView t={t} session={session} setSession={setSession} jwtToken={jwtToken} copyToClipboard={copyToClipboard} showToast={showToast} />
              )}

              {activeTab === 'webhooks' && (
                <WebhooksView
                  t={t}
                  session={session}
                  setSession={setSession}
                  jwtToken={jwtToken}
                  copyToClipboard={copyToClipboard}
                  showToast={showToast}
                  onNavigateToLogs={() => setActiveTab('webhook-logs')}
                />
              )}

              {activeTab === 'webhook-logs' && (
                <WebhookLogsView
                  t={t}
                  session={session}
                  jwtToken={jwtToken}
                  copyToClipboard={copyToClipboard}
                  showToast={showToast}
                  onBack={() => setActiveTab('webhooks')}
                />
              )}

              {activeTab === 'billing' && (isAdmin
                ? <AdminBillingView t={t} usersList={data.usersList} jwtToken={jwtToken} showToast={showToast} refreshUsers={data.fetchUsers} />
                : <BillingView t={t} session={session} setSession={setSession} jwtToken={jwtToken} showToast={showToast} ratesList={data.ratesList} />
              )}

              {activeTab === 'users' && isAdmin && (
                <UsersView
                  t={t}
                  usersList={data.usersList}
                  loading={data.loadingUsers}
                  handleCreateUser={data.createUser}
                  handleUpdateUser={data.updateUser}
                  handleDeleteUser={data.deleteUser}
                  copyToClipboard={copyToClipboard}
                />
              )}

              {activeTab === 'sms360' && isAdmin && <Sms360View t={t} jwtToken={jwtToken} showToast={showToast} />}
              {activeTab === 'whatsapp-otp' && isAdmin && <WhatsAppOtpView t={t} jwtToken={jwtToken} showToast={showToast} />}
              {activeTab === 'email-otp' && isAdmin && <EmailOtpView t={t} jwtToken={jwtToken} showToast={showToast} />}
            </div>

            <footer className="sheets-status-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: isBackendOnline ? '#10B981' : '#EF4444', flexShrink: 0 }} />
                <span style={{ fontWeight: 500, color: isBackendOnline ? '#10B981' : '#EF4444' }}>
                  {isBackendOnline ? (t.statusOnline || 'Connected') : (t.statusOffline || 'Server unreachable')}
                </span>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>{APP_VERSION}</span>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}


export { TABS };
