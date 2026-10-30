# Lotus Campus

Lotus Campus is a focused campus platform for university students in Azerbaijan. It brings university groups, courses, schedules, events, deadlines, messaging, and an AI study assistant into one calm workspace.

## What is included

- Home dashboard with schedule, deadlines, courses, feed, groups, and events
- University feed with posts, reactions, reporting, and a post composer
- Student-to-student messaging with blocking and reporting controls
- University groups with public discovery and university-restricted joining
- Course catalog, personal classes, course materials, and course detail pages
- Daily, weekly, and monthly schedule views
- Events and RSVP flows
- AI Assistant with saved fallback behavior
- Profile, onboarding, appearance, messaging privacy, and account settings

The current product does not include grades, attendance, an online library, partners, a separate study-plan page, or to-do items. Groups is the current name for the former Community feature.

## Technology

- Plain HTML, CSS, and JavaScript in `campus-app/public/`
- Cloudflare Pages Functions in `campus-app/functions/api/`
- Supabase Auth, Postgres, Row Level Security, and Storage
- Gemini and Cloudflare Workers AI through server-side helpers only
- No frontend build step

## Repository layout

```text
campus-app/
├── public/              # Pages, styles, icons, and browser scripts
├── functions/api/       # Cloudflare Pages API endpoints
├── lib/                 # Shared server helpers
├── scripts/             # Catalog generators and plain Node tests
├── supabase/schema.sql  # Database schema reference
└── docs/                # Roadmap and audit documentation
```

## Local development

Serve `campus-app/public/` with any static HTTP server and configure the Pages Functions environment when testing authenticated or data-backed flows. The app is intentionally dependency-light and does not require a build command.

## Cloudflare Pages deployment

Create a Cloudflare Pages project connected to this repository with:

- Build command: none
- Output directory: `campus-app/public`

Configure the server-side environment variables in the Cloudflare dashboard:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_PUBLISHABLE_KEY
GEMINI_API_KEY
```

The Workers AI binding is named `AI`. Keep all keys and service credentials out of client files and Git.

## Supabase setup

For a new environment, run `campus-app/supabase/schema.sql` in the Supabase SQL Editor, then configure the required environment variables in Cloudflare Pages. Keep Row Level Security enabled. The server-side service role is used only inside Pages Functions.

## Checks

From `campus-app/`, run the repository’s plain Node checks as needed:

```sh
node scripts/test-catalog.js
node scripts/test-dates.js
node scripts/test-plan.js
```

Additional feature-specific checks live in `campus-app/scripts/`. JavaScript files can be syntax-checked with `node --check`.

## Legal and security notes

The privacy notice and terms pages are drafts for legal review. Do not treat them as final legal advice. See `campus-app/AGENTS.md` for the project’s security, design, deployment, and scope rules.
