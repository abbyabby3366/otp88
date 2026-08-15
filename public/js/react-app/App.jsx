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
import AdminOtpLogsView from './AdminOtpLogsView.jsx';
import AdminApiView from './AdminApiView.jsx';
import AdminBillingView from './AdminBillingView.jsx';
import Sms360View from './Sms360View.jsx';
import WhatsAppOtpView from './WhatsAppOtpView.jsx';
import SidebarView from './SidebarView.jsx';
import PageLoader from './PageLoader.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [jwtToken, setJwtToken] = useState('');
  
  // Theme & Language
  const [theme, setTheme] = useState(() => localStorage.getItem('otp88_console_theme') || 'light');
  const [lang, setLang] = useState(() => localStorage.getItem('otp88_console_lang') || 'en');
  
  const translations = (OTP88_I18N && OTP88_I18N[lang]) ? OTP88_I18N[lang] : (window.OTP88_I18N && window.OTP88_I18N[lang] ? window.OTP88_I18N[lang] : (OTP88_I18N ? OTP88_I18N.en : {}));
  const t = translations;

  // Browser auto-refresh during local development
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      try {
        const es = new EventSource('/api/live-reload');
        es.onmessage = (e) => {
          if (e.data === 'reload') {
            window.location.reload();
          }
        };
        return () => es.close();
      } catch (err) {}
    }
  }, []);


  // Route Mapping Helpers
  const getTabFromPath = (path) => {
    const clean = (path || (typeof window !== 'undefined' ? window.location.pathname : '') || '/').toLowerCase().replace(/\/$/, '');
    if (clean === '/admin' || clean === '/admin/dashboard') return 'dashboard';
    if (clean === '/admin/logs' || clean === '/admin-logs' || clean === '/admin/otp-logs' || clean === '/admin/otp-audit-logs') return 'admin-logs';
    if (clean === '/logs' || clean === '/otp-logs') return 'logs';
    if (clean === '/admin/api' || clean === '/admin/keys' || clean === '/admin/api-keys') return 'admin-api';
    if (clean === '/api' || clean === '/keys' || clean === '/developer' || clean === '/api-keys') return 'api';
    if (clean === '/admin/billing' || clean === '/admin/topup' || clean === '/admin/invoices') return 'admin-billing';
    if (clean === '/billing' || clean === '/topup' || clean === '/invoices') return 'billing';
    if (clean === '/admin/users' || clean === '/users' || clean === '/tenants') return 'users';
    if (clean === '/services' || clean === '/channels' || clean === '/routing') return 'services';
    if (clean === '/admin/rates' || clean === '/admin-rates' || clean === '/rates' || clean === '/pricing' || clean === '/carrier-rates') return 'rates';
    if (clean === '/admin/sms360' || clean === '/sms360' || clean === '/admin-sms360' || clean === '/admin/sms-otp' || clean === '/sms-otp') return 'sms360';
    if (clean === '/admin/whatsapp-otp' || clean === '/whatsapp-otp' || clean === '/admin-whatsapp-otp') return 'whatsapp-otp';
    return 'dashboard';
  };

  const getPathFromTab = (tab, role = (session ? session.role : null)) => {
    switch (tab) {
      case 'logs': return role === 'ADMIN' ? '/admin/logs' : '/logs';
      case 'admin-logs': return '/admin/logs';
      case 'api': return role === 'ADMIN' ? '/admin/api' : '/api';
      case 'admin-api': return '/admin/api';
      case 'billing': return role === 'ADMIN' ? '/admin/billing' : '/billing';
      case 'admin-billing': return '/admin/billing';
      case 'users': return '/admin/users';
      case 'sms360': return '/admin/sms360';
      case 'whatsapp-otp': return '/admin/whatsapp-otp';
      case 'services': return '/services';
      case 'rates': return role === 'ADMIN' ? '/admin/rates' : '/rates';
      case 'admin-rates': return '/admin/rates';
      case 'dashboard':
      default:
        return role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
    }
  };

  const getAuthModeFromPath = (path) => {
    const clean = (path || (typeof window !== 'undefined' ? window.location.pathname : '') || '').toLowerCase();
    if (clean.includes('register')) return 'register';
    if (clean.includes('forgot') || clean.includes('reset')) return 'forgot';
    return 'login';
  };

  // Dynamic Route & Active Tab State
  const [activeTab, _setActiveTab] = useState(() => getTabFromPath(typeof window !== 'undefined' ? window.location.pathname : '/dashboard'));

  const navigateToTab = (tab, replace = false) => {
    _setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const targetPath = getPathFromTab(tab, session?.role);
      if (window.location.pathname !== targetPath) {
        if (replace) {
          window.history.replaceState({ tab }, '', targetPath);
        } else {
          window.history.pushState({ tab }, '', targetPath);
        }
      }
    }
  };

  const setActiveTab = navigateToTab;

  // Auth Form State (Login, Registration, Password Reset)
  const [authMode, _setAuthMode] = useState(() => getAuthModeFromPath(typeof window !== 'undefined' ? window.location.pathname : '/login'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const setAuthMode = (mode) => {
    _setAuthMode(mode);
    setUsername('');
    setPassword('');
    setPhoneNumber('');
    setShowPassword(false);
    setErrorMessage('');
    if (typeof window !== 'undefined') {
      const targetPath = mode === 'register' ? '/register' : mode === 'forgot' ? '/forgot' : '/login';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ authMode: mode }, '', targetPath);
      }
    }
  };

  // Password Reset Flow State
  const [resetStep, setResetStep] = useState(1);
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Status & Notification
  const [initialBooting, setInitialBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [revealedApiKey, setRevealedApiKey] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);

  // Live Admin Metrics & Rates from MongoDB
  const [adminMetrics, setAdminMetrics] = useState(null);
  const [ratesList, setRatesList] = useState([]);
  const [editCountryCode, setEditCountryCode] = useState('MY');
  const [editRateWhatsapp, setEditRateWhatsapp] = useState('0.0075');
  const [editRateTelegram, setEditRateTelegram] = useState('0.0035');
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
  const [simChannel, setSimChannel] = useState('whatsapp');

  // Data fetching functions
  const fetchRates = () => {
    setLoadingRates(true);
    fetch('/api/rates')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setRatesList(data.data);
          if (data.data.length > 0 && !editCountryCode) {
            setEditCountryCode(data.data[0].code);
            setEditRateWhatsapp(data.data[0].whatsapp ? data.data[0].whatsapp.toString() : '0.0075');
            setEditRateTelegram(data.data[0].telegram ? data.data[0].telegram.toString() : '0.0035');
            setEditRateSms(data.data[0].sms ? data.data[0].sms.toString() : '0.0210');
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRates(false));
  };

  const fetchLogs = () => {
    if (!jwtToken) return;
    setLoadingLogs(true);
    fetch('/api/logs', {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.logs) setLogs(data.logs);
      })
      .catch(() => {})
      .finally(() => setLoadingLogs(false));
  };

  const fetchAdminUsers = () => {
    if (session && session.role === 'ADMIN' && jwtToken) {
      setLoadingUsers(true);
      fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${jwtToken}` } })
        .then(res => res.json())
        .then(data => { if (data.success && data.users) setUsersList(data.users); })
        .catch(() => {})
        .finally(() => setLoadingUsers(false));
    }
  };

  const fetchAdminMetrics = () => {
    if (session && jwtToken) {
      fetch('/api/metrics', { headers: { 'Authorization': `Bearer ${jwtToken}` } })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.metrics) {
            setAdminMetrics(data.metrics);
            if (data.metrics.balanceUsd !== undefined && session.balanceUsd !== data.metrics.balanceUsd) {
              setSession(prev => {
                const updated = { ...prev, balanceUsd: data.metrics.balanceUsd };
                localStorage.setItem('otp88_session', JSON.stringify(updated));
                return updated;
              });
            }
          }
        })
        .catch(() => {});
    }
  };

  // DOM Theme Sync
  useEffect(() => {
    const active = session ? theme : 'dark';
    document.documentElement.setAttribute('data-theme', active);
    document.body.className = active === 'light' ? 'theme-light' : 'theme-dark';
  }, [theme, session]);

  // Real-time Backend Online Status Verification
  const checkBackendHealth = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/health', { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timeoutId);
      if (res.ok) {
        setIsBackendOnline(true);
      } else {
        setIsBackendOnline(false);
      }
    } catch (err) {
      setIsBackendOnline(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 10000);
    const handleOnline = () => checkBackendHealth();
    const handleOffline = () => setIsBackendOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial rates load
  useEffect(() => {
    fetchRates();
  }, []);

  // Dynamic Browser History (Back / Forward) Listener
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const tab = getTabFromPath(currentPath);
        _setActiveTab(tab);
        _setAuthMode(getAuthModeFromPath(currentPath));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchUserProfile = async (token = jwtToken) => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.user) {
        setSession(prev => {
          const merged = { ...(prev || {}), ...data.user };
          localStorage.setItem('otp88_session', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (e) {}
  };

  // Session Mount & Route Synchronization
  useEffect(() => {
    const savedUser = localStorage.getItem('otp88_session');
    const savedToken = localStorage.getItem('otp88_jwt');
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.role === 'ADMIN' && parsedUser.name === 'System Administrator') {
          parsedUser.name = parsedUser.email || 'admin';
          localStorage.setItem('otp88_session', JSON.stringify(parsedUser));
        }
        setSession(parsedUser);
        setJwtToken(savedToken);
        fetchUserProfile(savedToken);
        setTheme(localStorage.getItem('otp88_console_theme') || 'light');
        const initialTab = getTabFromPath(window.location.pathname);
        _setActiveTab(initialTab);
        if (window.location.pathname === '/' || window.location.pathname.includes('login')) {
          const defaultPath = parsedUser && parsedUser.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
          window.history.replaceState({ tab: 'dashboard' }, '', defaultPath);
        }
      } catch (e) {
        localStorage.removeItem('otp88_session');
        localStorage.removeItem('otp88_jwt');
      }
    }
    setInitialBooting(false);
  }, []);

  // Fetch live logs and admin telemetry whenever session/jwtToken changes
  useEffect(() => {
    if (jwtToken) {
      fetchLogs();
      fetchUserProfile(jwtToken);
      if (session && session.role === 'ADMIN') {
        fetchAdminUsers();
        fetchAdminMetrics();
      }
    }
  }, [jwtToken]);

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
      setErrorMessage(lang === 'zh' ? '请输入用户名/手机号和密码。' : 'Please enter username/phone and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: username.trim(), username: username.trim(), email: username.trim(), phone: username.trim(), password })
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.user);
        setJwtToken(data.token);
        localStorage.setItem('otp88_session', JSON.stringify(data.user));
        localStorage.setItem('otp88_jwt', data.token);
        setTheme('light');
        localStorage.setItem('otp88_console_theme', 'light');
        const targetTab = getTabFromPath(window.location.pathname);
        _setActiveTab(targetTab);
        const destinationPath = targetTab !== 'dashboard' ? getPathFromTab(targetTab, data.user.role) : (data.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
        window.history.pushState({ tab: targetTab }, '', destinationPath);
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
        const targetTab = getTabFromPath(window.location.pathname);
        _setActiveTab(targetTab);
        const destinationPath = targetTab !== 'dashboard' ? getPathFromTab(targetTab, data.user.role) : (data.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
        window.history.pushState({ tab: targetTab }, '', destinationPath);
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
    if (!resetOtpCode.trim() || !newPassword) {
      setErrorMessage(lang === 'zh' ? '请输入有效验证码及新密码。' : 'Please enter valid OTP and new password.');
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

  const handleUpdateUser = async (userId, updateData) => {
    if (!jwtToken) return false;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(updateData)
      });
      const data = await res.json();
      if (data.success) {
        showToast(lang === 'zh' ? '用户资料已更新' : 'User updated successfully');
        fetchAdminUsers();
        if (session && (session.id === userId || (data.user && (session.email === data.user.email || session.name === data.user.name)))) {
          const updatedSession = { ...session, ...data.user };
          setSession(updatedSession);
          localStorage.setItem('otp88_session', JSON.stringify(updatedSession));
        }
        return true;
      } else {
        showToast(data.error || 'Failed to update user', 'error');
        return false;
      }
    } catch (e) {
      showToast('Error updating user', 'error');
      return false;
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!jwtToken) return false;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast(lang === 'zh' ? '用户已成功删除' : 'User deleted successfully');
        fetchAdminUsers();
        fetchAdminMetrics();
        return true;
      } else {
        showToast(data.error || 'Failed to delete user', 'error');
        return false;
      }
    } catch (e) {
      showToast('Error deleting user', 'error');
      return false;
    }
  };

  const handleCreateUser = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newUserEmail.trim()) return false;
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
        showToast(lang === 'zh' ? `已创建用户: ${data.user.name}` : `User created: ${data.user.name}`);
        fetchAdminUsers();
        return true;
      } else {
        showToast(data.error || 'Failed to create user', 'error');
        return false;
      }
    } catch (e) {
      showToast('Error creating user', 'error');
      return false;
    }
  };

  const handleSaveRate = async () => {
    if (!jwtToken) return;
    try {
      setLoading(true);
      const isGlobal = !editCountryCode || editCountryCode === 'ALL';
      const res = await fetch('/api/admin/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          countryCode: editCountryCode || 'ALL',
          isGlobal,
          whatsapp: editRateWhatsapp,
          telegram: editRateTelegram,
          sms: editRateSms
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(lang === 'zh' ? '费率已更新' : 'Carrier rates updated successfully');
        fetchRates();
      } else {
        showToast(data.error || 'Failed to update rates', 'error');
      }
    } catch (e) {
      showToast('Error updating rates', 'error');
    } finally {
      setLoading(false);
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
        <div className={`toast show ${toast.type === 'error' ? 'toast-error' : ''}`}>
          {toast.type === 'error' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}

      {initialBooting && (
        <PageLoader message={lang === 'zh' ? '正在启动 OTP88 平台控制台...' : 'Loading OTP88 Platform Console...'} />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>OTP<span className="text-gradient">88</span></span>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', lineHeight: 1.2 }}>v1.0</span>
                </div>
              </a>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <a
                  href="/"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: 'rgba(255,255,255,0.03)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.borderColor = 'var(--primary-emerald)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                  {t.backToHome || (lang === 'zh' ? '返回首页' : 'Back to Home')}
                </a>

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
                  {activeTab === 'rates' && (t.navRates || 'Carrier Rates')}
                  {activeTab === 'api' && t.navApi}
                  {activeTab === 'billing' && t.navBilling}
                  {activeTab === 'users' && t.navUsers}
                  {activeTab === 'admin-logs' && (t.navAdminOtpLogs || 'OTP Logs')}
                  {activeTab === 'admin-api' && (t.navAdminApi || t.navApi || 'API & Keys')}
                  {activeTab === 'admin-billing' && (t.navAdminBilling || t.navBilling || 'Billing & Top-up')}
                  {activeTab === 'sms360' && (t.navSmsOtp || t.navSms360 || 'SMS OTP')}
                  {activeTab === 'whatsapp-otp' && (t.navWhatsAppOtp || 'WhatsApp OTP')}
                </span>
                <span style={{ color: 'var(--border-subtle)' }}>|</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{session.role === 'ADMIN' ? 'Admin Panel' : 'Management Portal'}</span>
              </div>
            </header>

            {/* TAB CONTENT RENDERERS */}
            <div style={{ padding: '10px', flex: 1 }}>
              
              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (DashboardView || window.DashboardView) && (
                <DashboardView
                  t={t}
                  session={session}
                  adminMetrics={adminMetrics}
                  ratesList={ratesList}
                  setActiveTab={setActiveTab}
                  logs={logs}
                  usersList={usersList}
                  loading={loadingLogs}
                />
              )}

              {/* TAB 2: OTP LOGS (USER MODE) */}
              {activeTab === 'logs' && session.role !== 'ADMIN' && (LogsView || window.LogsView) && (
                <LogsView t={t} logs={logs} loading={loadingLogs} />
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

              {/* TAB 4: CARRIER RATES & OTP PRICING */}
              {(activeTab === 'rates' || activeTab === 'admin-rates') && (RatesView || window.RatesView) && (
                <RatesView
                  t={t}
                  ratesList={ratesList}
                  session={session}
                  editCountryCode={editCountryCode}
                  setEditCountryCode={setEditCountryCode}
                  editRateWhatsapp={editRateWhatsapp}
                  setEditRateWhatsapp={setEditRateWhatsapp}
                  editRateTelegram={editRateTelegram}
                  setEditRateTelegram={setEditRateTelegram}
                  editRateSms={editRateSms}
                  setEditRateSms={setEditRateSms}
                  handleSaveRate={handleSaveRate}
                  loading={loadingRates || loading}
                />
              )}

              {/* TAB 5: API (USER MODE) */}
              {activeTab === 'api' && session.role !== 'ADMIN' && (ApiView || window.ApiView) && (
                <ApiView
                  t={t}
                  session={session}
                  revealedApiKey={revealedApiKey}
                  setRevealedApiKey={setRevealedApiKey}
                  copyToClipboard={copyToClipboard}
                  showToast={showToast}
                />
              )}

              {/* TAB 6: BILLING (USER MODE) */}
              {activeTab === 'billing' && session.role !== 'ADMIN' && (BillingView || window.BillingView) && (
                <BillingView t={t} session={session} setSession={setSession} jwtToken={jwtToken} showToast={showToast} ratesList={ratesList} />
              )}

              {/* ADMIN ONLY: USERS TAB */}
              {activeTab === 'users' && session.role === 'ADMIN' && (UsersView || window.UsersView) && (
                <UsersView
                  t={t}
                  usersList={usersList}
                  loading={loadingUsers}
                  handleCreateUser={handleCreateUser}
                  handleUpdateUser={handleUpdateUser}
                  handleDeleteUser={handleDeleteUser}
                  copyToClipboard={copyToClipboard}
                  newUserName={newUserName}
                  setNewUserName={setNewUserName}
                  newUserEmail={newUserEmail}
                  setNewUserEmail={setNewUserEmail}
                  newUserBalance={newUserBalance}
                  setNewUserBalance={setNewUserBalance}
                />
              )}

              {/* ADMIN ONLY: ALL USERS OTP LOGS TAB */}
              {(activeTab === 'admin-logs' || (activeTab === 'logs' && session.role === 'ADMIN')) && session.role === 'ADMIN' && (AdminOtpLogsView || window.AdminOtpLogsView) && (
                <AdminOtpLogsView t={t} jwtToken={jwtToken} showToast={showToast} usersList={usersList} />
              )}

              {/* ADMIN ONLY: ALL USERS API & KEYS TAB */}
              {(activeTab === 'admin-api' || (activeTab === 'api' && session.role === 'ADMIN')) && session.role === 'ADMIN' && (AdminApiView || window.AdminApiView) && (
                <AdminApiView
                  t={t}
                  usersList={usersList}
                  session={session}
                  loading={loadingUsers}
                  copyToClipboard={copyToClipboard}
                  showToast={showToast}
                />
              )}

              {/* ADMIN ONLY: ALL USERS BILLING & TOP-UP TAB */}
              {(activeTab === 'admin-billing' || (activeTab === 'billing' && session.role === 'ADMIN')) && session.role === 'ADMIN' && (AdminBillingView || window.AdminBillingView) && (
                <AdminBillingView
                  t={t}
                  usersList={usersList}
                  jwtToken={jwtToken}
                  showToast={showToast}
                  refreshUsers={fetchAdminUsers}
                />
              )}

              {/* ADMIN ONLY: SMS360 GATEWAY TAB */}
              {activeTab === 'sms360' && session.role === 'ADMIN' && (Sms360View || window.Sms360View) && (
                <Sms360View t={t} jwtToken={jwtToken} showToast={showToast} />
              )}

              {/* ADMIN ONLY: WHATSAPP OTP GATEWAY TAB */}
              {activeTab === 'whatsapp-otp' && session.role === 'ADMIN' && (WhatsAppOtpView || window.WhatsAppOtpView) && (
                <WhatsAppOtpView t={t} jwtToken={jwtToken} showToast={showToast} />
              )}

            </div>

            {/* Bottom Status Bar */}
            <footer className="sheets-status-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: isBackendOnline ? '#10B981' : '#EF4444',
                    boxShadow: isBackendOnline ? '0 0 6px rgba(16, 185, 129, 0.6)' : '0 0 6px rgba(239, 68, 68, 0.6)',
                    flexShrink: 0
                  }}
                />
                <span style={{ fontWeight: 500, color: isBackendOnline ? '#10B981' : '#EF4444' }}>
                  {isBackendOnline ? 'Status: Online' : 'Status: Offline'}
                </span>
              </div>
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

