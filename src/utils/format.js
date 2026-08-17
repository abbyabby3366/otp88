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
  detectPublicIp
};
