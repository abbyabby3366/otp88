import { useState, useEffect, useCallback } from 'react';
import { apiJson, readSession, writeSession, clearSession, getToken } from '../api.js';
import { getAuthModeFromPath } from '../routes.js';

/**
 * Owns the signed-in session: credentials form state, sign in / register /
 * password reset, logout and automatic sign-out when the token expires.
 */
export default function useAuth({ lang, showToast, onSignedIn, onSignedOut }) {
  const [session, setSession] = useState(() => readSession());
  const [jwtToken, setJwtToken] = useState(() => getToken());
  const [initialBooting, setInitialBooting] = useState(() => !readSession());

  const [authMode, _setAuthMode] = useState(() => getAuthModeFromPath(window.location.pathname));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const zh = lang === 'zh';

  const setAuthMode = useCallback((mode) => {
    _setAuthMode(mode);
    setUsername('');
    setPassword('');
    setPhoneNumber('');
    setShowPassword(false);
    setErrorMessage('');
    const targetPath = mode === 'register' ? '/register' : mode === 'forgot' ? '/forgot' : '/login';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ authMode: mode }, '', targetPath);
    }
  }, []);

  const updateSession = useCallback((updater) => {
    setSession(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writeSession(next);
      return next;
    });
  }, []);

  const signIn = useCallback((user, token) => {
    setSession(user);
    setJwtToken(token);
    writeSession(user, token);
    if (onSignedIn) onSignedIn(user);
  }, [onSignedIn]);

  const signOut = useCallback((reason) => {
    clearSession();
    setSession(null);
    setJwtToken('');
    _setAuthMode('login');
    setResetStep(1);
    window.history.replaceState({ authMode: 'login' }, '', '/login');
    if (onSignedOut) onSignedOut();
    if (reason) {
      setErrorMessage(reason);
      if (showToast) showToast(reason, 'error');
    } else if (showToast) {
      showToast(zh ? '已成功退出登录。' : 'Signed out.');
    }
  }, [onSignedOut, showToast, zh]);

  // Refresh profile fields (balance, brand settings) from the server
  const fetchUserProfile = useCallback(async () => {
    if (!getToken()) return;
    const { ok, data } = await apiJson('/api/user/profile');
    if (ok && data.success && data.user) {
      updateSession(prev => ({ ...(prev || {}), ...data.user }));
    }
  }, [updateSession]);

  // Sign out everywhere when any request reports an expired token
  useEffect(() => {
    const onExpired = (e) => signOut(e?.detail?.message || (zh ? '登录状态已失效，请重新登录。' : 'Your session has expired. Please sign in again.'));
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [signOut, zh]);

  useEffect(() => {
    if (jwtToken) fetchUserProfile();
    setInitialBooting(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username.trim() || !password) {
      setErrorMessage(zh ? '请输入用户名/手机号和密码。' : 'Please enter your username or phone and password.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: username.trim(), password })
      });
      if (data.success) {
        signIn(data.user, data.token);
        if (showToast) showToast(`${zh ? '欢迎回来' : 'Welcome'}, ${data.user.name || data.user.email}!`);
      } else {
        setErrorMessage(data.error || (zh ? '账号或密码无效。' : 'Invalid credentials.'));
      }
    } catch (err) {
      setErrorMessage(zh ? '连接服务器失败。' : 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username.trim() || !password || !phoneNumber.trim()) {
      setErrorMessage(zh ? '请完整填写用户名、密码和手机号。' : 'Please fill in username, password, and phone number.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiJson('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password, phoneNumber: phoneNumber.trim() })
      });
      if (data.success) {
        signIn(data.user, data.token);
        if (showToast) showToast(zh ? `注册成功！欢迎加入 OTP88, ${data.user.name}` : `Welcome to OTP88, ${data.user.name}!`);
      } else {
        setErrorMessage(data.error || (zh ? '注册失败，请重试。' : 'Registration failed.'));
      }
    } catch (err) {
      setErrorMessage(zh ? '连接服务器失败。' : 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!phoneNumber.trim()) {
      setErrorMessage(zh ? '请输入绑定的手机号码。' : 'Please enter your registered phone number.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiJson('/api/auth/reset-password/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() })
      });
      if (data.success) {
        setResetStep(2);
        if (showToast) showToast(zh ? `如果号码已注册，验证码已发送至 ${phoneNumber}` : `If ${phoneNumber} is registered, a code has been sent to it.`);
      } else {
        setErrorMessage(data.error || 'Could not send the reset code.');
      }
    } catch (err) {
      setErrorMessage(zh ? '连接服务器失败。' : 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordVerify = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!resetOtpCode.trim() || !newPassword) {
      setErrorMessage(zh ? '请输入有效验证码及新密码。' : 'Please enter the code and a new password.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiJson('/api/auth/reset-password/verify', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: phoneNumber.trim(), otpCode: resetOtpCode.trim(), newPassword })
      });
      if (data.success) {
        setAuthMode('login');
        setResetStep(1);
        setResetOtpCode('');
        setNewPassword('');
        if (showToast) showToast(zh ? '密码已成功重置，请登录！' : 'Password reset. Please sign in.');
      } else {
        setErrorMessage(data.error || 'Verification failed.');
      }
    } catch (err) {
      setErrorMessage(zh ? '连接服务器失败。' : 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    setSession: updateSession,
    jwtToken,
    initialBooting,
    fetchUserProfile,
    signOut,
    authMode,
    setAuthMode,
    _setAuthMode,
    username, setUsername,
    password, setPassword,
    phoneNumber, setPhoneNumber,
    showPassword, setShowPassword,
    resetStep, setResetStep,
    resetOtpCode, setResetOtpCode,
    newPassword, setNewPassword,
    loading,
    errorMessage,
    handleLogin,
    handleRegister,
    handleResetPasswordSendOtp,
    handleResetPasswordVerify
  };
}
