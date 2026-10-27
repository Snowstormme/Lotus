// Presentation helpers only. No requests or account state.
export function icon(symbol, className = 'nav-icon') {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(namespace, 'use');
  use.setAttribute('href', '/img/icons.svg#' + symbol);
  svg.appendChild(use);
  return svg;
}

export function initials(name) {
  return String(name || 'Student').trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(part => part.charAt(0)).join('').toUpperCase() || 'S';
}

export function dateBadge(value, className = 'date-badge') {
  const badge = document.createElement('span');
  badge.className = className;
  const date = value == null || value === '' ? new Date(NaN) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    badge.textContent = '—';
    badge.setAttribute('aria-label', 'Date unavailable');
    return badge;
  }
  const month = document.createElement('span');
  month.textContent = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'Asia/Baku' }).format(date);
  const day = document.createElement('strong');
  day.textContent = new Intl.DateTimeFormat('en', { day: 'numeric', timeZone: 'Asia/Baku' }).format(date);
  badge.append(month, day);
  return badge;
}
