# Campus App

A campus platform for university students in Azerbaijan: calendar, deadlines, courses, study-partner matching, and a free AI study planner.

## Environment

The live app runs as Netlify Functions backed by Supabase. Set these variables in Netlify site settings:

- `SUPABASE_URL`: the Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: the server-only Supabase service role key
- `GEMINI_API_KEY`: optional; needed for AI plan generation
- `GEMINI_MODEL`: optional; defaults to `gemini-2.5-flash`

Never put these values in client files or commit them to Git.

## Scope

Phase 1 (current): calendar, deadlines, courses, partners, cost estimate, AI plan.
Not in scope: grades, attendance, online library. See `AGENTS.md`.

## Supabase setup

The Netlify Functions connect to a Supabase (Postgres) database. Follow these steps once.

### 1. Set up Supabase

1. Open the Supabase SQL Editor.
2. Paste the contents of `supabase/schema.sql` and run it once.
3. This creates the tables, enables RLS, and inserts demo data.

### 2. Configure Netlify

In Netlify, open **Site configuration → Environment variables** and add the variables listed above. Redeploy after changing them.

The service role key is used only by server-side functions and bypasses RLS there. Keep RLS enabled and do not add public policies.

## Tests

Run the plain Node tests from this directory:

    node scripts/test-costs.js
    node scripts/test-matching.js
    node scripts/test-plan.js

