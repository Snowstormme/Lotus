// Both surfaces use the same local image and initials fallback.
export function renderUniversityLogo(container, name, logoUrl, size = 28) {
  container.replaceChildren();
  container.hidden = !name;
  if (!name) return;
  container.title = name;
  const fallback = document.createElement('span');
  fallback.textContent = name.trim().split(/\s+/)[0].slice(0, 3).toUpperCase();
  fallback.setAttribute('aria-label', name);
  container.appendChild(fallback);
  if (typeof logoUrl !== 'string' || !logoUrl.startsWith('/img/universities/') || /\.\.|\/\/|http|[\\\\%?#\s]/i.test(logoUrl)) return;
  const image = document.createElement('img');
  image.alt = name;
  image.loading = 'lazy';
  image.width = size;
  image.height = size;
  image.className = 'university-logo-image';
  image.addEventListener('load', function () { fallback.hidden = true; });
  image.addEventListener('error', function () { image.remove(); fallback.hidden = false; });
  image.src = logoUrl;
  container.appendChild(image);
}
