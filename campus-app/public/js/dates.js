const BAKU_TIME_ZONE = 'Asia/Baku';

function partsFor(value, options) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', { timeZone: BAKU_TIME_ZONE, ...options }).formatToParts(date).reduce((parts, part) => {
    if (part.type !== 'literal') parts[part.type] = part.value;
    return parts;
  }, {});
}

export function getBakuDateKey(value) {
  const parts = partsFor(value, { year: 'numeric', month: '2-digit', day: '2-digit' });
  return parts ? parts.year + '-' + parts.month + '-' + parts.day : null;
}

export function formatBakuDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { timeZone: BAKU_TIME_ZONE, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}
