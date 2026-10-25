# Batch 3: review-only catalog import

Owner-approved UTF-8 inputs: 5 universities, **12 faculties**, 30 bachelor
courses, and 5 logo research rows. The initial research contained 10 named
faculties. The owner approved keeping all ten and adding two explicit
`Faculty not specified` rows, for AESMA and the Conservatory, so every course
faculty exists in `faculties.csv`. These are course-grouping placeholders,
not claimed official faculty names. Candidate faculty inserts are therefore
12, not the earlier estimate of 10.

From `campus-app`:

```sh
node scripts/catalog/build-import-sql.js scripts/catalog/batch3
node scripts/test-catalog.js
```

The generator accepts a batch directory. The existing Batch 1 commands and
the direct `build-batch1-sql.js` directory command remain supported. Batch 1
and Batch 2 generated SQL must stay byte-identical to their committed
baselines; the tests freeze both SHA-256 digests. Batch 3 generation is
offline and never executes SQL. Validation failures list file, physical
line, and reason and prevent overwriting the output.

Names, spellings, punctuation, course codes, sources, and course notes are
preserved. ATU's city is `Gəncə`, from its official homepage footer. AKU's
city stays blank. BAAU and AKU have no course rows. BAAU's university,
faculty, and logo research was cleared after a rendered browser check of
its main homepage and About page. Its two department sources that returned
unrelated content remain excluded.

The SQL contains one transaction. Its precheck requires exactly one existing
university for each approved exact name and rejects ambiguous faculty
lookups. It creates no universities, uses no fixed IDs, and never updates
existing rows. Faculty guards match university and faculty; course guards
match university through faculty, faculty, course name, and source URL.
Only catalog fields are inserted; teacher, room, and schedule are not set.
Logo metadata never affects SQL. No student, enrollment, or sample rows are
written. Counts are candidate inserts if absent, not guaranteed new rows.

Read-only overlap check on 2026-10-25: the public onboarding GET returned
exactly one row for each of the five names and zero faculties under every
one. Therefore there are no existing associated faculty or course names
to compare: courses belong to universities through faculties. No SQL was
run for this check, and no rows were merged, removed, or changed.
