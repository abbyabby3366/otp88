import React from 'react';

// Clean Auth Component (Sign In / Register / Reset)
export default function AuthView({
  t,
  lang,
  switchLanguage,
  authMode,
  setAuthMode,
  username,
  setUsername,
  password,
  setPassword,
  phoneNumber,
  setPhoneNumber,
  showPassword,
  setShowPassword,
  handleLogin,
  handleRegister,
  handleResetPasswordSendOtp,
  handleResetPasswordVerify,
  resetStep,
  setResetStep,
  resetOtpCode,
  setResetOtpCode,
  newPassword,
  setNewPassword,
  loading,
  errorMessage
}) {
  return (
    <div className="auth-card" style={{ maxWidth: '440px', width: '100%', padding: '36px 32px' }}>
      
      {/* Brand Logo & Heading */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="authCardBrandGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
              <linearGradient id="authCardShieldBg" x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#050811" />
              </linearGradient>
              <linearGradient id="authCardBoltGrad" x1="14" y1="8" x2="26" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="60%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>
            </defs>
            <path d="M20 3L35 8.5V19.5C35 28.2 28.6 34.5 20 37C11.4 34.5 5 28.2 5 19.5V8.5L20 3Z" fill="url(#authCardShieldBg)" stroke="url(#authCardBrandGrad)" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M20 5V35" stroke="url(#authCardBrandGrad)" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="2 2"/>
            <path d="M7 19.5H33" stroke="url(#authCardBrandGrad)" strokeWidth="1" strokeOpacity="0.15"/>
            <path d="M21.5 8.5L13 20H19.5L17.5 30.5L27 18H20.5L21.5 8.5Z" fill="url(#authCardBoltGrad)" stroke="#060913" strokeWidth="0.8" strokeLinejoin="round"/>
            <circle cx="21.5" cy="8.5" r="1.5" fill="#34D399"/>
            <circle cx="27" cy="18" r="1.5" fill="#38BDF8"/>
            <circle cx="17.5" cy="30.5" r="1.5" fill="#818CF8"/>
          </svg>
          <span style={{ fontSize: '24px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>
            OTP<span className="text-gradient">88</span>
          </span>
        </div>
        <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
          {authMode === 'forgot'
            ? (lang === 'zh' ? '重置密码' : 'Reset Password')
            : authMode === 'register'
            ? (lang === 'zh' ? '创建账号' : 'Create Account')
            : (lang === 'zh' ? '登录账号' : 'Sign In')}
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
          {authMode === 'forgot'
            ? (lang === 'zh' ? '通过手机验证码重置密码' : 'Reset your password via phone OTP verification')
            : (lang === 'zh' ? 'OTP88 管理控制台' : 'OTP88 Management Portal')}
        </p>
      </div>

      {/* Mode Switch Tabs (Sign In / Register) */}
      {authMode !== 'forgot' && (
        <div className="auth-tab-group" style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => setAuthMode('login')}
          >
            {t.signInTab || (lang === 'zh' ? '登录' : 'Sign In')}
          </button>
          <button
            type="button"
            className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => setAuthMode('register')}
          >
            {t.registerTab || (lang === 'zh' ? '注册' : 'Create Account')}
          </button>
        </div>
      )}

      {/* Error Message Box */}
      {errorMessage && (
        <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#F43F5E', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* FORGOT PASSWORD FORM (PHONE OTP) */}
      {authMode === 'forgot' ? (
        <form onSubmit={resetStep === 1 ? handleResetPasswordSendOtp : handleResetPasswordVerify}>
          <div className="auth-input-group">
            <label className="auth-label">
              {lang === 'zh' ? '注册手机号' : 'Phone Number'}
            </label>
            <input
              type="tel"
              className="auth-input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+60123456789"
              disabled={resetStep === 2}
              autoFocus
              required
            />
          </div>

          {resetStep === 2 && (
            <>
              <div className="auth-input-group">
                <label className="auth-label">
                  {lang === 'zh' ? '6位验证码' : '6-Digit OTP Code'}
                </label>
                <input
                  type="text"
                  maxLength="6"
                  className="auth-input"
                  value={resetOtpCode}
                  onChange={(e) => setResetOtpCode(e.target.value)}
                  placeholder="123456"
                  style={{ fontFamily: 'var(--font-code)', fontSize: '16px', letterSpacing: '4px', textAlign: 'center' }}
                  autoFocus
                  required
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  {lang === 'zh' ? '新密码 (至少6位)' : 'New Password (min 6 chars)'}
                </label>
                <input
                  type="password"
                  className="auth-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '700', marginTop: '8px' }}
          >
            {loading ? 'Processing...' : resetStep === 1 ? (lang === 'zh' ? '发送验证码' : 'Send Code') : (lang === 'zh' ? '重置密码并登录' : 'Reset Password & Sign In')}
          </button>

          <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '16px' }}>
            <a
              href="#login"
              onClick={(e) => { e.preventDefault(); setAuthMode('login'); setResetStep(1); }}
              style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            >
              ← {lang === 'zh' ? '返回登录' : 'Back to Sign In'}
            </a>
          </div>
        </form>
      ) : (
        /* SIGN IN & REGISTER FORM */
        <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
          
          <div className="auth-input-group">
            <label className="auth-label">
              {t.usernameLabel || (lang === 'zh' ? '用户名或邮箱' : 'Username or Email')}
            </label>
            <input
              type="text"
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user@example.com"
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          {authMode === 'register' && (
            <div className="auth-input-group">
              <label className="auth-label">
                {t.phoneLabel || (lang === 'zh' ? '手机号码' : 'Phone Number')}
              </label>
              <input
                type="tel"
                className="auth-input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+60123456789"
                required
              />
            </div>
          )}

          <div className="auth-input-group" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="auth-label" style={{ margin: 0 }}>
                {t.passwordLabel || (lang === 'zh' ? '密码' : 'Password')}
              </label>
              {authMode === 'login' && (
                <a
                  href="#forgot"
                  onClick={(e) => { e.preventDefault(); setAuthMode('forgot'); setResetStep(1); }}
                  style={{ fontSize: '12px', color: 'var(--text-cyan)', textDecoration: 'none', fontWeight: '500' }}
                >
                  {lang === 'zh' ? '忘记密码？' : 'Forgot password?'}
                </a>
              )}
            </div>
            
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                style={{ paddingRight: '42px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 backward" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                style={{ accentColor: 'var(--primary-emerald)', cursor: 'pointer' }}
              />
              {t.showPassword || (lang === 'zh' ? '显示密码' : 'Show Password')}
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '700' }}
          >
            {loading ? 'Processing...' : (authMode === 'login' ? (t.signInBtn || 'Sign In') : (t.registerBtn || 'Create Account'))}
          </button>

          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '18px' }}>
            {authMode === 'login' ? (
              <>
                <span>{t.noAccount || "Don't have an account?"} </span>
                <a
                  href="#register"
                  onClick={(e) => { e.preventDefault(); setAuthMode('register'); }}
                  style={{ color: 'var(--text-emerald)', fontWeight: '700', textDecoration: 'none' }}
                >
                  {t.registerNowLink || (lang === 'zh' ? '立即注册' : 'Register now')}
                </a>
              </>
            ) : (
              <>
                <span>{t.haveAccount || 'Already have an account?'} </span>
                <a
                  href="#login"
                  onClick={(e) => { e.preventDefault(); setAuthMode('login'); }}
                  style={{ color: 'var(--text-emerald)', fontWeight: '700', textDecoration: 'none' }}
                >
                  {t.signInLink || (lang === 'zh' ? '登录' : 'Sign in')}
                </a>
              </>
            )}
          </div>

        </form>
      )}

    </div>
  );
}

if (typeof window !== 'undefined') {
  window.AuthView = AuthView;
}
