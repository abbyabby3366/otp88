// Renders the built console bundle in jsdom and checks the sign-in screen appears.
// Catches runtime errors that a successful Vite build cannot.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const bundlePath = path.join(__dirname, '..', 'public', 'dist', 'app.bundle.js');

test('console bundle renders the sign-in screen without runtime errors', { skip: !fs.existsSync(bundlePath) && 'run `npm run build` first' }, async () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'login.html'), 'utf8').replace(/<script[^>]*app\.bundle\.js[^>]*><\/script>/, '');
  const dom = new JSDOM(html, { url: 'http://localhost:8884/login', runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  const errors = [];
  window.addEventListener('error', (e) => errors.push(e.error || e.message));
  window.fetch = async () => ({ ok: true, status: 200, json: async () => ({ success: true, data: [], logs: [], users: [] }), clone() { return this; } });
  window.EventSource = class { close() {} };

  const bundle = fs.readFileSync(bundlePath, 'utf8');
  try {
    window.eval(bundle);
  } catch (e) {
    errors.push(e);
  }
  await new Promise(r => setTimeout(r, 300));

  assert.deepEqual(errors.map(e => (e && e.message) || String(e)), [], 'no runtime errors');
  const root = window.document.getElementById('root');
  assert.ok(root && root.innerHTML.length > 0, 'root rendered something');
  assert.ok(root.querySelector('.auth-card'), 'sign-in card is visible');
  assert.ok(root.querySelector('#login-username'), 'username field is visible');
  window.close();
});

test('console bundle renders the signed-in dashboard for a stored session', { skip: !fs.existsSync(bundlePath) && 'run `npm run build` first' }, async () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'login.html'), 'utf8').replace(/<script[^>]*app\.bundle\.js[^>]*><\/script>/, '');
  const dom = new JSDOM(html, { url: 'http://localhost:8884/admin/dashboard', runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  const errors = [];
  window.addEventListener('error', (e) => errors.push(e.error || e.message));
  window.localStorage.setItem('otp88_session', JSON.stringify({ id: '507f1f77bcf86cd799439011', email: 'admin', name: 'admin', role: 'ADMIN', balanceUsd: 12.5, apiKeyLive: 'otp88_api_test' }));
  window.localStorage.setItem('otp88_jwt', 'test-token');
  window.fetch = async (url) => {
    const body = url.includes('/api/metrics')
      ? { success: true, metrics: { monthlyOtps: 3, totalOtps: 3, deliveryRate: '100.00%', avgLatency: '0.40s', balanceUsd: 12.5, totalSpentUsd: '0.0225', totalTenants: 2, channelBreakdown: {} } }
      : url.includes('/api/rates')
        ? { success: true, data: [{ country: 'Malaysia', code: 'MY', whatsapp: 0.0075, telegram: 0.0035, sms: 0.021 }], emailRate: 0.002 }
        : url.includes('/api/user/profile')
          ? { success: true, user: { id: '507f1f77bcf86cd799439011', email: 'admin', name: 'admin', role: 'ADMIN', balanceUsd: 12.5 } }
          : { success: true, data: [], logs: [], users: [] };
    return { ok: true, status: 200, json: async () => body, clone() { return this; } };
  };
  window.EventSource = class { close() {} };

  try {
    window.eval(fs.readFileSync(bundlePath, 'utf8'));
  } catch (e) {
    errors.push(e);
  }
  await new Promise(r => setTimeout(r, 400));

  assert.deepEqual(errors.map(e => (e && e.message) || String(e)), [], 'no runtime errors');
  const root = window.document.getElementById('root');
  assert.ok(root.querySelector('.sheets-sidebar'), 'sidebar rendered');
  assert.match(root.textContent, /100\.00%/, 'delivery rate from the server is shown');
  assert.match(root.textContent, /\$12\.5000/, 'balance is shown');
  assert.ok(!/99\.98%|\+18\.4%/.test(root.textContent), 'no fabricated placeholder figures');
  window.close();
});
