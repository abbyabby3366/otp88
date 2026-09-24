process.env.MONGODB_URI = '';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseSendRequest, buildMessageText, generateOtp } = require('../src/routes/otpRoutes');
const { normalizeChannel } = require('../src/services/dispatchers');

test('normalizeChannel accepts the supported channels and their common spellings', () => {
  assert.equal(normalizeChannel('whatsapp'), 'whatsapp');
  assert.equal(normalizeChannel('WhatsApp'), 'whatsapp');
  assert.equal(normalizeChannel('sms'), 'sms');
  assert.equal(normalizeChannel('EMAIL'), 'email');
  assert.equal(normalizeChannel('telegram'), null);
  assert.equal(normalizeChannel('waterfall'), null);
  assert.equal(normalizeChannel(''), null);
});

test('parseSendRequest reads canonical camelCase fields', () => {
  const parsed = parseSendRequest({
    to: '+60123456789',
    channel: 'sms',
    otp: '123456',
    senderName: 'MyApp',
    expiryMinutes: 10,
    remark: 'login-42'
  });
  assert.equal(parsed.channel, 'sms');
  assert.equal(parsed.rawTo, '+60123456789');
  assert.equal(parsed.otp, '123456');
  assert.equal(parsed.senderName, 'MyApp');
  assert.equal(parsed.expiryMinutes, 10);
  assert.equal(parsed.remark, 'login-42');
});

test('parseSendRequest accepts documented snake_case and legacy aliases', () => {
  const parsed = parseSendRequest({
    phoneNumber: '0123456789',
    channel_strategy: 'whatsapp',
    sender_name: 'Legacy',
    code: '4321',
    expiry_seconds: 600
  });
  assert.equal(parsed.channel, 'whatsapp');
  assert.equal(parsed.rawTo, '0123456789');
  assert.equal(parsed.senderName, 'Legacy');
  assert.equal(parsed.otp, '4321');
  assert.equal(parsed.expiryMinutes, 10);
});

test('parseSendRequest infers the email channel from an email recipient', () => {
  const parsed = parseSendRequest({ to: 'user@example.com', brandName: 'SuperApp', brandHandle: 'superapp', replyTo: 'help@superapp.com' });
  assert.equal(parsed.channel, 'email');
  assert.equal(parsed.brandName, 'SuperApp');
  assert.equal(parsed.brandHandle, 'superapp');
  assert.equal(parsed.replyTo, 'help@superapp.com');
});

test('parseSendRequest falls back to a 5 minute expiry', () => {
  assert.equal(parseSendRequest({ to: '+60123456789', channel: 'sms' }).expiryMinutes, 5);
  assert.equal(parseSendRequest({ to: '+60123456789', channel: 'sms', expiryMinutes: -3 }).expiryMinutes, 5);
});

test('buildMessageText varies by channel', () => {
  assert.equal(buildMessageText({ channel: 'whatsapp', senderName: 'X', otpCode: '1111', expiryMinutes: 5 }), 'Your verification code is 1111.');
  assert.match(buildMessageText({ channel: 'sms', senderName: 'MyApp', otpCode: '2222', expiryMinutes: 5 }), /^RM0 MyApp: .*2222.*5 minutes/);
  assert.match(buildMessageText({ channel: 'email', senderName: 'MyApp', otpCode: '3333', expiryMinutes: 7 }), /MyApp.*3333.*7 minutes/);
});

test('generateOtp respects length bounds', () => {
  assert.match(generateOtp(6), /^\d{6}$/);
  assert.match(generateOtp(4), /^\d{4}$/);
  assert.match(generateOtp(2), /^\d{4}$/);
  assert.match(generateOtp(12), /^\d{8}$/);
  assert.match(generateOtp('abc'), /^\d{6}$/);
});
