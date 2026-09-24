// Console tab <-> URL mapping. One tab id per feature; the role decides which
// component renders and whether the URL carries the /admin prefix.

export const TABS = {
  dashboard: { path: '/dashboard' },
  logs: { path: '/otp-logs' },
  api: { path: '/api' },
  webhooks: { path: '/webhooks' },
  'webhook-logs': { path: '/webhook-logs' },
  billing: { path: '/billing' },
  services: { path: '/services' },
  rates: { path: '/rates' },
  users: { path: '/users', adminOnly: true },
  sms360: { path: '/sms-otp', adminOnly: true },
  'whatsapp-otp': { path: '/whatsapp-otp', adminOnly: true },
  'email-otp': { path: '/email-otp', adminOnly: true }
};

// Older tab ids and URL aliases still stored in browsers or bookmarks
const TAB_ALIASES = {
  'admin-logs': 'logs',
  'admin-api': 'api',
  'admin-webhooks': 'webhooks',
  'admin-billing': 'billing',
  'admin-rates': 'rates'
};

const PATH_ALIASES = {
  '/otp-audit-logs': 'logs',
  '/keys': 'api',
  '/api-keys': 'api',
  '/developer': 'api',
  '/webhook': 'webhooks',
  '/webhooks/logs': 'webhook-logs',
  '/topup': 'billing',
  '/invoices': 'billing',
  '/tenants': 'users',
  '/channels': 'services',
  '/routing': 'services',
  '/pricing': 'rates',
  '/carrier-rates': 'rates',
  '/sms360': 'sms360',
  '/sms-otp': 'sms360'
};

export function normalizeTab(tab, role) {
  const id = TAB_ALIASES[tab] || tab;
  if (!TABS[id]) return 'dashboard';
  if (TABS[id].adminOnly && role !== 'ADMIN') return 'dashboard';
  return id;
}

export function getTabFromPath(pathname) {
  let clean = (pathname || '/').toLowerCase().replace(/\/$/, '') || '/';
  if (clean.startsWith('/admin')) clean = clean.slice('/admin'.length) || '/dashboard';
  if (clean === '/' || clean === '/login' || clean === '/login.html' || clean === '/console') return null;
  if (PATH_ALIASES[clean]) return PATH_ALIASES[clean];
  const match = Object.entries(TABS).find(([, cfg]) => cfg.path === clean);
  return match ? match[0] : null;
}

export function getPathFromTab(tab, role) {
  const id = normalizeTab(tab, role);
  const base = TABS[id].path;
  return role === 'ADMIN' ? `/admin${base}` : base;
}

export function getAuthModeFromPath(pathname) {
  const clean = (pathname || '').toLowerCase();
  if (clean.includes('register')) return 'register';
  if (clean.includes('forgot') || clean.includes('reset')) return 'forgot';
  return 'login';
}
