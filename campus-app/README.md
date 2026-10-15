# Campus App

A campus platform for university students in Azerbaijan: calendar, deadlines, courses, study-partner matching, and a free AI study planner.

## Run locally (Replit or any Node 18+ machine)

    npm install
    npm run seed
    npm start

Open http://localhost:3000

## Environment

Copy `.env.example` to `.env` (or set Replit Secrets):

- `GEMINI_API_KEY`: needed only for the AI plan feature (server side only)
- `PORT`: optional, default 3000

## Scope

Phase 1 (current): calendar, deadlines, courses, partners, cost estimate, AI plan.
Not in scope: grades, attendance, online library. See `AGENTS.md`.

## Supabase setup

The Netlify Functions connect to a Supabase (Postgres) database. Follow these steps once.

### 1. Get your Supabase credentials

1. Open your project in the [Supabase dashboard](https://supabase.com/dashboard).
2. Go to **Project Settings → API**.
3. Copy the **Project URL** (starts with `https://`). This is your `SUPABASE_URL`.
4. Under **Project API keys**, copy the **service_role** key (the secret one, not `anon`). This is your `SUPABASE_SERVICE_ROLE_KEY`.

> ⚠️ The service_role key bypasses Row Level Security. Never expose it in the browser or commit it to Git.

### 2. Run the schema

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste the contents of `supabase/schema.sql` and click **Run**.
3. This creates the tables, enables RLS, and inserts demo data.

### 3. Add environment variables in Netlify

1. In Netlify, open your site's **Site configuration → Environment variables**.
2. Add these variables:

   | Variable                     | Value                              |
   | ---------------------------- | ---------------------------------- |
   | `SUPABASE_URL`               | Your Project URL from step 1       |
   | `SUPABASE_SERVICE_ROLE_KEY`  | Your service_role key from step 1  |
   | `GEMINI_API_KEY`             | *(optional, for the AI plan feature)* |

3. Redeploy the site (or push a new commit) so the functions pick up the new variables.

