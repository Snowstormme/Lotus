# Lotus appearance

The interface uses a quiet campus editorial style: warm paper or charcoal,
restrained violet accents, thin borders, a photographic home banner, and compact
navigation. No external fonts, packages or image assets are needed.

## Themes

`public/style.css` defines the light palette in `:root`, and overrides its semantic
tokens in `:root[data-theme="dark"]`. Components use those tokens for text,
surfaces, borders, accents, feedback and controls. The home photograph has its own
white text and overlay tokens, independent of the surrounding theme.

Every HTML page loads `js/theme.js` before CSS, so the stored theme is applied
before painting. A first visit follows the operating system's preference. Settings
offers explicit Light and Dark choices; `lotus-theme` in localStorage remembers
the choice for that browser. Open tabs synchronize through the storage event.
If storage is blocked, switching still works on the current page, and the settings
status explains that persistence is unavailable. No account record is changed.

Settings is reachable from the sidebar and the top-bar settings icon, including
on phones. The mobile brand links home. Native radio inputs provide keyboard
selection and focus indication in the appearance selector.

## Components

- Cards: shared surface, fine border, 18px radius, subtle shadow. No forced
  matching heights for unrelated content or empty states.
- Typography: system font, 28–36px page titles, 16px card headings, 14px body copy.
- Navigation: 232px desktop sidebar; active route has a violet inset marker.
  Both clean Cloudflare paths and `.html` URLs resolve to the same active item.
- Controls: primary uses the theme accent and its contrasting text token;
  secondary uses the surface and neutral border. Minimum action height is 44px.
- Themes: both retain semantic loading, empty, error, hidden and disabled states.
- Motion: restrained hover feedback; reduced-motion preference disables animation.

## Verification

Run `node scripts/test-theme.js`, `node scripts/test-plan.js`,
`node scripts/test-dates.js`, and `node scripts/test-catalog.js`.

Local browser renders covered all 16 pages (including Settings) in both themes
at 360px, around the 768px breakpoint, 1280px and 1440px. Measured page/card
overflow was absent. Theme changes, reload persistence and open-tab sync were
also exercised in the browser.

These local layout previews omit data-loading scripts, so they show the actual
page markup and its loading states without connecting to production accounts.
They do not establish that populated live data or authenticated actions have
been re-tested. API requests, data handlers, SQL and headers are unchanged.
