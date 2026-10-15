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
