# Lotus Campus legal-review handoff

Prepared for qualified legal review. This is an engineering handoff, not legal approval.

## Documents to review

- `public/privacy.html`: privacy notice, visibly marked "Draft for legal review".
- `public/terms.html`: terms of use, visibly marked "Draft for legal review".
- Owner-approved contact for both: notsnowstorm@proton.me.

No jurisdiction, legal basis, regulator, retention period, minimum age, or account-deletion completion time has been asserted. Counsel must determine which requirements apply using the operator's identity, location, intended users, and launch scope.

## Product and technical evidence

- Student university and faculty are self-reported; labels appear on profile and onboarding forms.
- Authentication and student data use Supabase; table definitions are in `supabase/schema.sql`. Profile handling is in `functions/api/profile.js`.
- Messaging controls and reports: `functions/api/messages.js`, `functions/api/user-block.js`, and `functions/api/conversation-report.js`.
- Posts and reports: `functions/api/posts.js` and `functions/api/post-report.js`.
- Upload access: review upload-related endpoints, particularly `functions/api/upload-link.js`, against the notice's enrollment checks and 300-second signed download link statement.
- AI requests: `functions/api/chat.js`, `functions/api/plan.js`, and `lib/_gemini.js`. A student's pasted assistant text may contain personal information.
- There is no in-app account-deletion flow. The drafts direct requests to the contact address without a promised completion time.

## Evidence and decisions still required

1. Confirm the live email-confirmation setting; the repository's intended setting is not proof of the live configuration.
2. Confirm whether the live `course-files` storage bucket is private, and verify access paths separately from the application enrollment checks.
3. Review the actual Supabase, Cloudflare, and Gemini agreements, account settings, processing locations, retention, and data-use terms. No provider-handling conclusion has been verified by this handoff.
4. Establish an operational process for verifying and handling privacy and closure requests, reports, and incidents. Do not promise deletion or retention periods before this process and applicable requirements are established.
5. Review the accuracy and completeness of the notices, acceptable-use wording, reports/hiding, terms acceptance and changes, audience, and any applicable age-related requirements.
6. Confirm the operator controls and monitors the published contact mailbox; the email was supplied by the owner, but mailbox delivery has not been tested.

## Release status

The contact placeholder has been replaced. Both pages remain drafts. Human legal sign-off is outstanding; no legal compliance certification or public-launch clearance has been given.
