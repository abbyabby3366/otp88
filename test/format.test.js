const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizePhoneNumber, detectCountryCode, escapeRegex, formatDateTime } = require('../src/utils/format');

test('normalizePhoneNumber keeps international numbers and adds a plus sign', () => {
  assert.equal(normalizePhoneNumber('+60123456789'), '+60123456789');
  assert.equal(normalizePhoneNumber('60123456789'), '+60123456789');
  assert.equal(normalizePhoneNumber('+65 8123 4567'), '+6581234567');
});

test('normalizePhoneNumber converts Malaysian local formats', () => {
  assert.equal(normalizePhoneNumber('0123456789'), '+60123456789');
  assert.equal(normalizePhoneNumber('123456789'), '+60123456789');
  assert.equal(normalizePhoneNumber('01155092049'), '+601155092049');
});

test('normalizePhoneNumber converts Singapore local mobiles', () => {
  assert.equal(normalizePhoneNumber('81234567'), '+6581234567');
  assert.equal(normalizePhoneNumber('91234567'), '+6591234567');
});

test('normalizePhoneNumber returns empty string for empty input', () => {
  assert.equal(normalizePhoneNumber(''), '');
  assert.equal(normalizePhoneNumber(null), '');
  assert.equal(normalizePhoneNumber('abc'), '');
});

test('detectCountryCode maps dial codes to ISO codes', () => {
  assert.equal(detectCountryCode('+60123456789'), 'MY');
  assert.equal(detectCountryCode('+6581234567'), 'SG');
  assert.equal(detectCountryCode('+628123456789'), 'ID');
  assert.equal(detectCountryCode('+14155551234'), 'US');
  assert.equal(detectCountryCode(''), 'MY');
});

test('escapeRegex neutralises regex metacharacters', () => {
  const re = new RegExp('^' + escapeRegex('a.b*c') + '$');
  assert.ok(re.test('a.b*c'));
  assert.ok(!re.test('axbbc'));
});

test('formatDateTime renders YYYY-MM-DD HH:mm:ss and passes through invalid values', () => {
  assert.match(formatDateTime(new Date(2026, 0, 2, 3, 4, 5)), /^2026-01-02 03:04:05$/);
  assert.equal(formatDateTime('not a date'), 'not a date');
});
