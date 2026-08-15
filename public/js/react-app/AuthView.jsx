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
        <a href="/" tabIndex={-1} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '10px', textDecoration: 'none' }} title={t.backToHome || 'Back to Home'}>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap', display: 'inline-block' }}>
              OTP<span className="text-gradient" style={{ whiteSpace: 'nowrap' }}>88</span>
            </span>
            <span style={{ fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', lineHeight: 1.2 }}>v1.0</span>
          </div>
        </a>
        {authMode === 'forgot' && (
          <>
            <h1 style={{ fontSize: '18px', fontWeight: '700', margin: '8px 0 0 0', color: 'var(--text-primary)' }}>
              {lang === 'zh' ? '重置密码' : 'Reset Password'}
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
              {lang === 'zh' ? '通过手机验证码重置密码' : 'Reset your password via phone OTP verification'}
            </p>
          </>
        )}
      </div>

      {/* Mode Switch Tabs (Sign In / Register) */}
      {authMode !== 'forgot' && (
        <div className="auth-tab-group" style={{ marginBottom: '20px' }}>
          <button
            type="button"
            tabIndex={-1}
            className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => setAuthMode('login')}
          >
            {t.signInTab || (lang === 'zh' ? '登录' : 'Sign In')}
          </button>
          <button
            type="button"
            tabIndex={-1}
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
                  {lang === 'zh' ? '新密码' : 'New Password'}
                </label>
                <input
                  type="password"
                  className="auth-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={lang === 'zh' ? '请输入新密码' : 'Enter your new password'}
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '700', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading && <div className="sheets-spinner sheets-spinner-sm" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000000' }} />}
            <span>{loading ? 'Processing...' : resetStep === 1 ? (lang === 'zh' ? '发送验证码' : 'Send Code') : (lang === 'zh' ? '重置密码并登录' : 'Reset Password & Sign In')}</span>
          </button>

          <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '16px' }}>
            <a
              href="#login"
              tabIndex={-1}
              onClick={(e) => { e.preventDefault(); setAuthMode('login'); setResetStep(1); }}
              style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            >
              ← {lang === 'zh' ? '返回登录' : 'Back to Sign In'}
            </a>
          </div>
        </form>
      ) : (
        /* SIGN IN & REGISTER FORM */
        <form
          key={authMode}
          onSubmit={authMode === 'login' ? handleLogin : handleRegister}
          autoComplete={authMode === 'register' ? 'off' : 'on'}
        >
          
          <div className="auth-input-group">
            <label className="auth-label">
              {t.usernameLabel || (lang === 'zh' ? '用户名或手机号' : 'Username or Phone')}
            </label>
            <input
              type="text"
              name={authMode === 'register' ? 'reg_username' : 'username'}
              id={authMode === 'register' ? 'reg-username' : 'login-username'}
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={authMode === 'register' ? (lang === 'zh' ? '输入用户名' : 'Enter username') : (lang === 'zh' ? '输入用户名或手机号' : 'Enter username or phone')}
              autoComplete={authMode === 'register' ? 'off' : 'username'}
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
                name="reg_phone"
                id="reg-phone"
                className="auth-input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+60123456789"
                autoComplete="off"
                required
              />
            </div>
          )}

          <div className="auth-input-group" style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="auth-label" style={{ margin: 0 }}>
                {t.passwordLabel || (lang === 'zh' ? '密码' : 'Password')}
              </label>
              {authMode === 'login' && (
                <a
                  href="#forgot"
                  tabIndex={-1}
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
                name={authMode === 'register' ? 'reg_password' : 'password'}
                id={authMode === 'register' ? 'reg-password' : 'login-password'}
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder || (lang === 'zh' ? '请输入密码' : 'Enter your password')}
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                style={{ paddingRight: '42px' }}
                required
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading && <div className="sheets-spinner sheets-spinner-sm" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000000' }} />}
            <span>{loading ? 'Processing...' : (authMode === 'login' ? (t.signInBtn || 'Sign In') : (t.registerBtn || 'Create Account'))}</span>
          </button>

          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '18px' }}>
            {authMode === 'login' ? (
              <>
                <span>{t.noAccount || "Don't have an account?"} </span>
                <a
                  href="#register"
                  tabIndex={-1}
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
                  tabIndex={-1}
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

      {/* Return to Home Landing Page */}
      <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <a
          href="/"
          tabIndex={-1}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#10B981'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          {t.backToHome || (lang === 'zh' ? '返回首页' : 'Back to Home')}
        </a>
      </div>

    </div>
  );
}

if (typeof window !== 'undefined') {
  window.AuthView = AuthView;
}
