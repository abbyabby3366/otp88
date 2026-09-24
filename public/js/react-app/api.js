// Shared HTTP helper for the console. Adds the session token, and signals
// the app when the session has expired so every view behaves the same way.

export const SESSION_KEY = 'otp88_session';
export const TOKEN_KEY = 'otp88_jwt';
export const TAB_KEY = 'otp88_active_tab';
export const LANG_KEY = 'otp88_console_lang';

const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register', '/api/auth/reset-password'];

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch (e) {
    return '';
  }
}

export function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function writeSession(session, token) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
    if (token !== undefined) {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    // Storage unavailable (private mode); the session lives in memory only
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TAB_KEY);
  } catch (e) {
    // ignore
  }
}

/**
 * fetch() with the console session token attached. A 401 from any non-auth API
 * endpoint dispatches an `auth:expired` event that the app listens for.
 */
export async function apiFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  const hasAuth = Object.keys(headers).some(h => h.toLowerCase() === 'authorization');
  const token = getToken();
  if (!hasAuth && token) headers.Authorization = `Bearer ${token}`;
  if (options.body && typeof options.body === 'string' && !Object.keys(headers).some(h => h.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });

  const isAuthEndpoint = AUTH_ENDPOINTS.some(p => url.startsWith(p));
  if (response.status === 401 && url.startsWith('/api/') && !isAuthEndpoint) {
    let message = 'Your session has expired. Please sign in again.';
    try {
      const data = await response.clone().json();
      if (data && data.error) message = data.error;
    } catch (e) {
      // keep the default message
    }
    window.dispatchEvent(new CustomEvent('auth:expired', { detail: { message } }));
  }
  return response;
}

/**
 * apiFetch() that also parses JSON. Returns { ok, status, data }.
 */
export async function apiJson(url, options = {}) {
  const response = await apiFetch(url, options);
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = { success: false, error: `Unexpected response (HTTP ${response.status})` };
  }
  return { ok: response.ok, status: response.status, data };
}
