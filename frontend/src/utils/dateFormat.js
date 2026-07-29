import dayjs from 'dayjs';

/** Human-friendly display only — never used for any calculation (backend owns that). */
export function formatDateTime(value) {
  if (!value) return '—';
  return dayjs(value).format('DD MMM YYYY, HH:mm');
}

export function formatDate(value) {
  if (!value) return '—';
  return dayjs(value).format('DD MMM YYYY');
}
