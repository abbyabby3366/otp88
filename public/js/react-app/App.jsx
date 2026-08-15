import React, { useState, useEffect } from 'react';
import { OTP88_I18N } from './i18n.js';
import DashboardView from './DashboardView.jsx';
import ServicesView from './ServicesView.jsx';
import ApiView from './ApiView.jsx';
import BillingView from './BillingView.jsx';
import UsersView from './UsersView.jsx';
import RatesView from './RatesView.jsx';
import AuthView from './AuthView.jsx';
import LogsView from './LogsView.jsx';
import OverviewView from './OverviewView.jsx';
import AdminOtpLogsView from './AdminOtpLogsView.jsx';
import SidebarView from './SidebarView.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [jwtToken, setJwtToken] = useState('');
  
  // Theme & Language
  const [theme, setTheme] = useState(() => localStorage.getItem('otp88_console_theme') || 'light');
  const [lang, setLang] = useState(() => localStorage.getItem('otp88_console_lang') || 'en');
  
  const translations = (OTP88_I18N && OTP88_I18N[lang]) ? OTP88_I18N[lang] : (window.OTP88_I18N && window.OTP88_I18N[lang] ? window.OTP88_I18N[lang] : (OTP88_I18N ? OTP88_I18N.en : {}));
  const t = translations;


  // Active Tab: Defaults to 'dashboard'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Auth Form State (Login, Registration, Password Reset)
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password Reset Flow State
  const [resetStep, setResetStep] = useState(1);
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Status & Notification
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [revealedApiKey, setRevealedApiKey] = useState(false);

  // Live Admin Metrics & Rates from MongoDB
  const [adminMetrics, setAdminMetrics] = useState(null);
  const [ratesList, setRatesList] = useState([]);
  const [editCountryCode, setEditCountryCode] = useState('MY');
  const [editRateWhatsapp, setEditRateWhatsapp] = useState('0.0075');
  const [editRateSms, setEditRateSms] = useState('0.0210');

  // Live Admin Users List from MongoDB
  const [usersList, setUsersList] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserBalance, setNewUserBalance] = useState('100');

  // Live Multi-Channel OTP Logs from MongoDB
  const [logs, setLogs] = useState([]);

  // Simulator
  const [simPhone, setSimPhone] = useState('+60123456789');
  const [simChannel, setSimChannel] = useState('waterfall');

  // Data fetching functions
  const fetchRates = () => {
    fetch('/api/rates')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setRatesList(data.data);
          if (data.data.length > 0 && !editCountryCode) {
            setEditCountryCode(data.data[0].code);
            setEditRateWhatsapp(data.data[0].whatsapp || '0.0075');
            setEditRateSms(data.data[0].sms || '0.0210');
          }
        }
      })
      .catch(() => {});
  };

  const fetchLogs = () => {
    if (!jwtToken) return;
    fetch('/api/logs', {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.logs) setLogs(data.logs);
      })
      .catch(() => {});
  };

  const fetchAdminUsers = () => {
    if (session && session.role === 'ADMIN' && jwtToken) {
      fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${jwtToken}` } })
        .then(res => res.json())
        .then(data => { if (data.success && data.users) setUsersList(data.users); })
        .catch(() => {});
    }
  };

  const fetchAdminMetrics = () => {
    if (session && session.role === 'ADMIN' && jwtToken) {
      fetch('/api/admin/metrics', { headers: { 'Authorization': `Bearer ${jwtToken}` } })
        .then(res => res.json())
        .then(data => { if (data.success && data.metrics) setAdminMetrics(data.metrics); })
        .catch(() => {});
    }
  };

  // DOM Theme Sync
  useEffect(() => {
    const active = session ? theme : 'dark';
    document.documentElement.setAttribute('data-theme', active);
    document.body.className = active === 'light' ? 'theme-light' : 'theme-dark';
  }, [theme, session]);

  // Initial rates load
  useEffect(() => {
    fetchRates();
  }, []);

  // Session Mount
  useEffect(() => {
    const savedUser = localStorage.getItem('otp88_session');
    const savedToken = localStorage.getItem('otp88_jwt');
    if (savedUser && savedToken) {
      try {
        setSession(JSON.parse(savedUser));
        setJwtToken(savedToken);
        setTheme(localStorage.getItem('otp88_console_theme') || 'light');
        if (window.location.pathname.includes('login')) {
          window.history.replaceState(null, '', '/dashboard');
        }
      } catch (e) {
        localStorage.removeItem('otp88_session');
        localStorage.removeItem('otp88_jwt');
      }
    }
  }, []);

  // Fetch live logs and admin telemetry whenever session/jwtToken changes
  useEffect(() => {
    if (jwtToken) {
      fetchLogs();
      if (session && session.role === 'ADMIN') {
        fetchAdminUsers();
        fetchAdminMetrics();
      }
    }
  }, [session, jwtToken]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
  };

  const switchLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('otp88_console_lang', newLang);
    showToast(newLang === 'zh' ? '已切换至简体中文' : 'Switched to English');
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('otp88_console_theme', next);
    showToast(`${t.themeWhite} / ${t.themeDark}`);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username.trim() || !password) {
      setErrorMessage(lang === 'zh' ? '请输入用户名和密码。' : 'Please enter username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username.trim(), password })
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.user);
        setJwtToken(data.token);
        localStorage.setItem('otp88_session', JSON.stringify(data.user));
        localStorage.setItem('otp88_jwt', data.token);
        setTheme('light');
        localStorage.setItem('otp88_console_theme', 'light');
        window.history.pushState(null, '', '/dashboard');
        showToast(`${lang === 'zh' ? '欢迎回来' : 'Welcome'}, ${data.user.name || data.user.email}!`);
      } else {
        setErrorMessage(data.error || (lang === 'zh' ? '账号或密码无效。' : 'Invalid credentials.'));
      }
    } catch (err) {
      setErrorMessage(lang === 'zh' ? '连接服务器失败。' : 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username.trim() || !password || !phoneNumber.trim()) {
      setErrorMessage(lang === 'zh' ? '请完整填写用户名、密码和手机号。' : 'Please fill in username, password, and phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: username.trim(),
          password,
          phoneNumber: phoneNumber.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.user);
        setJwtToken(data.token);
        localStorage.setItem('otp88_session', JSON.stringify(data.user));
        localStorage.setItem('otp88_jwt', data.token);
        setTheme('light');
        localStorage.setItem('otp88_console_theme', 'light');
        window.history.pushState(null, '', '/dashboard');
        showToast(lang === 'zh' ? `注册成功！欢迎加入 OTP88, ${data.user.name}` : `Welcome to OTP88, ${data.user.name}!`);
      } else {
        setErrorMessage(data.error || (lang === 'zh' ? '注册失败，请重试。' : 'Registration failed.'));
      }
    } catch (err) {
      setErrorMessage(lang === 'zh' ? '连接服务器失败。' : 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!phoneNumber.trim()) {
      setErrorMessage(lang === 'zh' ? '请输入绑定的手机号码。' : 'Please enter your registered phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setResetStep(2);
        showToast(lang === 'zh' ? `重置验证码已发送至 ${phoneNumber}` : `Reset code dispatched to ${phoneNumber}`);
        if (data.otpPreview) {
          showToast(`Sandbox Code: ${data.otpPreview}`);
        }
      } else {
        setErrorMessage(data.error || 'Failed to dispatch reset code.');
      }
    } catch (e) {
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordVerify = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!resetOtpCode.trim() || !newPassword || newPassword.length < 6) {
      setErrorMessage(lang === 'zh' ? '请输入有效验证码及至少6位的新密码。' : 'Please enter valid OTP and new password (min 6 chars).');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          otpCode: resetOtpCode.trim(),
          newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setAuthMode('login');
        setResetStep(1);
        setPassword(newPassword);
        showToast(lang === 'zh' ? '密码已成功重置，请登录！' : 'Password reset successfully! Please sign in.');
      } else {
        setErrorMessage(data.error || 'Verification failed.');
      }
    } catch (e) {
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('otp88_session');
    localStorage.removeItem('otp88_jwt');
    setSession(null);
    setJwtToken('');
    setTheme('dark');
    window.history.pushState(null, '', '/login');
    showToast(lang === 'zh' ? '已成功退出登录。' : 'Signed out.');
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => showToast(`${label} ${t.copied || 'copied'}`));
  };

  const handleTopupUser = async (userId) => {
    if (!jwtToken) return;
    try {
      const res = await fetch('/api/admin/users/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
        body: JSON.stringify({ userId, amount: 100 })
      });
      const data = await res.json();
      if (data.success) {
        showToast(lang === 'zh' ? '已为该租户充值 $100' : 'Added $100 credits to user');
        fetchAdminUsers();
      }
    } catch (e) {
      showToast('Top-up error', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
        body: JSON.stringify({
          name: newUserName.trim() || newUserEmail.split('@')[0],
          email: newUserEmail.trim(),
          role: 'USER',
          balanceUsd: parseFloat(newUserBalance) || 100.00
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewUserName('');
        setNewUserEmail('');
        showToast(lang === 'zh' ? `已创建租户: ${data.user.name}` : `Tenant created: ${data.user.name}`);
        fetchAdminUsers();
      }
    } catch (e) {
      showToast('Error creating user', 'error');
    }
  };

  const handleSimulateQuickOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulate-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {})
        },
        body: JSON.stringify({ phoneNumber: simPhone, channel: simChannel, senderId: 'OTP88' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${t.dispatched || 'Dispatched'} ${data.otpCode} (${data.latency})`);
        fetchLogs();
      }
    } catch (e) {
      showToast('Dispatch error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {toast.show && (
        <div className="toast show" style={{ zIndex: 9999, padding: '8px 14px', fontSize: '12px' }}>
          <span>{toast.message}</span>
        </div>
      )}

      {!session ? (
        <>
          {/* Minimal Clean Header */}
          <header style={{ padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#fff', fontSize: '20px', fontWeight: '800' }}>
                <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="cleanBrandGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="50%" stopColor="#06B6D4" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                    <linearGradient id="cleanShieldBg" x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#0F172A" />
                      <stop offset="100%" stopColor="#050811" />
                    </linearGradient>
                    <linearGradient id="cleanBoltGrad" x1="14" y1="8" x2="26" y2="30" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#34D399" />
                      <stop offset="60%" stopColor="#38BDF8" />
                      <stop offset="100%" stopColor="#818CF8" />
                    </linearGradient>
                  </defs>
                  <path d="M20 3L35 8.5V19.5C35 28.2 28.6 34.5 20 37C11.4 34.5 5 28.2 5 19.5V8.5L20 3Z" fill="url(#cleanShieldBg)" stroke="url(#cleanBrandGrad)" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M21.5 8.5L13 20H19.5L17.5 30.5L27 18H20.5L21.5 8.5Z" fill="url(#cleanBoltGrad)" stroke="#060913" strokeWidth="0.8" strokeLinejoin="round"/>
                </svg>
                <span>OTP<span className="text-gradient">88</span></span>
              </a>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => switchLanguage('en')}
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: lang === 'en' ? 'var(--primary-emerald)' : 'transparent',
                      color: lang === 'en' ? '#000' : 'var(--text-secondary)'
                    }}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => switchLanguage('zh')}
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: lang === 'zh' ? 'var(--primary-emerald)' : 'transparent',
                      color: lang === 'zh' ? '#000' : 'var(--text-secondary)'
                    }}
                  >
                    中文
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Auth View Area */}
          <main className="auth-page-wrapper">
            {(AuthView || window.AuthView) && (
              <AuthView
                t={t}
                lang={lang}
                switchLanguage={switchLanguage}
                authMode={authMode}
                setAuthMode={setAuthMode}
                username={username}
                setUsername={setUsername}
                password={password}
                setPassword={setPassword}
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                handleLogin={handleLogin}
                handleRegister={handleRegister}
                handleResetPasswordSendOtp={handleResetPasswordSendOtp}
                handleResetPasswordVerify={handleResetPasswordVerify}
                resetStep={resetStep}
                setResetStep={setResetStep}
                resetOtpCode={resetOtpCode}
                setResetOtpCode={setResetOtpCode}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                loading={loading}
                errorMessage={errorMessage}
              />
            )}
          </main>
        </>
      ) : (
        /* Authenticated Main App Shell with LEFT NAVIGATION BAR */
        <div className="sheets-app-layout">
          
          {/* LEFT SIDEBAR MODULAR COMPONENT */}
          {(SidebarView || window.SidebarView) && (
            <SidebarView
              t={t}
              lang={lang}
              switchLanguage={switchLanguage}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              session={session}
              logsCount={logs.length}
              usersCount={usersList.length}
              handleLogout={handleLogout}
              toggleTheme={toggleTheme}
              theme={theme}
            />
          )}

          {/* MAIN VIEWPORT */}
          <section className="sheets-main-viewport">
            <header className="sheets-top-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                  {activeTab === 'dashboard' && t.navDashboard}
                  {activeTab === 'logs' && t.navLogs}
                  {activeTab === 'services' && t.navServices}
                  {activeTab === 'api' && t.navApi}
                  {activeTab === 'billing' && t.navBilling}
                  {activeTab === 'users' && t.navUsers}
                  {activeTab === 'admin-logs' && t.navAdminOtpLogs}
                </span>
                <span style={{ color: 'var(--border-subtle)' }}>|</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enterprise Control Plane</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                <span className="sheets-badge sheets-badge-emerald">256-bit SSL</span>
                <span style={{ color: 'var(--text-muted)' }}>{t.region}</span>
              </div>
            </header>

            <div style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-code)', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--primary-emerald)', fontWeight: '700' }}>ONLINE</span>
                <span>/</span>
                <span>{activeTab}</span>
                <span>/</span>
                <span>{session.email}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                Role: <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{session.role}</span>
              </div>
            </div>

            {/* TAB CONTENT RENDERERS */}
            <div style={{ padding: '10px', flex: 1 }}>
              
              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (DashboardView || window.DashboardView) && (
                <DashboardView t={t} session={session} adminMetrics={adminMetrics} logs={logs} />
              )}

              {/* TAB 2: OTP LOGS (WITH PLATFORM FILTERS & PAGINATION) */}
              {activeTab === 'logs' && (LogsView || window.LogsView) && (
                <LogsView t={t} logs={logs} />
              )}

              {/* TAB 3: SERVICES */}
              {activeTab === 'services' && (ServicesView || window.ServicesView) && (
                <ServicesView
                  t={t}
                  ratesList={ratesList}
                  simPhone={simPhone}
                  setSimPhone={setSimPhone}
                  simChannel={simChannel}
                  setSimChannel={setSimChannel}
                  handleSimulateQuickOtp={handleSimulateQuickOtp}
                  loading={loading}
                />
              )}

              {/* TAB 4: API */}
              {activeTab === 'api' && (ApiView || window.ApiView) && (
                <ApiView
                  t={t}
                  session={session}
                  jwtToken={jwtToken}
                  revealedApiKey={revealedApiKey}
                  setRevealedApiKey={setRevealedApiKey}
                  copyToClipboard={copyToClipboard}
                  showToast={showToast}
                />
              )}

              {/* TAB 5: BILLING */}
              {activeTab === 'billing' && (BillingView || window.BillingView) && (
                <BillingView t={t} session={session} setSession={setSession} jwtToken={jwtToken} showToast={showToast} />
              )}

              {/* ADMIN ONLY: USERS TAB */}
              {activeTab === 'users' && session.role === 'ADMIN' && (UsersView || window.UsersView) && (
                <UsersView
                  t={t}
                  usersList={usersList}
                  handleCreateUser={handleCreateUser}
                  handleTopupUser={handleTopupUser}
                  copyToClipboard={copyToClipboard}
                  newUserName={newUserName}
                  setNewUserName={setNewUserName}
                  newUserEmail={newUserEmail}
                  setNewUserEmail={setNewUserEmail}
                  newUserBalance={newUserBalance}
                  setNewUserBalance={setNewUserBalance}
                />
              )}

              {/* ADMIN ONLY: ADMIN OTP AUDIT LOGS TAB */}
              {activeTab === 'admin-logs' && session.role === 'ADMIN' && (AdminOtpLogsView || window.AdminOtpLogsView) && (
                <AdminOtpLogsView t={t} jwtToken={jwtToken} showToast={showToast} />
              )}

            </div>

            {/* Bottom Status Bar */}
            <footer className="sheets-status-bar">
              <div>{t.statusReady} | {session.role} | {t.region} | {t.latency}</div>
              <div>100% Zoom | SSL 256-bit | OTP88 Platform v2.4</div>
            </footer>

          </section>
        </div>
      )}
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.App = App;
}

