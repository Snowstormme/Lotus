# Instructions for coding agents (Codex, etc.)

## Product
Campus app for university students in Azerbaijan. Phase 2 is complete. Full spec: `docs/roadmap.md` (copy of the roadmap delivered separately).

## Rules
- Do NOT build grades, attendance, or the online library.
- Never put API keys in client code. Gemini and Workers AI calls happen only in Cloudflare Pages Functions and shared helpers.
- Never send personal identifiers (name, email, student ID) to any AI. Send only course names, deadline titles, dates, and free hours.
- Every AI feature needs a saved fallback so the demo still works.
- Stack: Cloudflare Pages Functions in `functions/api/`, shared server helpers in `lib/`, Supabase (Postgres, Auth, and Storage) as the database, and plain HTML/CSS/JS in `public/` with no build step. The assistant uses Gemini and Cloudflare Workers AI.
- Keep dependencies minimal. Ask before adding a new one.
- Keep changes small. One feature per pull request. Explain what you changed and how to test it.

## Design rules
- Use only the reusable classes and CSS custom-property tokens defined in `public/style.css`.
- Do not add inline styles or new colors without adding a matching design token to `public/style.css`.
- Build mobile-first layouts that work at 360px width; use the existing responsive utilities for larger screens.
- Add a visible label for every form input and preserve the shared focus outline and 44px tap-target minimum.
- Every data view must include a readable loading state, empty state, and error state where applicable.

The `config` function is the only function allowed to return a key, and it may return only the Supabase publishable key. Never return service-role, Gemini, or other secret keys.

## Decisions

- Email confirmation is disabled for this project and will stay disabled. Do not re-enable it or add email verification steps without an explicit request from the owner.

## Deployment

Deploy on Cloudflare Pages. Connect the GitHub repository, leave the build command empty, set the output directory to public. Add these environment variables under Settings > Environment variables for Production and Preview: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PUBLISHABLE_KEY, GEMINI_API_KEY.

## Folder layout
- `functions/api/`: one Cloudflare Pages Function per HTTP endpoint
- `lib/`: shared Supabase, authentication, matching, date, and AI helpers
- `supabase/schema.sql`: database schema reference
- `scripts/`: plain Node test and catalog-import scripts
- `public/`: frontend pages

## Current scope

Phase 2 is complete. The launch-security audit is in `docs/launch-audit.md`. The cost estimate feature was removed.

## Done means
- The Cloudflare Pages Functions and static frontend deploy from a clean clone with no build step.
- No console errors on the page you changed.
- No secrets committed (`.env` is in `.gitignore`).
