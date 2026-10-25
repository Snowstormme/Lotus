const assert = require('assert');
const { parseCatalog } = require('./catalog/build-import-sql');

const parsed = parseCatalog([
  'university_name,city,faculty_name,course_code,course_name,teacher,source_url,level,notes',
  'Test University,Baku,,CS101,Algorithms,,https://example.edu/algorithms,bachelor,Official curriculum',
  'Test University,Baku,,CS101,Algorithms,,https://example.edu/algorithms,bachelor,Official curriculum',
  'Test University,Baku,Engineering,CS102,Data Structures,,https://example.edu/data,bachelor,Official curriculum',
  'Test University,Baku,Engineering,CS103,No source,, ,bachelor,Rejected'
].join('\n'));

assert.strictEqual(parsed.rows.length, 2);
assert.strictEqual(parsed.duplicateCount, 1);
assert.strictEqual(parsed.rejected.length, 1);
assert.strictEqual(parsed.rejected[0].row, 5);
assert.strictEqual(parsed.rows[0].faculty_name, 'Faculty not specified');
assert.strictEqual(parsed.rows[0].course_name, 'Algorithms');
console.log('Catalog test passed: missing source rejected, blank faculty preserved for mapping, duplicates removed.');

const { aztuName, loadBatch, readCsv, validateBatch, buildBatchSql } = require('./catalog/build-batch1-sql');
const input = loadBatch();
// Offline identity fixture, confirmed by the public onboarding GET on 2026-10-24.
const identities = [
  { id: 2, name: 'Bakı Dövlət Universiteti' },
  { id: 3, name: 'Azərbaycan Dövlət İqtisad Universiteti' },
  { id: 4, name: 'Azərbaycan Dövlət Neft və Sənaye Universiteti' },
  { id: 14, name: 'Azərbaycan Dövlət Pedaqoji Universiteti' },
  { id: 25, name: aztuName }
];
const batch = validateBatch(input, identities);
assert.deepStrictEqual(batch.rejected, []);
for (const [name, count] of [['universities', 5], ['faculties', 27], ['courses', 30]]) {
  assert.strictEqual(input[name].read, count);
  assert.strictEqual(batch.rows[name].length, count);
}
assert.strictEqual(batch.matched.get(aztuName), 25);
assert.strictEqual(batch.rows.courses.filter((row) => row.university_name === aztuName).length, 0);
const adpuName = 'Azərbaycan Dövlət Pedaqoji Universiteti';
const adpuCourses = batch.rows.courses.filter((row) => row.university_name === adpuName);
assert.strictEqual(adpuCourses.length, 6);
assert(adpuCourses.every((row) => row.faculty_name === 'Filologiya'));
assert(batch.rows.faculties.some((row) => row.university_name === adpuName && row.faculty_name === 'Filologiya'));
assert(!batch.rows.faculties.some((row) => row.university_name === adpuName && /Tarix və [Cc]oğrafiya/.test(row.faculty_name)));
console.log('Batch 1 counts passed: 5 universities, 27 faculties, 30 courses; AzTU id 25; zero AzTU courses.');
console.log('ADPU tests passed: duplicate history/geography faculty excluded; six courses remain in Filologiya.');

const preservedNames = ['Analityc journalism', 'Медиаграмотность', 'Економика медиа', 'Практическая работа в газете'];
for (const name of preservedNames) assert(batch.rows.courses.some((row) => row.course_name === name));
assert(batch.rows.courses.some((row) => row.course_code === 'İF-B06.1'));
const sql = buildBatchSql(batch);
for (const name of preservedNames) assert(sql.includes(name));
assert(!/logo_url/i.test(sql));
assert(!/insert\s+into\s+universities/i.test(sql));
assert(!/\b(update|delete|alter|drop)\b/i.test(sql));
assert(!/\b(users|enrollments|study_plans)\b/i.test(sql));
assert(sql.startsWith('begin;\n'));
assert(sql.endsWith('commit;\n'));
assert.strictEqual((sql.match(/insert into faculties/g) || []).length, 27);
assert.strictEqual((sql.match(/insert into courses/g) || []).length, 30);
assert.strictEqual((sql.match(/where not exists|and not exists/g) || []).length, batch.rows.faculties.length + batch.rows.courses.length);
assert(!/Tarix və [Cc]oğrafiya/.test(sql));
assert(sql.includes('c.source_url ='));
assert(sql.includes('where university_id = 25'));
assert(sql.includes('select 25,'));
assert.strictEqual(sql, buildBatchSql(validateBatch(loadBatch(), identities)));
assert.strictEqual(require('fs').readFileSync(require('path').join(__dirname, 'catalog/batch1/import.sql'), 'utf8'), sql);
console.log('Batch 1 SQL passed: exact spellings/codes, no logos or university inserts, guarded inserts, one transaction, deterministic output.');

function expectRejected(change, pattern, live = identities) {
  const altered = structuredClone(input);
  change(altered);
  const result = validateBatch(altered, live);
  assert(result.rejected.some((item) => pattern.test(item.reason)));
  assert.throws(() => buildBatchSql(result), /rejected rows/);
  assert(result.rejected.every((item) => item.file.endsWith('.csv') && Number.isInteger(item.line)));
}
expectRejected((data) => { data.courses.rows[0].source_url = ''; }, /missing source_url/);
expectRejected((data) => { data.courses.rows[0].teacher = 'Not allowed'; }, /teacher must be blank/);
expectRejected((data) => { data.courses.rows[0].level = 'master'; }, /level must be bachelor/);
expectRejected((data) => { data.courses.rows[0].verified = 'no'; }, /verified must be yes/);
expectRejected((data) => { data.courses.rows[0].faculty_name = 'Unknown'; }, /faculty must match/);
expectRejected((data) => { data.faculties.rows[0].university_name = 'Unknown'; }, /university is not in/);
expectRejected((data) => { data.courses.rows[0].university_name = aztuName; }, /AzTU courses are excluded/);
expectRejected(() => {}, /found 0/, identities.slice(1));
expectRejected(() => {}, /found 2/, [...identities, identities[0]]);
expectRejected(() => {}, /approved AzTU id must be 25/, identities.map((item) => item.name === aztuName ? { ...item, id: 26 } : item));
console.log('Batch 1 rejection tests passed: missing source, teacher, level, verification, foreign faculty/university, AzTU courses, missing/ambiguous universities, wrong AzTU id.');

const duplicated = structuredClone(input);
duplicated.faculties.rows.push({ ...duplicated.faculties.rows[0], line: 30 });
duplicated.courses.rows.push({ ...duplicated.courses.rows[0], line: 32 });
const deduped = validateBatch(duplicated, identities);
assert.deepStrictEqual(deduped.rejected, []);
assert.strictEqual(deduped.duplicates.faculties, 1);
assert.strictEqual(deduped.duplicates.courses, 1);
assert.strictEqual(sql, buildBatchSql(deduped));
const differentSource = structuredClone(input);
differentSource.courses.rows.push({ ...differentSource.courses.rows[0], source_url: 'https://example.edu/another-source', line: 32 });
assert.strictEqual(validateBatch(differentSource, identities).rows.courses.length, 31);
const differentFaculty = structuredClone(input);
differentFaculty.courses.rows.push({ ...differentFaculty.courses.rows[12], faculty_name: differentFaculty.faculties.rows[2].faculty_name, line: 32 });
assert.strictEqual(validateBatch(differentFaculty, identities).rows.courses.length, 31);
assert.deepStrictEqual(readCsv('a,b\r\n"x,y","a""b"\r\n"two\nlines",z\r\n', 'test.csv', ['a', 'b']).rows,
  [{ a: 'x,y', b: 'a"b', line: 2 }, { a: 'two\nlines', b: 'z', line: 3 }]);
assert.throws(() => readCsv('a,b\n"unfinished,z', 'test.csv', ['a', 'b']), /unclosed/);
assert.throws(() => readCsv('a,b\n"x"bad,z', 'test.csv', ['a', 'b']), /invalid CSV/);
assert.strictEqual(readCsv('a,b\n\nx,y,z', 'test.csv', ['a', 'b']).rejected[0].line, 3);
assert.strictEqual(readCsv('a,b\n""', 'test.csv', ['a', 'b']).rejected[0].line, 2);
expectRejected((data) => { data.courses.rows[0].notes = '\u0000'; }, /NUL characters/);
const quotedName = structuredClone(input);
quotedName.courses.rows[0].course_name = "Student's course";
assert(buildBatchSql(validateBatch(quotedName, identities)).includes("Student''s course"));
console.log('Batch 1 deduplication/CSV tests passed: university+faculty keys, source-aware course keys, quoting, UTF-8, physical line numbers.');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const batch2Dir = path.join(__dirname, 'catalog/batch2');
const batch2Input = loadBatch(batch2Dir);
const batch2 = validateBatch(batch2Input, undefined, 'batch2');
assert.deepStrictEqual(batch2.rejected, []);
for (const [name, count] of [['universities', 5], ['faculties', 8], ['courses', 17], ['logos', 5]]) {
  assert.strictEqual(batch2Input[name].read, count);
  assert.strictEqual(batch2.rows[name].length, count);
}
const tauName = 'Türkiyə-Azərbaycan Universiteti';
const medicalName = 'Azərbaycan Tibb Universiteti';
assert.strictEqual(batch2.rows.courses.filter((row) => row.university_name === 'Bakı Slavyan Universiteti').length, 0);
assert.strictEqual(batch2.rows.courses.filter((row) => row.university_name === medicalName).length, 7);
assert.strictEqual(batch2.rows.courses.filter((row) => row.university_name === tauName).length, 10);
assert(batch2.rows.faculties.some((row) => row.university_name === tauName && row.faculty_name === 'Faculty not specified'));
console.log('Batch 2 counts passed: 5 universities, 8 faculties, 17 courses, 5 metadata logos; zero BSU courses; AMU 7; TAU 10.');

const tauCourses = [
  ['PHYS105', 'GENERAL PHYSICS I'],
  ['BIOL109', 'INTRODUCTION TO MOLECULAR BIOLOGY'],
  ['MATH119', 'CALCULUS WITH ANALYTIC GEOMETRY'],
  ['CENG100', 'COMPUTER ENGINEERING ORIENTATION'],
  ['CENG111', 'INTRODUCTION TO COMPUTER ENG. CONCEPTS'],
  ['ENG101', 'ENGLISH FOR ACADEMIC PURPOSES I'],
  ['OHS101', 'OCCUPATIONAL HEALTH AND SAFETY-I'],
  ['IS100', 'INTRODUCTION TO INFORMATION TECHNOLOGIES AND APPLICATIONS'],
  ['PHYS106', 'GENERAL PHYSICS II'],
  ['MATH120', 'CALCULUS OF FUNCTIONS OF SEVERAL VARIABLES']
];
assert(batch2.rows.universities.some((row) => row.university_name === 'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti'));
for (const name of ['Tibb bacılığının menecmenti (İctimai Səhiyyə)', 'Sağlamlığın təbliğ (İctimai Səhiyyə)']) {
  assert(batch2.rows.courses.some((row) => row.course_name === name));
}
assert.deepStrictEqual(batch2.rows.courses.filter((row) => row.university_name === tauName).map((row) => [row.course_code, row.course_name]), tauCourses);
assert(batch2.rows.courses.every((row) => row.teacher === '' && typeof row.course_code === 'string'));
console.log('Batch 2 names passed: official ADMIU name, both AMU titles, all ten uppercase TAU titles and text codes preserved.');

const sql2 = buildBatchSql(batch2);
assert(sql2.startsWith('begin;\n'));
assert(sql2.endsWith('commit;\n'));
assert(!/logo_url|\/img\/|insert\s+into\s+universities|\b(update|delete|alter|drop)\b|\b(users|enrollments|study_plans)\b/i.test(sql2));
assert(!/\b(id|university_id)\s*=\s*\d+/.test(sql2));
assert(!/\b(teacher|room|schedule_text)\b/.test(sql2));
assert.strictEqual((sql2.match(/insert into faculties/g) || []).length, 8);
assert.strictEqual((sql2.match(/insert into courses/g) || []).length, 17);
assert.strictEqual((sql2.match(/and not exists/g) || []).length, 25);
assert.strictEqual((sql2.match(/from universities where name = .*\) <> 1 then/g) || []).length, 5);
assert.strictEqual((sql2.match(/faculty lookup is ambiguous/g) || []).length, 8);
assert(sql2.includes('c.faculty_id = f.id and c.name ='));
assert(sql2.includes('c.source_url ='));
assert.strictEqual(sql2, buildBatchSql(validateBatch(loadBatch(batch2Dir), undefined, 'batch2')));
assert(Buffer.from(sql2).equals(fs.readFileSync(path.join(batch2Dir, 'import.sql'))));
// Arbitrary offline IDs are not evidence of live identities; Batch 2 SQL must not depend on them.
const batch2Identities = batch2.rows.universities.map((row, index) => ({ id: 9001 + index, name: row.university_name }));
assert.strictEqual(sql2, buildBatchSql(validateBatch(batch2Input, batch2Identities, 'batch2')));
assert.strictEqual(sql2, buildBatchSql(validateBatch(batch2Input, batch2Identities.map((row) => ({ ...row, id: row.id + 1000 })), 'batch2')));
const metadataOnly = structuredClone(batch2Input);
metadataOnly.logos.rows[0].logo_image_url = '';
metadataOnly.logos.rows[0].notes = 'Changed research metadata';
assert.strictEqual(sql2, buildBatchSql(validateBatch(metadataOnly, undefined, 'batch2')));
console.log('Batch 2 SQL passed: exact-name prechecks, guarded inserts, one transaction, no IDs/logos/university inserts, metadata excluded, byte-identical regeneration.');

function expectBatch2Rejected(change, pattern, live) {
  const altered = structuredClone(batch2Input);
  change(altered);
  const result = validateBatch(altered, live, 'batch2');
  assert(result.rejected.some((item) => pattern.test(item.reason)));
  assert(result.rejected.every((item) => item.file.endsWith('.csv') && Number.isInteger(item.line)));
  assert.throws(() => buildBatchSql(result), /rejected rows/);
}
expectBatch2Rejected((data) => { data.courses.rows[0].faculty_name = 'Unknown'; }, /faculty must match/);
expectBatch2Rejected((data) => { data.courses.rows[0].source_url = ''; }, /missing source_url/);
expectBatch2Rejected((data) => { data.courses.rows[0].teacher = 'Not allowed'; }, /teacher must be blank/);
expectBatch2Rejected((data) => { data.courses.rows[0].level = 'master'; }, /level must be bachelor/);
expectBatch2Rejected((data) => { data.courses.rows[0].verified = 'no'; }, /verified must be yes/);
expectBatch2Rejected((data) => { data.universities.rows[0].university_name = 'Unknown'; }, /approved Batch 2 exact name/);
expectBatch2Rejected(() => {}, /found 0/, batch2Identities.slice(1));
expectBatch2Rejected(() => {}, /found 2/, [...batch2Identities, batch2Identities[0]]);
const batch2Duplicates = structuredClone(batch2Input);
batch2Duplicates.faculties.rows.push({ ...batch2Duplicates.faculties.rows[0], line: 10 });
batch2Duplicates.courses.rows.push({ ...batch2Duplicates.courses.rows[0], line: 19 });
const deduped2 = validateBatch(batch2Duplicates, undefined, 'batch2');
assert.deepStrictEqual(deduped2.rejected, []);
assert.strictEqual(deduped2.duplicates.faculties, 1);
assert.strictEqual(deduped2.duplicates.courses, 1);
assert.strictEqual(sql2, buildBatchSql(deduped2));
console.log('Batch 2 rejection/deduplication passed: foreign faculty, missing source, teacher, level, verification, wrong/missing/duplicate university names, exact duplicates.');

// Frozen SHA-256 of the committed Batch 1 output before the batch-directory refactor.
const batch1Digest = '8cba3492ad7774f59588910120bb5703672e7ffc7464df95f38a40889043ed75';
assert.strictEqual(crypto.createHash('sha256').update(sql).digest('hex'), batch1Digest);
assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, 'catalog/batch1/import.sql'))).digest('hex'), batch1Digest);
console.log('Batch 1 regression passed: regenerated and committed SQL are byte-identical to the pre-change SHA-256 baseline.');
