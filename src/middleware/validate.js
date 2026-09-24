/**
 * Small request-body validator. A schema maps field names to rules:
 *   { type: 'string'|'number'|'boolean'|'object'|'array', required, min, max, minLength, maxLength,
 *     pattern, enum, trim, lowercase }
 * Unknown fields are left untouched so optional aliases keep working.
 * On failure the request gets a 400 with the first problem found.
 */
function validateBody(schema) {
  return (req, res, next) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    for (const [field, rules] of Object.entries(schema)) {
      let value = body[field];
      const isMissing = value === undefined || value === null || value === '';

      if (isMissing) {
        if (rules.required) {
          return res.status(400).json({ success: false, error: rules.message || `"${field}" is required.` });
        }
        continue;
      }

      if (rules.type === 'number') {
        const num = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(num)) return fail(res, field, 'must be a number');
        if (rules.min !== undefined && num < rules.min) return fail(res, field, `must be at least ${rules.min}`);
        if (rules.max !== undefined && num > rules.max) return fail(res, field, `must be at most ${rules.max}`);
        body[field] = num;
        continue;
      }

      if (rules.type === 'boolean') {
        if (typeof value === 'string') value = value === 'true' ? true : value === 'false' ? false : value;
        if (typeof value !== 'boolean') return fail(res, field, 'must be true or false');
        body[field] = value;
        continue;
      }

      if (rules.type === 'object') {
        if (typeof value !== 'object' || Array.isArray(value)) return fail(res, field, 'must be an object');
        continue;
      }

      if (rules.type === 'array') {
        if (!Array.isArray(value)) return fail(res, field, 'must be an array');
        continue;
      }

      // Default: string
      if (typeof value !== 'string') {
        if (typeof value === 'number') value = String(value);
        else return fail(res, field, 'must be a string');
      }
      if (rules.trim !== false) value = value.trim();
      if (rules.lowercase) value = value.toLowerCase();
      if (rules.minLength !== undefined && value.length < rules.minLength) return fail(res, field, `must be at least ${rules.minLength} characters`);
      if (rules.maxLength !== undefined && value.length > rules.maxLength) return fail(res, field, `must be at most ${rules.maxLength} characters`);
      if (rules.pattern && !rules.pattern.test(value)) return fail(res, field, rules.patternMessage || 'has an invalid format');
      if (rules.enum && !rules.enum.includes(value)) return fail(res, field, `must be one of: ${rules.enum.join(', ')}`);
      body[field] = value;
    }
    next();
  };
}

function fail(res, field, problem) {
  return res.status(400).json({ success: false, error: `"${field}" ${problem}.` });
}

// Reusable patterns
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[0-9\s\-()]{7,20}$/,
  url: /^https?:\/\/[^\s]+$/i,
  objectId: /^[0-9a-fA-F]{24}$/,
  handle: /^[a-z0-9_-]{2,32}$/i,
  otp: /^\d{4,8}$/
};

module.exports = { validateBody, PATTERNS };
