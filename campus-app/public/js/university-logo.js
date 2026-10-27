const BRAND_KEY = 'lotus-university-brand';

export function readUniversityBrand() {
  try {
    const brand = JSON.parse(sessionStorage.getItem(BRAND_KEY));
    if (brand && brand.expires > Date.now() && typeof brand.owner === 'string' && typeof brand.name === 'string') return brand;
  } catch (error) { /* Storage is optional. */ }
  return null;
}

export function saveUniversityBrand(session, profile) {
  const brand = { owner: session.user.id, name: String(profile.university || '').trim(), logoUrl: profile.logo_url, expires: Date.now() + 1800000 };
  try { sessionStorage.setItem(BRAND_KEY, JSON.stringify(brand)); } catch (error) { /* Storage is optional. */ }
  window.dispatchEvent(new CustomEvent('lotus-brand-updated', { detail: brand }));
}

// Keep an already-rendered logo in place when the refreshed profile is unchanged.
export function renderUniversityLogo(container, name, logoUrl, size = 28) {
  const signature = JSON.stringify([name, logoUrl, size]);
  if (container.dataset.logoSignature === signature) return;
  container.dataset.logoSignature = signature;
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
  image.loading = 'eager';
  image.decoding = 'async';
  image.width = size;
  image.height = size;
  image.className = 'university-logo-image';
  image.addEventListener('load', function () { fallback.hidden = true; });
  image.addEventListener('error', function () { image.remove(); fallback.hidden = false; });
  image.src = logoUrl;
  container.appendChild(image);
}
