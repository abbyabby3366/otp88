const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateBody, PATTERNS } = require('../src/middleware/validate');

function run(schema, body) {
  const req = { body };
  let status = 200;
  let payload = null;
  let nextCalled = false;
  const res = {
    status(code) { status = code; return res; },
    json(obj) { payload = obj; return res; }
  };
  validateBody(schema)(req, res, () => { nextCalled = true; });
  return { status, payload, nextCalled, body: req.body };
}

test('required fields are enforced', () => {
  const r = run({ email: { required: true } }, {});
  assert.equal(r.status, 400);
  assert.equal(r.nextCalled, false);
  assert.match(r.payload.error, /"email" is required/);
});

test('strings are trimmed, lower-cased and pattern-checked', () => {
  const ok = run({ email: { pattern: PATTERNS.email, lowercase: true } }, { email: '  User@Example.COM ' });
  assert.equal(ok.nextCalled, true);
  assert.equal(ok.body.email, 'user@example.com');

  const bad = run({ email: { pattern: PATTERNS.email, patternMessage: 'must be a valid email address' } }, { email: 'nope' });
  assert.equal(bad.status, 400);
  assert.match(bad.payload.error, /valid email/);
});

test('numbers are coerced and range-checked', () => {
  const ok = run({ amount: { type: 'number', min: 1 } }, { amount: '25.5' });
  assert.equal(ok.nextCalled, true);
  assert.equal(ok.body.amount, 25.5);

  const low = run({ amount: { type: 'number', min: 1 } }, { amount: 0 });
  assert.equal(low.status, 400);

  const nan = run({ amount: { type: 'number' } }, { amount: 'abc' });
  assert.equal(nan.status, 400);
});

test('enums and booleans are validated', () => {
  assert.equal(run({ status: { enum: ['ACTIVE', 'PAUSED'] } }, { status: 'ACTIVE' }).nextCalled, true);
  assert.equal(run({ status: { enum: ['ACTIVE', 'PAUSED'] } }, { status: 'MAYBE' }).status, 400);
  const b = run({ flag: { type: 'boolean' } }, { flag: 'true' });
  assert.equal(b.nextCalled, true);
  assert.equal(b.body.flag, true);
});

test('optional fields that are absent are skipped', () => {
  const r = run({ remark: { maxLength: 5 } }, {});
  assert.equal(r.nextCalled, true);
});

test('phone and otp patterns match expected shapes', () => {
  assert.ok(PATTERNS.phone.test('+60 12-345 6789'));
  assert.ok(!PATTERNS.phone.test('abc'));
  assert.ok(PATTERNS.otp.test('123456'));
  assert.ok(!PATTERNS.otp.test('12'));
  assert.ok(PATTERNS.objectId.test('507f1f77bcf86cd799439011'));
});
