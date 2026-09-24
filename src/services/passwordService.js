const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = 10;
const BCRYPT_PREFIX = /^\$2[aby]\$/;

function isHashed(value) {
  return typeof value === 'string' && BCRYPT_PREFIX.test(value);
}

async function hashPassword(plain) {
  return bcrypt.hash(String(plain), BCRYPT_ROUNDS);
}

/**
 * Verifies a password against a stored value. Legacy accounts still hold plaintext
 * passwords; those are accepted once and the caller is told to re-hash them.
 * Returns { ok, needsRehash }.
 */
async function verifyPassword(plain, stored) {
  if (!stored || plain === undefined || plain === null) return { ok: false, needsRehash: false };
  if (isHashed(stored)) {
    const ok = await bcrypt.compare(String(plain), stored);
    return { ok, needsRehash: false };
  }
  const ok = String(plain) === String(stored);
  return { ok, needsRehash: ok };
}

module.exports = { hashPassword, verifyPassword, isHashed };
