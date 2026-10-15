# Instructions for coding agents (Codex, etc.)

## Product
Campus app for university students in Azerbaijan. Phase 1 is a weekend demo. Full spec: `docs/roadmap.md` (copy of the roadmap delivered separately).

## Rules
- Do NOT build grades, attendance, or the online library.
- Never put API keys in client code. Gemini calls happen only in `server/`.
- Never send personal identifiers (name, email, student ID) to any AI. Send only course names, deadline titles, dates, and free hours.
- Every AI feature needs a saved fallback so the demo still works.
- Stack: Node.js + Express, SQLite via better-sqlite3, plain HTML/CSS/JS in `public/` (no build step).
- Keep dependencies minimal. Ask before adding a new one.
- Keep changes small. One feature per pull request. Explain what you changed and how to test it.

## Design rules
- Use only the reusable classes and CSS custom-property tokens defined in `public/style.css`.
- Do not add inline styles or new colors without adding a matching design token to `public/style.css`.
- Build mobile-first layouts that work at 360px width; use the existing responsive utilities for larger screens.
- Add a visible label for every form input and preserve the shared focus outline and 44px tap-target minimum.
- Every data view must include a readable loading state, empty state, and error state where applicable.

The `config` function is the only function allowed to return a key, and it may return only the Supabase publishable key. Never return service-role, Gemini, or other secret keys.

## Folder layout
- `server/index.js`: Express app and routes
- `server/db.js`: database connection and schema
- `server/routes/`: one file per area (users, courses, calendar, partners, costs, plan)
- `server/services/`: logic that is not HTTP (matching, cost calc, AI client)
- `scripts/seed.js`: demo data
- `public/`: frontend pages

## Done means
- `npm install && npm run seed && npm start` works from a clean clone.
- No console errors on the page you changed.
- No secrets committed (`.env` is in `.gitignore`).
