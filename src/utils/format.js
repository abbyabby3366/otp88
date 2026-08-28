function formatDateTime(dt) {
  if (!dt) {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }
  const d = new Date(dt);
  if (isNaN(d.getTime())) return String(dt);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function normalizePhoneNumber(phone, defaultDialCode = '60') {
  if (!phone) return '';
  const str = String(phone).trim();
  if (!str) return '';

  const hadPlus = str.startsWith('+');
  const digits = str.replace(/[^0-9]/g, '');
  if (!digits) return '';

  const cleanDefaultCode = defaultDialCode.replace(/[^0-9]/g, '') || '60';

  // 1. If already had '+', return '+' + digits
  if (hadPlus) {
    return '+' + digits;
  }

  // 2. If starts with '0' (e.g. 0122273341, 01155092049) -> convert leading 0 to defaultDialCode (e.g. +60122273341)
  if (digits.startsWith('0')) {
    const withoutZero = digits.replace(/^0+/, '');
    return '+' + cleanDefaultCode + withoutZero;
  }

  // 3. If starts with explicit country dial code
  if (
    (digits.startsWith('60') && digits.length >= 10) || // Malaysia (10-12 digits)
    (digits.startsWith('65') && digits.length === 10) || // Singapore (65 + 8 digits)
    (digits.startsWith('62') && digits.length >= 10) || // Indonesia (10-13 digits)
    (digits.startsWith('66') && digits.length >= 10) || // Thailand (10-11 digits)
    (digits.startsWith('84') && digits.length >= 10) || // Vietnam (10-11 digits)
    (digits.startsWith('63') && digits.length >= 11) || // Philippines (11-12 digits)
    (digits.startsWith('852') && digits.length === 11) || // Hong Kong (852 + 8 digits)
    (digits.startsWith('886') && digits.length >= 11) || // Taiwan (11-12 digits)
    (digits.startsWith('91') && digits.length === 12) || // India (91 + 10 digits)
    (digits.startsWith('44') && digits.length >= 11) || // UK (11-12 digits)
    (digits.startsWith('61') && digits.length >= 10) || // Australia (10-11 digits)
    (digits.startsWith('971') && digits.length >= 11) || // UAE (11-12 digits)
    (digits.startsWith('81') && digits.length >= 11) || // Japan (11-12 digits)
    (digits.startsWith('1') && digits.length === 11) // US/Canada (1 + 10 digits)
  ) {
    return '+' + digits;
  }

  // 4. Local Malaysian mobile without 0 or 60 (e.g. 122273341, 1155092049 - length 9 to 10 digits starting with 1)
  if (digits.startsWith('1') && (digits.length === 9 || digits.length === 10)) {
    return '+60' + digits;
  }

  // 5. Local Singapore mobile without 65 (e.g. 81234567, 91234567 - length 8 digits starting with 8 or 9)
  if ((digits.startsWith('8') || digits.startsWith('9')) && digits.length === 8) {
    return '+65' + digits;
  }

  // 6. Default fallback
  if (digits.length <= 10 && cleanDefaultCode) {
    return '+' + cleanDefaultCode + digits;
  }

  return '+' + digits;
}

function detectCountryCode(phone) {
  if (!phone) return 'MY';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('60')) return 'MY';
  if (clean.startsWith('65')) return 'SG';
  if (clean.startsWith('62')) return 'ID';
  if (clean.startsWith('66')) return 'TH';
  if (clean.startsWith('84')) return 'VN';
  if (clean.startsWith('63')) return 'PH';
  if (clean.startsWith('1')) return 'US';
  if (clean.startsWith('44')) return 'GB';
  if (clean.startsWith('61')) return 'AU';
  if (clean.startsWith('91')) return 'IN';
  if (clean.startsWith('971')) return 'AE';
  if (clean.startsWith('81')) return 'JP';
  if (clean.startsWith('0')) return 'MY';
  return 'MY';
}

let cachedServerIp = null;
let cachedServerIpTime = 0;

async function detectPublicIp() {
  const now = Date.now();
  if (cachedServerIp && (now - cachedServerIpTime < 60000)) {
    return cachedServerIp;
  }
  const services = [
    { url: 'https://api4.ipify.org?format=json', parse: (d) => JSON.parse(d).ip },
    { url: 'https://api.ipify.org?format=json', parse: (d) => JSON.parse(d).ip },
    { url: 'https://ifconfig.me/ip', parse: (d) => d.trim() },
    { url: 'https://api.ip.sb/jsonip', parse: (d) => JSON.parse(d).ip }
  ];
  for (const s of services) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(s.url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        const ip = s.parse(text);
        if (ip && ip.length >= 7) {
          cachedServerIp = ip;
          cachedServerIpTime = now;
          return ip;
        }
      }
    } catch (e) {}
  }
  return cachedServerIp || '127.0.0.1';
}

module.exports = {
  formatDateTime,
  detectCountryCode,
  normalizePhoneNumber,
  detectPublicIp
};
