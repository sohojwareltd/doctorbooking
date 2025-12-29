export function extractYmd(value) {
  if (!value) return '';
  const s = String(value);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  return '';
}

export function formatDisplayDate(ymd, locale = 'en-US') {
  if (!ymd) return '';
  const parts = String(ymd).split('-');
  if (parts.length !== 3) return '';
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return '';

  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

export function formatDisplayFromDateLike(value, locale = 'en-US') {
  const ymd = extractYmd(value);
  return formatDisplayDate(ymd, locale);
}

export function formatTime12hFromDateTime(value, locale = 'en-US') {
  if (!value) return '';
  const s = String(value);
  // Supports: "YYYY-MM-DD HH:mm:ss" or ISO strings.
  const date = new Date(s.includes(' ') ? s.replace(' ', 'T') : s);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
