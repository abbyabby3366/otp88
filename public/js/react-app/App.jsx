const { useState, useEffect } = React;

function App() {
  const [session, setSession] = useState(null);
  const [jwtToken, setJwtToken] = useState('');
  
  // Clean Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & UI States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [activeTab, setActiveTab] = useState('overview');
  const [revealedApiKey, setRevealedApiKey] = useState(false);

  // Admin Rate Editor State
  const [adminMetrics, setAdminMetrics] = useState(null);
  const [editCountryCode, setEditCountryCode] = useState('MY');
  const [editRateWhatsapp, setEditRateWhatsapp] = useState('0.0075');
  const [editRateSms, setEditRateSms] = useState('0.0210');

  // Test Simulator state inside Console
  const [simPhone, setSimPhone] = useState('+60123456789');
  const [simChannel, setSimChannel] = useState('waterfall');
  const [logs, setLogs] = useState([
    { id: 'LOG_8819', to: '+60123456789', channel: 'WhatsApp', latency: '0.8s', status: 'Delivered', cost: '$0.0075', time: '2m ago' },
    { id: 'LOG_8818', to: '+6591234567', channel: 'Telegram', latency: '0.6s', status: 'Delivered', cost: '$0.0035', time: '14m ago' },
    { id: 'LOG_8817', to: '+62812345678', channel: 'Direct SMS', latency: '1.4s', status: 'Delivered', cost: '$0.0280', time: '38m ago' },
  ]);

  // Handle SPA routing & Session verification on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('otp88_session');
    const savedToken = localStorage.getItem('otp88_jwt');
    if (savedUser && savedToken) {
      try {
        const userObj = JSON.parse(savedUser);
        setSession(userObj);
        setJwtToken(savedToken);
        if (window.location.pathname.includes('login')) {
          window.history.replaceState(null, '', '/dashboard');
        }
      } catch (e) {
        localStorage.removeItem('otp88_session');
        localStorage.removeItem('otp88_jwt');
      }
    } else {
      if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('admin')) {
        window.history.replaceState(null, '', '/login');
      }
    }
  }, []);

  // Fetch Admin Metrics if role is ADMIN
  useEffect(() => {
    if (session && session.role === 'ADMIN' && jwtToken) {
      fetch('/api/admin/metrics', {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) setAdminMetrics(data.metrics);
      })
      .catch(() => {});
    }
  }, [session, jwtToken]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Please enter your username and password.');
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
        
        // Update URL from /login to /dashboard in the browser address bar
        window.history.pushState(null, '', '/dashboard');
        showToast(`Welcome back, ${data.user.name || data.user.email}!`);
      } else {
        setErrorMessage(data.error || 'Invalid username or password.');
      }
    } catch (err) {
      setErrorMessage('Unable to connect to the authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('otp88_session');
    localStorage.removeItem('otp88_jwt');
    setSession(null);
    setJwtToken('');
    setUsername('');
    setPassword('');
    setErrorMessage('');
    
    // Update URL back to /login in the browser address bar
    window.history.pushState(null, '', '/login');
    showToast('You have been signed out.');
  };

  const handleUpdateRates = async () => {
    if (!jwtToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          countryCode: editCountryCode,
          whatsapp: editRateWhatsapp,
          sms: editRateSms
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Rates updated for ${editCountryCode}!`);
      } else {
        showToast(data.error || 'Failed to update rates', 'error');
      }
    } catch (err) {
      showToast('Error updating rates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied to clipboard!`);
    });
  };

  const handleSimulateQuickOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: simPhone,
          channel: simChannel,
          senderId: 'OTP88_AUTH'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Dispatched OTP ${data.otpCode} (${data.latency})!`);
        const newLog = {
          id: 'LOG_' + Math.floor(1000 + Math.random() * 9000),
          to: simPhone,
          channel: simChannel.toUpperCase(),
          latency: data.latency,
          status: 'Delivered',
          cost: simChannel === 'telegram' ? '$0.0035' : simChannel === 'whatsapp' ? '$0.0075' : '$0.0210',
          time: 'Just now'
        };
        setLogs(prev => [newLog, ...prev.slice(0, 4)]);
      }
    } catch (e) {
      showToast('Simulation error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
      
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
            {session && (
              <span style={{ fontSize: '12px', color: 'var(--text-emerald)', fontWeight: '700', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                ● {session.role === 'ADMIN' ? 'Admin Live' : 'Console Active'}
              </span>
            )}
            <a href="/" className="btn btn-secondary btn-sm" style={{ fontSize: '13px', padding: '6px 14px' }}>
              ← Return to Site
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        
        {/* Toast Notification */}
        {toast.show && (
          <div className="toast show" style={{ zIndex: 9999 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={toast.type === 'success' ? '#10B981' : '#F43F5E'} strokeWidth="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{toast.message}</span>
          </div>
        )}

        {!session ? (
          /* Actual Clean Login Form */
          <div className="auth-card" style={{ maxWidth: '420px', padding: '36px 32px' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="cardBrandGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="50%" stopColor="#06B6D4" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                    <linearGradient id="cardShieldBg" x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#0F172A" />
                      <stop offset="100%" stopColor="#050811" />
                    </linearGradient>
                    <linearGradient id="cardBoltGrad" x1="14" y1="8" x2="26" y2="30" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#34D399" />
                      <stop offset="60%" stopColor="#38BDF8" />
                      <stop offset="100%" stopColor="#818CF8" />
                    </linearGradient>
                  </defs>
                  <path d="M20 3L35 8.5V19.5C35 28.2 28.6 34.5 20 37C11.4 34.5 5 28.2 5 19.5V8.5L20 3Z" fill="url(#cardShieldBg)" stroke="url(#cardBrandGrad)" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M20 5V35" stroke="url(#cardBrandGrad)" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="2 2"/>
                  <path d="M7 19.5H33" stroke="url(#cardBrandGrad)" strokeWidth="1" strokeOpacity="0.15"/>
                  <path d="M21.5 8.5L13 20H19.5L17.5 30.5L27 18H20.5L21.5 8.5Z" fill="url(#cardBoltGrad)" stroke="#060913" strokeWidth="0.8" strokeLinejoin="round"/>
                  <circle cx="21.5" cy="8.5" r="1.5" fill="#34D399"/>
                  <circle cx="27" cy="18" r="1.5" fill="#38BDF8"/>
                  <circle cx="17.5" cy="30.5" r="1.5" fill="#818CF8"/>
                </svg>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>
                  OTP<span className="text-gradient">88</span>
                </span>
              </div>
              <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-secondary)' }}>
                Sign In
              </h1>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#F43F5E', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              {/* Username Field */}
              <div className="auth-input-group">
                <label className="auth-label" htmlFor="username-input">
                  Username
                </label>
                <input
                  id="username-input"
                  type="text"
                  className="auth-input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>

              {/* Password Field */}
              <div className="auth-input-group" style={{ marginBottom: '24px' }}>
                <label className="auth-label" htmlFor="password-input">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{ paddingRight: '40px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
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

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '700' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard View (Full enterprise layout) */
          <div className="auth-card" style={{ maxWidth: '820px', width: '100%', padding: '32px' }}>
            
            {/* Dynamic Interactive Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              <span style={{ color: 'var(--text-muted)' }}>OTP88</span>
              <span>/</span>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }} 
                style={{ color: activeTab === 'overview' ? 'var(--text-emerald)' : 'var(--text-secondary)', textDecoration: 'none', fontWeight: activeTab === 'overview' ? '700' : '500' }}
              >
                {session.role === 'ADMIN' ? 'Admin Control' : 'Developer Console'}
              </a>
              {activeTab !== 'overview' && (
                <>
                  <span>/</span>
                  <span style={{ color: 'var(--text-emerald)', fontWeight: '700' }}>
                    {activeTab === 'admin-rates' && 'Manage Carrier Rates'}
                    {activeTab === 'api-keys' && 'API Credentials & Tokens'}
                    {activeTab === 'logs' && 'Live Delivery Logs'}
                  </span>
                </>
              )}
            </div>

            {/* Header inside Dashboard */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="live-dot"></span>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '800', 
                    color: session.role === 'ADMIN' ? '#F43F5E' : 'var(--text-emerald)', 
                    letterSpacing: '0.05em' 
                  }}>
                    {session.role === 'ADMIN' ? 'MASTER ADMIN CONTROL PLANE' : 'DEVELOPER CONSOLE'}
                  </span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px' }}>
                  {session.name || session.email}
                </h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ padding: '8px 16px', fontSize: '13px' }}>
                Sign Out
              </button>
            </div>

            {/* ADMIN INTERFACE */}
            {session.role === 'ADMIN' ? (
              <div>
                {/* Admin Tabs */}
                <div className="auth-tab-group" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                  <button className={`auth-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    Telemetry & Health
                  </button>
                  <button className={`auth-tab ${activeTab === 'admin-rates' ? 'active' : ''}`} onClick={() => setActiveTab('admin-rates')}>
                    Manage Rates
                  </button>
                  <button className={`auth-tab ${activeTab === 'api-keys' ? 'active' : ''}`} onClick={() => setActiveTab('api-keys')}>
                    JWT Session Key
                  </button>
                </div>

                {activeTab === 'overview' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Monthly Volume</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '6px' }}>
                          {adminMetrics?.totalMonthlyOtps || '14.8M OTPs'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-emerald)', marginTop: '2px' }}>+18.4% MoM</div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gross Volume</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-emerald)', marginTop: '6px' }}>
                          {adminMetrics?.grossMonthlyVolume || '$52,840.00'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-cyan)', marginTop: '2px' }}>Direct Carrier Pipe</div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active Tenants</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#C084FC', marginTop: '6px' }}>
                          {adminMetrics?.totalTenants || '1,420'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>MongoDB Synced</div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(11, 17, 32, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-cyan)', marginBottom: '10px' }}>
                        Live Gateway Routing Share
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', flexWrap: 'wrap' }}>
                        <span>WhatsApp: <strong style={{ color: '#25D366' }}>58%</strong></span>
                        <span>Telegram: <strong style={{ color: '#229ED9' }}>18%</strong></span>
                        <span>SMS Direct: <strong style={{ color: 'var(--text-emerald)' }}>21%</strong></span>
                        <span>Voice: <strong style={{ color: '#C084FC' }}>3%</strong></span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'admin-rates' && (
                  <div>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-cyan)', marginBottom: '12px' }}>
                      Live Carrier Rates Modifier (MongoDB & JSON)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                      <div>
                        <label className="auth-label">Country Code</label>
                        <select 
                          className="auth-input"
                          value={editCountryCode}
                          onChange={(e) => setEditCountryCode(e.target.value)}
                          style={{ padding: '10px', fontSize: '13px' }}
                        >
                          <option value="MY">Malaysia (MY)</option>
                          <option value="SG">Singapore (SG)</option>
                          <option value="ID">Indonesia (ID)</option>
                          <option value="TH">Thailand (TH)</option>
                          <option value="US">United States (US)</option>
                          <option value="GB">United Kingdom (GB)</option>
                        </select>
                      </div>

                      <div>
                        <label className="auth-label">WhatsApp ($)</label>
                        <input 
                          type="number" 
                          step="0.0001" 
                          className="auth-input" 
                          value={editRateWhatsapp} 
                          onChange={(e) => setEditRateWhatsapp(e.target.value)} 
                          style={{ padding: '10px', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label className="auth-label">Direct SMS ($)</label>
                        <input 
                          type="number" 
                          step="0.0001" 
                          className="auth-input" 
                          value={editRateSms} 
                          onChange={(e) => setEditRateSms(e.target.value)} 
                          style={{ padding: '10px', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <button className="btn btn-primary" onClick={handleUpdateRates} disabled={loading} style={{ width: '100%', padding: '10px' }}>
                      {loading ? 'Saving to Database...' : 'Save & Publish Rates to MongoDB'}
                    </button>
                  </div>
                )}

                {activeTab === 'api-keys' && (
                  <div>
                    <div className="auth-input-group">
                      <label className="auth-label">Admin Bearer JWT Token</label>
                      <textarea 
                        className="auth-input" 
                        readOnly 
                        rows={3} 
                        value={jwtToken} 
                        style={{ fontFamily: 'var(--font-code)', fontSize: '11px', resize: 'none' }}
                      />
                    </div>
                    <button className="btn btn-primary" onClick={() => copyToClipboard(jwtToken, 'Admin JWT')} style={{ width: '100%', fontSize: '13px', padding: '10px' }}>
                      Copy Full Signed JWT Token
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* USER DEVELOPER CONSOLE */
              <div>
                {/* User Tabs */}
                <div className="auth-tab-group" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                  <button className={`auth-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    Overview
                  </button>
                  <button className={`auth-tab ${activeTab === 'api-keys' ? 'active' : ''}`} onClick={() => setActiveTab('api-keys')}>
                    API Credentials
                  </button>
                  <button className={`auth-tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
                    Live Logs ({logs.length})
                  </button>
                </div>

                {/* Tab 1: Overview */}
                {activeTab === 'overview' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance Credits</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-emerald)', marginTop: '4px' }}>
                          ${(session.balanceUsd || 50).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Pay-As-You-Go</div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Direct Routes SLA</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-cyan)', marginTop: '4px' }}>
                          99.98%
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-emerald)', marginTop: '2px' }}>All Gateways Green</div>
                      </div>
                    </div>

                    {/* Quick Send Sandbox Box */}
                    <div style={{ background: 'rgba(11, 17, 32, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-cyan)', marginBottom: '12px' }}>
                        🚀 Quick Dispatch Test
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                        <input 
                          type="text" 
                          className="auth-input" 
                          value={simPhone} 
                          onChange={(e) => setSimPhone(e.target.value)} 
                          placeholder="+60123456789"
                          style={{ padding: '10px 12px', fontSize: '13px' }}
                        />
                        <select 
                          className="auth-input" 
                          value={simChannel} 
                          onChange={(e) => setSimChannel(e.target.value)}
                          style={{ padding: '10px 12px', fontSize: '13px' }}
                        >
                          <option value="waterfall">Smart Waterfall</option>
                          <option value="whatsapp">WhatsApp Direct</option>
                          <option value="telegram">Telegram Bot</option>
                          <option value="sms">Telco SS7 SMS</option>
                        </select>
                      </div>
                      <button 
                        className="btn btn-primary" 
                        onClick={handleSimulateQuickOtp}
                        disabled={loading}
                        style={{ width: '100%', fontSize: '13px', padding: '10px' }}
                      >
                        {loading ? 'Dispatching...' : 'Dispatch Live OTP Code'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 2: API Keys */}
                {activeTab === 'api-keys' && (
                  <div>
                    <div className="auth-input-group">
                      <label className="auth-label">Production Live Key</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          className="auth-input" 
                          readOnly 
                          value={revealedApiKey ? (session.apiKeyLive || 'otp_live_88a90184bcedf41') : '••••••••••••••••••••••••••••••••'} 
                          style={{ fontFamily: 'var(--font-code)', fontSize: '13px' }}
                        />
                        <button className="btn btn-secondary btn-sm" onClick={() => setRevealedApiKey(!revealedApiKey)} style={{ padding: '8px 14px', fontSize: '12px' }}>
                          {revealedApiKey ? 'Hide' : 'Reveal'}
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => copyToClipboard(session.apiKeyLive || 'otp_live_88a90184bcedf41', 'API Key')} style={{ padding: '8px 16px', fontSize: '12px' }}>
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="auth-input-group">
                      <label className="auth-label">Bearer JWT Session Token</label>
                      <textarea 
                        className="auth-input" 
                        readOnly 
                        rows={2} 
                        value={jwtToken} 
                        style={{ fontFamily: 'var(--font-code)', fontSize: '11px', resize: 'none' }}
                      />
                    </div>
                  </div>
                )}

                {/* Tab 3: Logs */}
                {activeTab === 'logs' && (
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {logs.map((log) => (
                        <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                          <div>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)', marginRight: '10px' }}>{log.to}</span>
                            <span style={{ color: 'var(--text-cyan)', background: 'rgba(6,182,212,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>{log.channel}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ color: 'var(--text-emerald)', fontFamily: 'var(--font-code)' }}>{log.latency}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{log.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom links */}
            <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '12px' }}>
              <a href="/docs.html#sandbox" className="btn btn-outline-emerald btn-sm" style={{ flex: 1, fontSize: '12px', textAlign: 'center', justifyContent: 'center' }}>
                API Docs & SDKs
              </a>
              <a href="/pricing.html" className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '12px', textAlign: 'center', justifyContent: 'center' }}>
                Pricing & Rates
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Mount the React Application to #root
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
