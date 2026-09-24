// Date and number formatting shared by every console view. All dates are shown
// in the browser's local timezone.

const pad = (n) => String(n).padStart(2, '0');

export function formatDateTime(val) {
  if (!val) return '-';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) return trimmed;
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      const d = new Date();
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${trimmed}`;
    }
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Splits a timestamp into { date, time } for two-line table cells.
 */
export function splitDateTime(val) {
  if (!val) return { date: '—', time: '' };
  const d = new Date(val);
  if (isNaN(d.getTime())) return { date: String(val), time: '' };
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  };
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function firstOfMonthIso() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

export function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatUsd(value, digits = 4) {
  const n = Number(value);
  if (value === null || value === undefined || isNaN(n)) return '—';
  return `$${n.toFixed(digits)}`;
}

// Placeholder shown wherever a metric is not available yet
export const EMPTY = '—';
