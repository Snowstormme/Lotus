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

// Frozen SHA-256 of Batch 2 before adding Batch 3 support.
const batch2Digest = 'f95455d8bda004201aaffc7ba05e27d83d35f410c8ec4b34beccac6429d03561';
assert.strictEqual(crypto.createHash('sha256').update(sql2).digest('hex'), batch2Digest);
assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(path.join(batch2Dir, 'import.sql'))).digest('hex'), batch2Digest);
console.log('Batch 2 regression passed: regenerated and committed SQL are byte-identical to the pre-change SHA-256 baseline.');

const { batch3Names } = require('./catalog/build-batch1-sql');
const batch3Dir = path.join(__dirname, 'catalog/batch3');
const batch3Input = loadBatch(batch3Dir);
const batch3 = validateBatch(batch3Input, undefined, 'batch3');
assert.deepStrictEqual(batch3.rejected, []);
for (const [name, count] of [['universities', 5], ['faculties', 12], ['courses', 30], ['logos', 5]]) {
  assert.strictEqual(batch3Input[name].read, count);
  assert.strictEqual(batch3.rows[name].length, count);
}
assert.deepStrictEqual(batch3.rows.universities.map((row) => row.university_name), batch3Names);
assert.strictEqual(batch3.rows.courses.filter((row) => row.university_name === batch3Names[1]).length, 0);
assert.strictEqual(batch3.rows.courses.filter((row) => row.university_name === batch3Names[2]).length, 0);
assert.strictEqual(batch3.rows.universities.find((row) => row.university_name === batch3Names[0]).city, 'Gəncə');
assert.strictEqual(batch3.rows.universities.find((row) => row.university_name === batch3Names[2]).city, '');
for (const university of batch3Names.slice(3)) {
  assert(batch3.rows.faculties.some((row) => row.university_name === university && row.faculty_name === 'Faculty not specified'));
  const courses = batch3.rows.courses.filter((row) => row.university_name === university);
  assert.strictEqual(courses.length, 10);
  assert(courses.every((row) => row.faculty_name === 'Faculty not specified'));
}
assert.strictEqual(batch3.rows.faculties.filter((row) => row.faculty_name !== 'Faculty not specified').length, 10);
console.log('Batch 3 counts passed: 5 universities, 12 faculties (10 named + 2 owner-approved placeholders), 30 courses, 5 metadata logos; zero BAAU/AKU courses; cities preserved.');

const batch3Spellings = ['Muasir musiqi', 'İKT.', 'IKT-baza kompüter bilikləri', 'SƏTƏMM', 'Musiqi əsərlərin təhlili', 'Nəqliyyatın yükləmə - boşaltma vasitələri'];
for (const name of batch3Spellings) assert(batch3.rows.courses.some((row) => row.course_name === name));
assert(batch3.rows.courses.every((row) => row.teacher === '' && typeof row.course_code === 'string'));
const sql3 = buildBatchSql(batch3);
for (const name of batch3Spellings) assert(sql3.includes(name));
assert(sql3.startsWith('begin;\n'));
assert(sql3.endsWith('commit;\n'));
assert(!/logo_url|\/img\/|insert\s+into\s+universities|\b(update|delete|alter|drop)\b|\b(users|enrollments|study_plans)\b/i.test(sql3));
assert(!/\b(id|university_id)\s*=\s*\d+/.test(sql3));
assert(!/\b(teacher|room|schedule_text)\b/.test(sql3));
assert.strictEqual((sql3.match(/insert into faculties/g) || []).length, 12);
assert.strictEqual((sql3.match(/insert into courses/g) || []).length, 30);
assert.strictEqual((sql3.match(/and not exists/g) || []).length, 42);
assert.strictEqual((sql3.match(/from universities where name = .*\) <> 1 then/g) || []).length, 5);
assert.strictEqual((sql3.match(/faculty lookup is ambiguous/g) || []).length, 12);
assert(sql3.includes('c.faculty_id = f.id and c.name ='));
assert(sql3.includes('c.source_url ='));
assert.strictEqual(sql3, buildBatchSql(validateBatch(loadBatch(batch3Dir), undefined, 'batch3')));
assert(Buffer.from(sql3).equals(fs.readFileSync(path.join(batch3Dir, 'import.sql'))));
const batch3Identities = batch3Names.map((name, index) => ({ name, id: 10001 + index }));
assert.strictEqual(sql3, buildBatchSql(validateBatch(batch3Input, batch3Identities, 'batch3')));
assert.strictEqual(sql3, buildBatchSql(validateBatch(batch3Input, batch3Identities.map((row) => ({ ...row, id: row.id + 1000 })), 'batch3')));
const batch3Metadata = structuredClone(batch3Input);
batch3Metadata.logos.rows[0].logo_image_url = '';
batch3Metadata.logos.rows[0].notes = 'Metadata does not affect SQL';
assert.strictEqual(sql3, buildBatchSql(validateBatch(batch3Metadata, undefined, 'batch3')));
console.log('Batch 3 SQL passed: exact-name prechecks, 12 guarded faculty inserts, 30 guarded course inserts, spellings preserved, one transaction, no IDs/logos/university inserts, byte-identical regeneration.');

function expectBatch3Rejected(change, pattern, live) {
  const altered = structuredClone(batch3Input);
  change(altered);
  const result = validateBatch(altered, live, 'batch3');
  assert(result.rejected.some((item) => pattern.test(item.reason)));
  assert(result.rejected.every((item) => item.file.endsWith('.csv') && Number.isInteger(item.line)));
  assert.throws(() => buildBatchSql(result), /rejected rows/);
}
expectBatch3Rejected((data) => { data.courses.rows[0].faculty_name = 'Unlisted faculty'; }, /faculty must match/);
expectBatch3Rejected((data) => { data.courses.rows[0].source_url = ''; }, /missing source_url/);
expectBatch3Rejected((data) => { data.courses.rows[0].teacher = 'Not allowed'; }, /teacher must be blank/);
expectBatch3Rejected((data) => { data.courses.rows[0].level = 'master'; }, /level must be bachelor/);
expectBatch3Rejected((data) => { data.courses.rows[0].verified = 'no'; }, /verified must be yes/);
expectBatch3Rejected((data) => { data.courses.rows[0].university_name = batch3Names[1]; }, /BAAU courses are excluded/);
expectBatch3Rejected((data) => { data.universities.rows[0].city = 'Bakı'; }, /ATU city must remain/);
expectBatch3Rejected((data) => { data.universities.rows[2].city = 'Bakı'; }, /Kooperasiya city must remain blank/);
expectBatch3Rejected((data) => { data.universities.rows[0].university_name = 'Unknown'; }, /approved Batch 3 exact name/);
expectBatch3Rejected((data) => { data.faculties.rows = data.faculties.rows.filter((row) => row.faculty_name !== 'Faculty not specified'); }, /faculty must match/);
expectBatch3Rejected(() => {}, /found 0/, batch3Identities.slice(1));
expectBatch3Rejected(() => {}, /found 2/, [...batch3Identities, batch3Identities[0]]);
const batch3Duplicates = structuredClone(batch3Input);
batch3Duplicates.faculties.rows.push({ ...batch3Duplicates.faculties.rows[0], line: 14 });
batch3Duplicates.courses.rows.push({ ...batch3Duplicates.courses.rows[0], line: 32 });
const deduped3 = validateBatch(batch3Duplicates, undefined, 'batch3');
assert.deepStrictEqual(deduped3.rejected, []);
assert.strictEqual(deduped3.duplicates.faculties, 1);
assert.strictEqual(deduped3.duplicates.courses, 1);
assert.strictEqual(sql3, buildBatchSql(deduped3));
const batch3Code = structuredClone(batch3Input);
batch3Code.courses.rows[0].course_code = '001-A';
assert(buildBatchSql(validateBatch(batch3Code, undefined, 'batch3')).includes("'001-A'"));
const batch3Quote = structuredClone(batch3Input);
batch3Quote.courses.rows[0].notes = "Owner's source note";
assert(buildBatchSql(validateBatch(batch3Quote, undefined, 'batch3')).includes("Owner''s source note"));
console.log('Batch 3 rejection/deduplication passed: unlisted/missing placeholder faculty, missing source, teacher, level, verification, excluded BAAU courses, changed cities, wrong/missing/duplicate university names, exact duplicates, text codes and SQL quoting.');

const batch3Digest = '5a9a36d2ed62722489dbce7becc4681027f0e7f07d564c000081409a53ab2866';
assert.strictEqual(crypto.createHash('sha256').update(sql3).digest('hex'), batch3Digest);
assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(path.join(batch3Dir, 'import.sql'))).digest('hex'), batch3Digest);
console.log('Batch 3 regression passed: regenerated and committed SQL match the pre-Batch-4 SHA-256 baseline.');

const { names: batch4Names, droppedTitles } = require('./catalog/build-batch4-sql');
const batch4Dir = path.join(__dirname, 'catalog/batch4');
const batch4Input = loadBatch(batch4Dir);
const batch4 = validateBatch(batch4Input, undefined, 'batch4');
assert.deepStrictEqual(batch4.rejected, []);
for (const [file, count] of [['universities', 2], ['existing-universities', 1], ['faculties', 5], ['courses', 37], ['logos', 3]]) {
  assert.strictEqual(batch4Input[file].read, count);
  assert.strictEqual(batch4.rows[file].length, count);
}
assert.deepStrictEqual(batch4.rows.universities.map((u) => u.university_name), [batch4Names[0], batch4Names[2]]);
assert.strictEqual(batch4.rows['existing-universities'][0].university_name, 'Xəzər Universiteti');
assert.strictEqual(batch4.rows['existing-universities'][0].status, 'existing');
for (const [index, count] of [[0, 10], [1, 20], [2, 7]]) {
  assert.strictEqual(batch4.rows.courses.filter((c) => c.university_name === batch4Names[index]).length, count);
}
assert(batch4.rows.universities[0].notes.includes('Azərbaycan Respublikası Dövlət Gömrük Komitəsinin Akademiyası'));
assert(batch4.rows.universities[1].notes.includes('Üzeyir Hacıbəyli adına Bakı Musiqi Akademiyası'));
for (const excluded of ['Qafqaz Universiteti', 'Azərbaycan Beynəlxalq Universiteti']) {
  assert(Object.values(batch4.rows).every((rows) => rows.every((row) => row.university_name !== excluded)));
}
assert(batch4.rows.courses.every((c) => !droppedTitles.includes(c.course_name)));
assert.deepStrictEqual(batch4.rows.courses.filter((c) => c.university_name === batch4Names[2]).map((c) => c.course_name),
  ['Ихтисас', 'İxtisasa giriş', 'Nəzəri musiqişünaslıq', 'Полифонийа', 'Pedaqoji təcrübə', 'Щармонийа', 'Солфежио']);
assert(batch4.rows.courses.some((c) => c.course_name === 'Fundamentals of Computer programming'));
assert(batch4.rows.courses.some((c) => c.course_name === 'English Foundations-1'));
assert(batch4.rows.courses.some((c) => c.course_name === 'English Foundations 1'));
const sql4 = buildBatchSql(batch4);
assert(sql4.startsWith('begin;\n') && sql4.endsWith('commit;\n'));
assert(!/logo_url|\/img\/|\b(update|delete|alter|drop)\b|\b(users|enrollments|study_plans|teacher|room|schedule_text)\b/i.test(sql4));
assert(!/\b(id|university_id)\s*=\s*\d+/.test(sql4));
assert.strictEqual((sql4.match(/insert into universities/g) || []).length, 2);
assert.strictEqual((sql4.match(/insert into faculties/g) || []).length, 5);
assert.strictEqual((sql4.match(/insert into courses/g) || []).length, 37);
assert.strictEqual((sql4.match(/where not exists|and not exists/g) || []).length, 44);
for (const [index, count] of [[0, 0], [1, 1], [2, 0]]) {
  assert(sql4.includes("from universities where name = '" + batch4Names[index] + "') <> " + count + ' then'));
}
assert(sql4.includes('c.faculty_id = f.id and c.name =') && sql4.includes('c.source_url ='));
assert.strictEqual(sql4, buildBatchSql(validateBatch(loadBatch(batch4Dir), undefined, 'batch4')));
assert(Buffer.from(sql4).equals(fs.readFileSync(path.join(batch4Dir, 'import.sql'))));
const live4 = [{ id: 9, name: batch4Names[1] }];
assert.strictEqual(sql4, buildBatchSql(validateBatch(batch4Input, live4, 'batch4')));
const metadata4 = structuredClone(batch4Input);
metadata4.logos.rows[0].logo_image_url = '';
metadata4.logos.rows[0].notes = 'Held metadata';
assert.strictEqual(sql4, buildBatchSql(validateBatch(metadata4, undefined, 'batch4')));
console.log('Batch 4 passed: 2 new universities, 1 existing reference, 5 faculties, 37 courses (10/20/7), 3 metadata logos; exclusions and exact source spellings/official notes preserved.');
console.log('Batch 4 SQL passed: zero/one/zero existence prechecks, 44 guarded inserts, exact-name lookups, one transaction, no logos or existing-row changes, byte-identical generation.');

function expectBatch4Rejected(change, pattern, live) {
  const data = structuredClone(batch4Input);
  change(data);
  const result = validateBatch(data, live, 'batch4');
  assert(result.rejected.some((r) => pattern.test(r.reason)));
  assert(result.rejected.every((r) => r.file.endsWith('.csv') && Number.isInteger(r.line)));
  assert.throws(() => buildBatchSql(result), /rejected rows/);
}
expectBatch4Rejected((d) => { d.courses.rows[0].faculty_name = 'Unknown'; }, /faculty must match/);
expectBatch4Rejected((d) => { d.courses.rows[0].source_url = ''; }, /missing source_url/);
expectBatch4Rejected((d) => { d.courses.rows[0].teacher = 'Not allowed'; }, /teacher must be blank/);
expectBatch4Rejected((d) => { d.courses.rows[0].level = 'master'; }, /level must be bachelor/);
expectBatch4Rejected((d) => { d.courses.rows[0].verified = 'no'; }, /verified must be yes/);
expectBatch4Rejected((d) => { d.courses.rows[0].university_name = 'Qafqaz Universiteti'; }, /not an approved/);
expectBatch4Rejected((d) => { d.courses.rows[0].university_name = 'Azərbaycan Beynəlxalq Universiteti'; }, /not an approved/);
for (const title of droppedTitles) expectBatch4Rejected((d) => { d.courses.rows[30].course_name = title; }, /corrupted Music/);
expectBatch4Rejected((d) => { d.universities.rows[0].notes = ''; }, /official name/);
expectBatch4Rejected((d) => { d['existing-universities'].rows[0].status = 'new'; }, /marked existing/);
expectBatch4Rejected((d) => { d.courses.rows[10].notes = 'Missing required suffix'; }, /note suffix/);
expectBatch4Rejected(() => {}, /expected 1 live matches; found 0/, []);
expectBatch4Rejected(() => {}, /expected 1 live matches; found 2/, [...live4, ...live4]);
for (const name of [batch4Names[0], batch4Names[2]]) expectBatch4Rejected(() => {}, /expected 0 live matches; found 1/, [...live4, { name, id: 100 }]);
const duplicate4 = structuredClone(batch4Input);
duplicate4.faculties.rows.push({ ...duplicate4.faculties.rows[0], line: 7 });
duplicate4.courses.rows.push({ ...duplicate4.courses.rows[0], line: 39 });
assert.strictEqual(sql4, buildBatchSql(validateBatch(duplicate4, undefined, 'batch4')));
const quote4 = structuredClone(batch4Input);
quote4.courses.rows[0].notes = "Owner's source note";
assert(buildBatchSql(validateBatch(quote4, undefined, 'batch4')).includes("Owner''s source note"));
console.log('Batch 4 rejection tests passed: unlisted faculty, source/teacher/level/verification, excluded universities/titles, missing official notes, existing reference, curriculum suffix, missing/duplicate/unexpected live universities; deduplication and SQL quoting passed.');
