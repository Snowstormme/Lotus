# Lotus Campus launch security audit

Audit date: 2026-10-16. This is a repository-only, read-only audit. No SQL, RLS, storage settings, environment variables, packages, or application code were changed. The request ended during the rate-limit section; this report covers the listed checks and does not invent omitted requirements.

## Summary

- **Pass:** no secret-looking values were found in committed files, `public/`, or `README.md`.
- **Pass:** all 18 tables represented in `supabase/schema.sql` have RLS enable statements, and the file has no public policy statements.
- **Warning:** the checked-in schema is behind the feature code and omits several live tables and columns.
- **Warning:** demo fallback routes and public demo IDs remain enabled.
- **Warning:** most write endpoints have no time-window rate limit.

## 1. Secrets

**Status: pass.** The scan found no populated values matching `sb_secret`, `AQ.`, long `eyJ...` tokens, or `KEY=` assignments. `.env.example:3-4` contains blank placeholders only. `README.md:7` and `AGENTS.md:30` contain environment-variable names, not values. `public/` contains no service-role/Gemini key references or server-helper imports.

Server-only reads are at `lib/_supabase.js:6-9`, `lib/_gemini.js:4-7`, `lib/_contact.js:34-54`, and `functions/api/uploads.js:18-27`. `functions/api/config.js:6-12` returns only the URL and publishable key, as permitted by `AGENTS.md:25`.

**Risk:** this cannot inspect Cloudflare dashboard values or prove that deployment logs are clean. Keep dashboard values masked and rotate anything accidentally logged.

## 2. Authentication

The shared helper is `lib/_auth.js:44-52`. Onboarding has equivalent local token verification at `functions/api/onboarding.js:20-30,55-69,89-94`.

| File | Login/helper status | Demo or exposure note |
|---|---|---|
| `health.js:1-6` | Public, no helper | No student data; pass |
| `config.js:5-12` | Public, no helper | Public config only; pass |
| `users.js:7-12` | Public, no helper | Demo users only, but returns numeric demo IDs; warning |
| `course.js:7-28` | Public, no helper | Any course ID can retrieve course materials/deadlines; no student data |
| `onboarding.js:55-82,89-145` | Local token verification | Public catalog; POST requires a valid token; duplicated auth logic |
| `courses.js:8-27` | Helper when token exists | No token serves catalog; token path is enrollment-filtered |
| `calendar.js:8-43` | Helper when token exists | No-token path is demo enrollment fallback |
| `deadlines.js:8-30` | Helper when token exists | No-token path is demo enrollment fallback |
| `availability.js:44-83` | Helper when token exists | No-token `user_id` selects only `is_demo`; read/write demo fallback |
| `profile.js:41-87` | Helper when token exists | No-token `id` selects only `is_demo`; read/write demo fallback |
| `cost-estimate.js:9-31` | Optional helper when token exists | Pure estimate is public; optional ID is checked as demo |
| `plan.js:74-114` | Helper when token exists | No-token `user_id` selects only `is_demo`; demo fallback |
| `partners.js:14-47` | Helper when token exists | No-token `user_id` selects demo-compatible requester; demo fallback |
| `reminders.js:20-66` | Always helper | No fallback; pass |
| `todos.js:113-207` | Always helper | No fallback; pass |
| `catalog.js:8-22` | Always helper | No fallback; pass |
| `enrollments.js:19-84` | Always helper | No fallback; pass |
| `personal-classes.js:80-135` | Always helper | No fallback; pass |
| `chat.js:73-114` | Always helper | No fallback; pass |
| `posts.js:43-107` | Always helper | No fallback; pass |
| `post-like.js:20-67` | Always helper | No fallback; pass |
| `post-report.js:21-72` | Always helper | No fallback; pass |
| `groups.js:16-29` | Always helper | No fallback; pass |
| `events.js:42-85` | Always helper | No fallback; pass |
| `conversations.js:20-124` | Always helper | No fallback; pass |
| `messages.js:29-115` | Always helper | No fallback; pass |
| `conversation-report.js:21-42` | Always helper | No fallback; pass |
| `user-block.js:19-55` | Always helper | Body `user_id` is a target selector, not the owner selector |
| `uploads.js:35-70` | Always helper | No fallback; pass |
| `upload-link.js:6-10` | Always helper | No fallback; pass |

**Risk:** demo fallback routes can enumerate or modify demo content without login. They are safe only while demo data is intentionally public and filtered by `is_demo`.

## 3. Database access and RLS

The schema declares: `universities`, `faculties`, `users`, `courses`, `enrollments`, `classes`, `deadlines`, `availability_slots`, `course_files`, `study_plans`, `posts`, `post_likes`, `post_reports`, `conversations`, `messages`, `conversation_reads`, `user_blocks`, and `conversation_reports` at `supabase/schema.sql:4-156`.

**Status: pass for declared tables.** RLS is enabled for every declared table at `supabase/schema.sql:162-179`. There are no `create policy` statements in the file, so no public/anon policies are declared.

**Status: fail for schema completeness.** Code uses tables absent from the file: `ai_daily_usage`, `groups`, `group_members`, `events`, `event_rsvps`, `todo_items`, `personal_classes`, `course_uploads`, and `upload_reports`. Code also relies on live columns absent from the file, including `users.auth_user_id`, `users.share_for_partners`, `messages.deleted` (used at `messages.js:48,108`), and conversation hidden-state columns used at `user-block.js:41,47`.

**Risk:** a clean database created from this repository will not reproduce the deployed application and may fail at runtime.

## 4. Response data

**Status: pass with intended bearer-capability exceptions.** No response was found to return email, `auth_user_id`, raw storage paths, service/Gemini keys, or raw database errors.

- `users.js:10` returns demo numeric `id`, name, year, and demo status. **Warning:** numeric demo IDs are public.
- `partners.js:37-40` and `posts.js:27-39` return seven-day signed `contact_token` values for the intended messaging flow.
- `uploads.js:52` returns a signed upload URL and token; `upload-link.js:8` returns a five-minute signed download URL. These are intended, short-lived bearer URLs and must not be logged.
- `config.js:12` returns the publishable key only.
- `course.js:24` returns database file URLs, not storage paths or generated signed URLs.

**Risk:** contact tokens and signed URLs grant temporary capabilities to whoever obtains them. Do not place them in analytics, logs, or screenshots.

## 5. Input limits

**Status: mostly pass.** Bounds and allowlists exist for posts (`posts.js:81-92`), messages (`messages.js:71-84`), profiles/onboarding (`profile.js:24-31`, `onboarding.js:33-52`), availability (`availability.js:20-35`), personal classes/imports (`personal-classes.js:21-69,108`), enrollments (`enrollments.js:41-60`), to-dos (`todos.js:130-180`), groups (`groups.js:23`), uploads (`uploads.js:49-62`), chat (`chat.js:14-19`), and event/report/like/block actions.

**Warning:** `conversations.js:97-117` has no explicit token-length guard before signed-token parsing. JSON endpoints generally have no explicit request-body byte limit before parsing. This is a platform/resource risk even where individual fields are bounded.

**Risk:** an oversized request can consume function memory before field validation. Configure a platform body-size limit and consider a shared guard.

## 6. Rate limits

**Pass — limits present:** posts are limited to 5 per 10 minutes at `posts.js:85-92`; messages to 20 per minute at `messages.js:81-84`; AI uses the shared daily total limit at `lib/_ai_limits.js:20-33` and `chat.js:97-99`, default 300 via `AI_DAILY_LIMIT_TOTAL`. The per-student AI limit was intentionally removed. Uploads have a per-student/course quota at `uploads.js:51`.

**Warning — no time-window rate limit:** availability, profile, onboarding, enrollments, personal classes, to-dos, groups, event RSVPs, likes, post reports, conversation reports, conversation creation, user blocks, upload reports/deletes, upload start/finish, and message deletion. Relevant write handlers are in `availability.js:62-78`, `profile.js:64-81`, `onboarding.js:89-147`, `enrollments.js:37-78`, `personal-classes.js:93-129`, `todos.js:127-205`, `groups.js:20-29`, `events.js:62-80`, `conversations.js:95-117`, and the corresponding handlers in `post-like.js`, `post-report.js`, `conversation-report.js`, `user-block.js`, and `uploads.js`.

**Risk:** authenticated users can automate repeated writes or consume database/storage resources. Add endpoint-specific quotas or a platform/WAF limit before scaling beyond the demo.

## Launch follow-up

1. Sync the complete live schema, including the missing feature tables/columns, and verify RLS on every live table.
2. Decide whether demo fallback routes should remain enabled in production.
3. Add request-body/platform limits and rate limits to the endpoints above.
4. Confirm Cloudflare production/preview secrets and the Workers AI binding in the dashboard; this audit cannot inspect dashboard configuration.
