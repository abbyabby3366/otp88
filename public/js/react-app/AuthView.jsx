import React from 'react';
import BrandLogo from './BrandLogo.jsx';
import { APP_VERSION } from './version.js';

// Sign in / Create account / Reset password
export default function AuthView({
  t,
  lang,
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
  const zh = lang === 'zh';

  return (
    <div className="auth-card" style={{ maxWidth: '440px', width: '100%', padding: '36px 32px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <a href="/" tabIndex={-1} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '10px', textDecoration: 'none' }} title={t.backToHome || 'Back to Home'}>
          <BrandLogo size={36} idPrefix="auth" />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              OTP<span className="text-gradient">88</span>
            </span>
            <span className="version-badge">{APP_VERSION}</span>
          </div>
        </a>
        {authMode === 'forgot' && (
          <>
            <h1 style={{ fontSize: '18px', fontWeight: '700', margin: '8px 0 0 0', color: 'var(--text-primary)' }}>
              {zh ? '重置密码' : 'Reset password'}
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
              {zh ? '我们会向您注册的手机号发送验证码' : 'We will send a verification code to your registered phone number'}
            </p>
          </>
        )}
      </div>

      {authMode !== 'forgot' && (
        <div className="auth-tab-group" style={{ marginBottom: '20px' }}>
          <button type="button" tabIndex={-1} className={`auth-tab ${authMode === 'login' ? 'active' : ''}`} onClick={() => setAuthMode('login')}>
            {t.signInTab || (zh ? '登录' : 'Sign In')}
          </button>
          <button type="button" tabIndex={-1} className={`auth-tab ${authMode === 'register' ? 'active' : ''}`} onClick={() => setAuthMode('register')}>
            {t.registerTab || (zh ? '注册' : 'Create Account')}
          </button>
        </div>
      )}

      {errorMessage && (
        <div role="alert" style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#F43F5E', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {authMode === 'forgot' ? (
        <form onSubmit={resetStep === 1 ? handleResetPasswordSendOtp : handleResetPasswordVerify}>
          <div className="auth-input-group">
            <label className="auth-label" htmlFor="reset-phone">{zh ? '注册手机号' : 'Phone number'}</label>
            <input id="reset-phone" type="tel" className="auth-input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+60123456789" disabled={resetStep === 2} autoFocus required />
          </div>

          {resetStep === 2 && (
            <>
              <div className="auth-input-group">
                <label className="auth-label" htmlFor="reset-code">{zh ? '6位验证码' : '6-digit code'}</label>
                <input id="reset-code" type="text" inputMode="numeric" maxLength="8" className="auth-input" value={resetOtpCode} onChange={(e) => setResetOtpCode(e.target.value)} placeholder="123456" style={{ fontFamily: 'var(--font-code)', fontSize: '16px', letterSpacing: '4px', textAlign: 'center' }} autoFocus required />
              </div>
              <div className="auth-input-group">
                <label className="auth-label" htmlFor="reset-new-password">{zh ? '新密码' : 'New password'}</label>
                <input id="reset-new-password" type="password" className="auth-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={zh ? '至少 6 个字符' : 'At least 6 characters'} minLength={6} autoComplete="new-password" required />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '700', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading && <div className="sheets-spinner sheets-spinner-sm" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000000' }} />}
            <span>{loading ? (zh ? '处理中…' : 'Please wait…') : resetStep === 1 ? (zh ? '发送验证码' : 'Send code') : (zh ? '重置密码' : 'Reset password')}</span>
          </button>

          <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '16px' }}>
            {resetStep === 2 && (
              <button type="button" tabIndex={-1} onClick={() => setResetStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-cyan)', cursor: 'pointer', fontSize: '13px', marginRight: '14px' }}>
                {zh ? '重新发送' : 'Send a new code'}
              </button>
            )}
            <a href="#login" tabIndex={-1} onClick={(e) => { e.preventDefault(); setAuthMode('login'); setResetStep(1); }} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              ← {zh ? '返回登录' : 'Back to sign in'}
            </a>
          </div>
        </form>
      ) : (
        <form key={authMode} onSubmit={authMode === 'login' ? handleLogin : handleRegister} autoComplete={authMode === 'register' ? 'off' : 'on'}>
          <div className="auth-input-group">
            <label className="auth-label" htmlFor={authMode === 'register' ? 'reg-username' : 'login-username'}>
              {authMode === 'register' ? (zh ? '用户名' : 'Username') : (t.usernameLabel || (zh ? '用户名或手机号' : 'Username or phone'))}
            </label>
            <input
              type="text"
              name={authMode === 'register' ? 'reg_username' : 'username'}
              id={authMode === 'register' ? 'reg-username' : 'login-username'}
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={authMode === 'register' ? (zh ? '选择一个用户名' : 'Choose a username') : (zh ? '输入用户名或手机号' : 'Enter username or phone')}
              autoComplete={authMode === 'register' ? 'off' : 'username'}
              autoFocus
              required
            />
          </div>

          {authMode === 'register' && (
            <div className="auth-input-group">
              <label className="auth-label" htmlFor="reg-phone">{t.phoneLabel || (zh ? '手机号码' : 'Phone number')}</label>
              <input type="tel" name="reg_phone" id="reg-phone" className="auth-input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+60123456789" autoComplete="tel" required />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{zh ? '用于找回密码。' : 'Used to recover your password.'}</div>
            </div>
          )}

          <div className="auth-input-group" style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="auth-label" style={{ margin: 0 }} htmlFor={authMode === 'register' ? 'reg-password' : 'login-password'}>
                {t.passwordLabel || (zh ? '密码' : 'Password')}
              </label>
              {authMode === 'login' && (
                <a href="#forgot" tabIndex={-1} onClick={(e) => { e.preventDefault(); setAuthMode('forgot'); setResetStep(1); }} style={{ fontSize: '12px', color: 'var(--text-cyan)', textDecoration: 'none', fontWeight: '500' }}>
                  {zh ? '忘记密码？' : 'Forgot password?'}
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
                placeholder={authMode === 'register' ? (zh ? '至少 6 个字符' : 'At least 6 characters') : (t.passwordPlaceholder || (zh ? '请输入密码' : 'Enter your password'))}
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                minLength={authMode === 'register' ? 6 : undefined}
                style={{ paddingRight: '42px' }}
                required
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading && <div className="sheets-spinner sheets-spinner-sm" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000000' }} />}
            <span>{loading ? (zh ? '处理中…' : 'Please wait…') : (authMode === 'login' ? (t.signInBtn || 'Sign In') : (t.registerBtn || 'Create Account'))}</span>
          </button>

          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '18px' }}>
            {authMode === 'login' ? (
              <>
                <span>{t.noAccount || "Don't have an account?"} </span>
                <a href="#register" tabIndex={-1} onClick={(e) => { e.preventDefault(); setAuthMode('register'); }} style={{ color: 'var(--text-emerald)', fontWeight: '700', textDecoration: 'none' }}>
                  {t.registerNowLink || (zh ? '立即注册' : 'Create one')}
                </a>
              </>
            ) : (
              <>
                <span>{t.haveAccount || 'Already have an account?'} </span>
                <a href="#login" tabIndex={-1} onClick={(e) => { e.preventDefault(); setAuthMode('login'); }} style={{ color: 'var(--text-emerald)', fontWeight: '700', textDecoration: 'none' }}>
                  {t.signInLink || (zh ? '登录' : 'Sign in')}
                </a>
              </>
            )}
          </div>
        </form>
      )}

      <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <a href="/" tabIndex={-1} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          {t.backToHome || (zh ? '返回首页' : 'Back to Home')}
        </a>
      </div>
    </div>
  );
}
