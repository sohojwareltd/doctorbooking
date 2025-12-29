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

export function formatDisplayDateWithYear(ymd, locale = 'en-US') {
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
    year: 'numeric',
  }).format(date);
}

export function formatDisplayDateWithYearFromDateLike(value, locale = 'en-US') {
  const ymd = extractYmd(value);
  return formatDisplayDateWithYear(ymd, locale);
}

export function formatDisplayTime12h(time, locale = 'en-US') {
  if (!time) return '';
  const s = String(time);
  const m = s.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!m) return '';

  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return '';

  const date = new Date(1970, 0, 1, hh, mm, 0);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatDisplayDateTimeFromYmdAndTime(ymd, time, locale = 'en-US') {
  const dateLabel = formatDisplayDateWithYear(ymd, locale);
  const timeLabel = formatDisplayTime12h(time, locale);
  if (dateLabel && timeLabel) return `${dateLabel} • ${timeLabel}`;
  return dateLabel || timeLabel || '';
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
