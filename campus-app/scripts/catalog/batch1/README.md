# Batch 1: review-only catalog import

The three UTF-8 CSV files are the owner-approved input: 5 universities, 27 named
faculties, and 30 bachelor courses. AzTU has six faculty rows and no courses.
Names, course codes, notes, and source URLs are kept exactly as supplied.

The owner-approved revision excludes ADPU's `Tarix və coğrafiya` faculty row
because `Tarix və Coğrafiya Fakültəsi` already exists in the database. All six
ADPU course rows remain unchanged under `Filologiya`.

From the `campus-app` directory:

```sh
node scripts/catalog/build-import-sql.js --batch1
node scripts/test-catalog.js
```

Batch 1 mode makes only a public GET to the existing onboarding endpoint to
resolve each university by its exact name. Missing or multiple matches, or an
AzTU match other than ID 25, stop generation. It uses no credentials or
environment variables and never executes SQL. Network access is required for
generation; the tests are offline.

`import.sql` contains only this batch, inside one transaction. A preflight block
checks the exact university names/IDs again when the owner eventually runs the
file, and rejects ambiguous existing faculty names. Faculty inserts are guarded
by university ID and exact faculty name. Course inserts are guarded by university
(through faculty), exact faculty, course name, and source URL. Each insert uses
`where not exists` (or its correlated `and not exists` equivalent).

Summary insert counts are candidate inserts **if absent**, not guaranteed new
database rows. Existing rows are never updated or merged. A failed generation
does not overwrite the previous output; do not use an older file after a failed
run. Source verification flags record owner-approved research, not new research
performed by the generator. No student, enrollment, sample, or logo data is
written. The legacy generator and its original input/output are unchanged when
the `--batch1` option is not used.
