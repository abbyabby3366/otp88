process.env.MONGODB_URI = '';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword, isHashed } = require('../src/services/passwordService');
const { formatTenantSender } = require('../src/services/emailService');
const { buildWebhookPayload, STATUS_EVENTS } = require('../src/services/webhookService');
const { EMAIL_SENDER_DOMAIN } = require('../src/config/constants');

test('passwords are hashed with bcrypt and verified', async () => {
  const hash = await hashPassword('secret123');
  assert.ok(isHashed(hash));
  assert.notEqual(hash, 'secret123');
  assert.deepEqual(await verifyPassword('secret123', hash), { ok: true, needsRehash: false });
  assert.deepEqual(await verifyPassword('wrong', hash), { ok: false, needsRehash: false });
});

test('legacy plaintext passwords verify once and request a rehash', async () => {
  assert.deepEqual(await verifyPassword('plain', 'plain'), { ok: true, needsRehash: true });
  assert.deepEqual(await verifyPassword('other', 'plain'), { ok: false, needsRehash: false });
  assert.deepEqual(await verifyPassword('x', ''), { ok: false, needsRehash: false });
});

test('formatTenantSender builds a branded sub-alias on the platform domain', () => {
  assert.equal(formatTenantSender({ brandName: 'SuperApp', brandHandle: 'superapp' }), `SuperApp <superapp@${EMAIL_SENDER_DOMAIN}>`);
  assert.equal(formatTenantSender({ brandName: 'SuperApp', brandHandle: `superapp@${EMAIL_SENDER_DOMAIN}` }), `SuperApp <superapp@${EMAIL_SENDER_DOMAIN}>`);
  assert.equal(formatTenantSender({ brandName: 'SuperApp', brandHandle: 'Super App!' }), `SuperApp <superapp@${EMAIL_SENDER_DOMAIN}>`);
});

test('formatTenantSender never lets a caller send from a foreign domain', () => {
  const from = formatTenantSender({ brandName: 'Bank', explicitFrom: 'alerts@somebank.com' });
  assert.equal(from, `Bank <alerts@${EMAIL_SENDER_DOMAIN}>`);
});

test('formatTenantSender falls back to the default sender', () => {
  assert.equal(formatTenantSender({ defaultFrom: 'OTP88 <noreply@example.test>' }), 'OTP88 <noreply@example.test>');
  assert.equal(formatTenantSender({ brandName: 'Acme' }), `Acme <noreply@${EMAIL_SENDER_DOMAIN}>`);
});

test('webhook payload carries recipient, phoneNumber alias and USD cost', () => {
  const payload = buildWebhookPayload({
    event: STATUS_EVENTS.DELIVERED,
    msgId: 'msg_1',
    channel: 'email',
    recipient: 'user@example.com',
    status: 'DELIVERED',
    errorCode: '0',
    remark: 'login',
    cost: '0.0020'
  });
  assert.equal(payload.event, 'otp.delivered');
  assert.equal(payload.recipient, 'user@example.com');
  assert.equal(payload.phoneNumber, 'user@example.com');
  assert.equal(payload.currency, 'USD');
  assert.equal(payload.cost, '0.0020');
  assert.ok(!('latency' in payload));
  assert.ok(!isNaN(Date.parse(payload.timestamp)));
});
