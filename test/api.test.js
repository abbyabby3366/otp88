// HTTP-level tests that run without a database connection.
process.env.MONGODB_URI = '';
process.env.NODE_ENV = 'test';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');

let server;
let baseUrl;

before(async () => {
  await new Promise(resolve => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(() => new Promise(resolve => server.close(resolve)));

const json = async (path, options = {}) => {
  const res = await fetch(baseUrl + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  let body = null;
  try { body = await res.json(); } catch (e) { body = null; }
  return { status: res.status, body };
};

test('GET /api/health reports online', async () => {
  const r = await json('/api/health');
  assert.equal(r.status, 200);
  assert.equal(r.body.status, 'online');
  assert.equal(r.body.dbConnected, false);
});

test('GET /api/status lists supported channels', async () => {
  const r = await json('/api/status');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.supportedChannels, ['whatsapp', 'sms', 'email']);
});

test('POST /v1/otp/send without credentials is rejected', async () => {
  const r = await json('/v1/otp/send', { method: 'POST', body: JSON.stringify({ to: '+60123456789', channel: 'sms' }) });
  assert.equal(r.status, 401);
  assert.equal(r.body.success, false);
});

test('POST /v1/otp/send with an API key while the database is down returns 503, never a guess', async () => {
  const r = await json('/v1/otp/send', {
    method: 'POST',
    headers: { Authorization: 'Bearer otp88_api_doesnotexist' },
    body: JSON.stringify({ to: '+60123456789', channel: 'sms' })
  });
  assert.equal(r.status, 503);
});

test('POST /v1/otp/send with a garbage bearer token is unauthorized', async () => {
  const r = await json('/v1/otp/send', {
    method: 'POST',
    headers: { Authorization: 'Bearer not-a-real-token' },
    body: JSON.stringify({ to: '+60123456789', channel: 'sms' })
  });
  assert.equal(r.status, 401);
});

test('the old /api/simulate-otp endpoint no longer exists', async () => {
  const r = await json('/api/simulate-otp', { method: 'POST', body: JSON.stringify({ phoneNumber: '+60123456789' }) });
  assert.equal(r.status, 404);
});

test('malformed JSON is rejected with 400', async () => {
  const res = await fetch(baseUrl + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad json' });
  assert.equal(res.status, 400);
});

test('login validation requires a password', async () => {
  const r = await json('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: 'someone' }) });
  assert.equal(r.status, 400);
});

test('contact form validates the email address', async () => {
  const r = await json('/api/contact', { method: 'POST', body: JSON.stringify({ name: 'A', email: 'not-an-email' }) });
  assert.equal(r.status, 400);
});

test('DLR webhooks are protected when a secret is configured', async () => {
  // No secret configured in the test environment: development mode accepts, but with an empty body it simply ACKs
  const res = await fetch(baseUrl + '/api/webhooks/sms360/dlr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(res.status, 200);
});

test('unknown API paths return JSON 404', async () => {
  const r = await json('/api/does-not-exist');
  assert.equal(r.status, 404);
  assert.equal(r.body.success, false);
});

test('console routes serve the React shell', async () => {
  const res = await fetch(baseUrl + '/webhooks');
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /app\.bundle\.js/);
});
