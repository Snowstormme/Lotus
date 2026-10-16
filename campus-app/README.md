# Lotus Campus

A campus platform for university students in Azerbaijan: calendar, deadlines, courses, study-partner matching, and a free AI study planner.

## Environment

Deploy on Cloudflare Pages. Connect the GitHub repository, leave the build command empty, set the output directory to public. Add these environment variables under Settings > Environment variables for Production and Preview: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PUBLISHABLE_KEY, GEMINI_API_KEY. Add the Workers AI binding named `AI` under Settings > Functions. The assistant uses Cloudflare Workers AI with the default model `@cf/meta/llama-3.1-8b-instruct-fp8` on the free allocation, which is shared and resets daily at 00:00 UTC.

Never put these values in client files or commit them to Git.

## Scope

Phase 1 (current): calendar, deadlines, courses, partners, cost estimate, AI plan.
Not in scope: grades, attendance, online library. See `AGENTS.md`.

## Supabase setup

The Cloudflare Pages Functions connect to a Supabase (Postgres) database. Follow these steps once.

### 1. Set up Supabase

1. Open the Supabase SQL Editor.
2. Paste the contents of `supabase/schema.sql` and run it once.
3. This creates the tables, enables RLS, and inserts demo data.

The service role key is used only by server-side functions and bypasses RLS there. Keep RLS enabled and do not add public policies.

## Tests

Run the plain Node tests from this directory:

    node scripts/test-costs.js
    node scripts/test-matching.js
    node scripts/test-plan.js

## Deployment log

Redeployed to pick up Workers AI model update (@cf/meta/llama-3.1-8b-instruct-fp8).
Redeployed to pick up the conversation list query fix.

