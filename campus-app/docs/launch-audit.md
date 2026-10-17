# Lotus Campus launch security audit

Note: the cost estimate feature was removed after this audit.

Audit date: 2026-10-16. This is a repository-only, read-only audit. No SQL, RLS, storage settings, environment variables, packages, or application code were changed. The request ended during the rate-limit section; this report covers the listed checks and does not invent omitted requirements.

## Summary

- **Pass:** no secret-looking values were found in committed files, `public/`, or `README.md`.
- **Pass:** the supplied live results enumerate 27 public tables, all with RLS enabled, and zero policies. The task text says 28 tables, so that count discrepancy remains open rather than being resolved by inventing a table.
- **Warning:** `user-block.js` still reads two conversation columns that are absent from the supplied live column results.
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
Note: the cost estimate feature was removed after this audit.
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

The synced schema declares the 27 named tables from the supplied results at `supabase/schema.sql:4-238`: `ai_daily_usage`, `availability_slots`, `classes`, `conversation_reads`, `conversation_reports`, `conversations`, `course_files`, `course_uploads`, `courses`, `deadlines`, `enrollments`, `event_rsvps`, `events`, `faculties`, `group_members`, `groups`, `messages`, `personal_classes`, `post_likes`, `post_reports`, `posts`, `study_plans`, `todo_items`, `universities`, `upload_reports`, `user_blocks`, and `users`.

**Status: pass for the supplied live RLS result.** All 27 named tables report `rowsecurity = true` in the owner-provided Query 2 result and have enable statements at `supabase/schema.sql:241-267`. Query 3 returned zero policies, and the file contains no `create policy` statements. The task text says 28 tables, but the supplied result contains 27 rows; this is reported as a data discrepancy rather than guessed around.

**Status: warning for code/schema mismatch.** `functions/api/user-block.js:41,47` reads `conversations.hidden_for_a` and `conversations.hidden_for_b`, but neither column appears in the supplied live columns. No other code-read column was found missing from the supplied results.

**Risk:** user-block operations may fail at runtime until the live database result and the code agree on those columns.

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

## 7. Output safety

**Status: pass.** No `innerHTML`, `outerHTML`, `insertAdjacentHTML`, or `document.write` occurrences were found under `public/`. Pages create DOM nodes and assign server data with `textContent` or safe URL checks instead.

**File and line:** repository search across `public/` returned no matches.

**Risk:** future use of HTML sinks could turn server text into scriptable markup. Keep the current text-only rendering pattern.

## 8. Logging

**Status: warning.** `console.error` is used throughout `functions/api/` for operational details, including `messages.js:62,93,113`, `chat.js:79,111`, `uploads.js:42,65,69`, `upload-link.js:9`, `conversations.js:90,120`, and the other endpoint handlers listed by the repository scan. No `console.log` calls were found.

**File and line:** the handlers log error objects, not request message bodies, tokens, emails, storage paths, or signed URLs directly. However, the raw Supabase/storage error objects passed at `uploads.js:42,65,69` and `upload-link.js:9` could contain provider diagnostics; this was not proven safe from source alone.

**Risk:** an upstream error object could accidentally include sensitive operational detail in function logs. Sanitize logged error fields before production launch.

## 9. Storage

**Status: pass with logging warning.** `functions/api/uploads.js:49-52` checks enrollment, validates the upload, and creates a 15-minute signed upload URL. `uploads.js:55-57` checks the signed upload token and enrollment, verifies the object, removes invalid objects, and stores only the generated path server-side. `functions/api/upload-link.js:8` checks enrollment and `hidden` before creating a five-minute signed download URL.

**File and line:** `uploads.js:52,56-57`; `upload-link.js:8`.

**Risk:** signed URLs are bearer capabilities. They are short-lived and not returned with storage paths, but raw storage errors should still be sanitized before logging.

## 10. Headers

**Status: fail.** No `_headers` or equivalent header configuration file was found. The repository does not set Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, or frame protection.

**File and line:** no matching header file exists under the repository; `wrangler.toml` only configures the Pages output directory and binding.

**Risk:** browsers lack defense-in-depth against framing, MIME confusion, referrer leakage, and script injection.

## 11. Demo exposure

**Status: warning.** Logged-out read-only demo exposure exists in `users.js:7-12`, `courses.js:8-27`, `calendar.js:8-43`, `deadlines.js:8-30`, `course.js:7-28`, `profile.js:52-60`, `availability.js:44-59`, `partners.js:14-47`, `plan.js:82-95`, and the public estimate path in `cost-estimate.js:9-31`. Public non-student routes also include `health.js`, `config.js`, and onboarding catalog GET.
Note: the cost estimate feature was removed after this audit.

**File and line:** logged-out write-capable demo fallbacks are `profile.js:64-81`, `availability.js:62-78`, and `plan.js:78-107`; these currently allow a request without a bearer token to target an `is_demo` row.

**Risk:** demo write routes can be modified anonymously. Commit 3 is intended to remove this write exposure while preserving the requested read-only demo pages.

## 12. Dependencies

**Status: pass.** `package.json:7-9` contains only `@supabase/supabase-js` (`^2.45.0`), which is used by `lib/_supabase.js:1`. There are no unused package entries and no new packages were added.

**File and line:** `package.json:7-9`; `lib/_supabase.js:1`.

**Risk:** the dependency is maintained externally, so keep its version reviewed and deploy with lockfile/reproducible-install controls if the project adds a lockfile later.

## Prioritized fixes

- **Critical (0):** No critical finding was established in this repository-only audit.
- **High (2):** Add response security headers and resolve the missing `conversations.hidden_for_a/hidden_for_b` columns before production use.
- **Medium (4):** Remove anonymous demo writes, sanitize raw provider errors in logs, add request-body limits, and add time-window limits to the remaining write endpoints.
- **Low (2):** Resolve the supplied 27-versus-28 table count discrepancy and keep public demo numeric IDs documented as intentionally non-real.
