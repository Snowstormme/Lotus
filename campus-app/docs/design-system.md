# Lotus appearance

The interface uses a campus editorial style: warm paper or charcoal, Georgia
display headings with system-font body text, restrained violet accents, fine
borders and compact navigation. The city photo fills the entire home banner.
No external fonts, packages or image assets are needed.

The primary identity is `public/img/lotus-mark.svg`: a three-petal lotus above an
open-book curve, in a violet square. It is used by every favicon, the sidebar,
mobile home link and auth pages. The previous SVG assets remain as unused fallbacks.

## Themes

`public/style.css` defines the light palette in `:root`, and overrides its semantic
tokens in `:root[data-theme="dark"]`. Components use those tokens for text,
surfaces, borders, accents, feedback and controls. The home banner and authentication
photo panels have independent white-text and overlay tokens for both themes.

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

- Cards: shared surface, fine border, 16px radius, minimal elevation. No forced
  matching heights for unrelated content or empty states.
- Typography: Georgia 34–46px page titles, system-font 16px card headings and
  14px body copy. Course and group cards have a larger 20px title.
- Navigation: 232px desktop sidebar; active route has a violet inset marker.
  Both clean Cloudflare paths and `.html` URLs resolve to the same active item.
- Controls: primary uses the theme accent and its contrasting text token;
  secondary uses the surface and neutral border. Minimum action height is 44px.
- Themes: both retain semantic loading, empty, error, hidden and disabled states.
- Motion: restrained hover feedback; reduced-motion preference disables animation.

## Verification

Run `node scripts/test-ui.js`, `node scripts/test-theme.js`, `node scripts/test-plan.js`,
`node scripts/test-dates.js`, and `node scripts/test-catalog.js`.

The local review server runs the actual frontend modules against fictional fixture
responses and a local authentication stub. It is outside the repository, never
contacts production and labels its rendered screens as test data. Populated layouts,
forms and controls are checked at 360px, around the 768px breakpoint, 1280px and
1440px in both themes. These checks do not establish that production accounts or
server-side authorization have been retested.

## Page compositions

- Home: full-width city photo masthead, five shortcuts, compact course list and dashboard.
- Feed: writing surface, clear author hierarchy, post action row and events aside.
- Messages: divided conversation workspace, initials previews and a bottom composer.
- Courses: tinted book covers, text course-code badges and a consistent open action.
- Course detail: tinted heading, segmented content views and existing upload controls.
- Groups: icon-led cards, member data and existing Join/Leave actions; creation aside.
- Events: Baku-time date badges, metadata and the existing RSVP actions.
- Schedule: agenda first, day/week/month views and the class editor below.
- Assistant: options beside the conversation, with its composer directly below.
- Profile: anchor navigation, numbered form sections and a compact availability grid.
- Onboarding: clear field hierarchy, self-reported labels and the existing course picker.
- Settings: native radio theme previews with browser-local persistence.
- Login/signup: dedicated photographic welcome panel and focused form column.
- Privacy/terms: document contents navigation with the legal draft text preserved.

Rendering helpers in `public/js/ui.js` create namespaced SVGs, text initials and
Baku-time date badges. They make no requests. Request URLs, bodies and existing
action handlers remain unchanged; button key events no longer trigger their
containing group/event card's navigation.
