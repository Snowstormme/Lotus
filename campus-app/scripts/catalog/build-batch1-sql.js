const fs = require('fs');
const path = require('path');

const batchDir = path.join(__dirname, 'batch1');
const onboardingUrl = 'https://lotus-campus.pages.dev/api/onboarding';
const aztuName = 'Azərbaycan Texniki Universiteti';
const aztuId = 25;
const headers = {
  universities: 'university_name,city,official_website,source_page,verified,notes',
  faculties: 'university_name,faculty_name,source_page,verified,notes',
  courses: 'university_name,faculty_name,course_code,course_name,teacher,source_url,level,verified,notes'
};
const expectedCounts = { universities: 5, faculties: 28, courses: 30 };

// RFC 4180-style fields, including escaped quotes and physical line numbers.
function readCsv(text, file, columns) {
  const records = [];
  const rejected = [];
  let fields = [], value = '', quoted = false, closed = false, line = 1, start = 1;
  const addRecord = () => {
    fields.push(value);
    if (fields.length > 1 || fields[0] !== '' || closed) records.push({ line: start, fields });
    fields = []; value = ''; closed = false; start = line + 1;
  };
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') { value += '"'; i += 1; }
        else { quoted = false; closed = true; }
      } else {
        value += char;
        if (char === '\n') line += 1;
      }
    } else if (char === ',' || char === '\n' || (char === '\r' && input[i + 1] === '\n')) {
      if (char === ',') { fields.push(value); value = ''; closed = false; }
      else { if (char === '\r') i += 1; addRecord(); line += 1; }
    } else if (char === '"' && value === '' && !closed) {
      quoted = true;
    } else if (closed || char === '"' || char === '\u0000' || char === '\r') {
      throw new Error(file + ':' + line + ': invalid CSV character or quoting');
    } else { value += char; }
  }
  if (quoted) throw new Error(file + ':' + start + ': unclosed quoted field');
  if (fields.length || value || closed) addRecord();
  if (!records.length || JSON.stringify(records[0].fields) !== JSON.stringify(columns)) {
    throw new Error(file + ':1: incorrect CSV header');
  }
  const rows = [];
  records.slice(1).forEach((record) => {
    if (record.fields.length !== columns.length) {
      rejected.push({ file, line: record.line, reason: 'incorrect number of columns' });
    } else {
      rows.push({ ...Object.fromEntries(columns.map((key, i) => [key, record.fields[i]])), line: record.line });
    }
  });
  return { rows, read: records.length - 1, rejected };
}

function loadBatch(directory = batchDir) {
  return Object.fromEntries(Object.entries(headers).map(([name, header]) => [name,
    readCsv(fs.readFileSync(path.join(directory, name + '.csv'), 'utf8'), name + '.csv', header.split(','))
  ]));
}

function keyOf(row, keys) { return JSON.stringify(keys.map((key) => row[key])); }

function validateBatch(input, liveUniversities) {
  if (!Array.isArray(liveUniversities)) throw new Error('University lookup did not return a university list.');
  const rejected = Object.values(input).flatMap((file) => file.rejected);
  const rows = {}, duplicates = {}, matched = new Map();
  const reject = (file, row, reason) => rejected.push({ file: file + '.csv', line: row.line, reason });
  for (const name of Object.keys(headers)) {
    const seen = new Set();
    duplicates[name] = 0;
    rows[name] = input[name].rows.filter((row) => {
      const reasons = [];
      if (Object.values(row).some((value) => typeof value === 'string' && value.includes('\u0000'))) reasons.push('NUL characters are not allowed');
      const required = name === 'universities' ? ['university_name', 'city', 'official_website', 'source_page']
        : name === 'faculties' ? ['university_name', 'faculty_name', 'source_page']
          : ['university_name', 'course_name', 'source_url'];
      for (const field of required) if (!row[field].trim()) reasons.push('missing ' + field);
      if (row.verified !== 'yes') reasons.push('verified must be yes');
      for (const field of ['university_name', 'faculty_name', 'course_name']) {
        if (row[field] !== undefined && row[field] !== row[field].trim()) reasons.push(field + ' has surrounding whitespace');
      }
      for (const field of ['source_url', 'source_page', 'official_website']) {
        if (row[field]) {
          try { if (!['http:', 'https:'].includes(new URL(row[field]).protocol)) throw new Error(); }
          catch { reasons.push(field + ' must be an HTTP(S) URL'); }
        }
      }
      if (name === 'universities') {
        const matches = liveUniversities.filter((item) => item.name === row.university_name);
        if (matches.length !== 1) reasons.push('expected exactly one existing university; found ' + matches.length);
        else {
          const id = Number(matches[0].id);
          if (!Number.isSafeInteger(id) || id < 1) reasons.push('invalid existing university id');
          else if (row.university_name === aztuName && id !== aztuId) reasons.push('approved AzTU id must be 25');
          else matched.set(row.university_name, id);
        }
      } else if (!rows.universities.some((item) => item.university_name === row.university_name)) {
        reasons.push('university is not in accepted universities.csv');
      }
      if (name === 'courses') {
        if (row.level !== 'bachelor') reasons.push('level must be bachelor');
        if (row.teacher !== '') reasons.push('teacher must be blank');
        if (row.university_name === aztuName) reasons.push('AzTU courses are excluded from Batch 1');
        if (!rows.faculties.some((item) => item.university_name === row.university_name && item.faculty_name === row.faculty_name)) {
          reasons.push('faculty must match faculties.csv at the same university');
        }
      }
      const keys = name === 'universities' ? ['university_name'] : name === 'faculties'
        ? ['university_name', 'faculty_name'] : ['university_name', 'faculty_name', 'course_name', 'source_url'];
      const key = keyOf(row, keys);
      if (reasons.length) { reject(name, row, reasons.join('; ')); return false; }
      if (seen.has(key)) {
        if (name === 'universities') reject(name, row, 'duplicate university in CSV');
        else duplicates[name] += 1;
        return false;
      }
      seen.add(key);
      return true;
    });
    if (rows[name].length !== expectedCounts[name]) {
      rejected.push({ file: name + '.csv', line: 1, reason: 'expected ' + expectedCounts[name] + ' accepted rows; found ' + rows[name].length });
    }
  }
  if (!rows.universities.some((row) => row.university_name === aztuName)) {
    rejected.push({ file: 'universities.csv', line: 1, reason: 'approved AzTU name is missing' });
  }
  return { rows, matched, rejected, duplicates, read: Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value.read])) };
}

function quote(value) { return "'" + value.replace(/'/g, "''") + "'"; }

function buildBatchSql(batch) {
  if (batch.rejected.length) throw new Error('Batch 1 has rejected rows; no SQL generated.');
  const lines = ['begin;', '', '-- Batch 1 only. Existing universities are required; no university rows are created.',
    '-- Review before running. Guards are rechecked against the database inside this transaction.', 'do $batch1_check$', 'begin'];
  for (const row of batch.rows.universities) {
    const id = batch.matched.get(row.university_name);
    lines.push('  if (select count(*) from universities where name = ' + quote(row.university_name) + ') <> 1',
      '     or not exists (select 1 from universities where id = ' + id + ' and name = ' + quote(row.university_name) + ') then',
      "    raise exception 'Batch 1 university lookup changed; regenerate the import.';", '  end if;');
  }
  for (const row of batch.rows.faculties) {
    lines.push('  if (select count(*) from faculties where university_id = ' + batch.matched.get(row.university_name) + ' and name = ' + quote(row.faculty_name) + ') > 1 then',
      "    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';", '  end if;');
  }
  lines.push('end;', '$batch1_check$;', '');
  for (const row of batch.rows.faculties) {
    const id = batch.matched.get(row.university_name);
    lines.push('insert into faculties (university_id, name)',
      'select ' + id + ', ' + quote(row.faculty_name),
      'where not exists (select 1 from faculties where university_id = ' + id + ' and name = ' + quote(row.faculty_name) + ');', '');
  }
  for (const row of batch.rows.courses) {
    const id = batch.matched.get(row.university_name);
    lines.push('insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)',
      'select f.id, ' + [quote(row.course_code), quote(row.course_name), 'true', quote(row.level), quote(row.source_url), quote(row.notes)].join(', '),
      'from faculties f where f.university_id = ' + id + ' and f.name = ' + quote(row.faculty_name),
      'and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = ' + quote(row.course_name) + ' and c.source_url = ' + quote(row.source_url) + ');', '');
  }
  lines.push('commit;', '');
  return lines.join('\n');
}

async function main() {
  const input = loadBatch();
  // Public GET only: no credentials, environment variables, or SQL execution.
  const response = await fetch(onboardingUrl, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('University lookup failed with HTTP ' + response.status + '; no SQL generated.');
  const live = await response.json();
  const batch = validateBatch(input, live.universities);
  for (const name of Object.keys(headers)) {
    console.log(name + '.csv: rows read ' + batch.read[name] + ', accepted ' + batch.rows[name].length + ', duplicates removed ' + batch.duplicates[name]);
  }
  console.log('Rows rejected: ' + batch.rejected.length);
  batch.rejected.forEach((item) => console.log(item.file + ':' + item.line + ': ' + item.reason));
  if (batch.rejected.length) throw new Error('Batch 1 validation failed; no SQL generated.');
  batch.matched.forEach((id, name) => console.log('Existing university: ' + name + ' = ' + id));
  console.log('Universities to create: 0');
  console.log('AzTU course rows: 0');
  console.log('Faculties to insert if absent: ' + batch.rows.faculties.length);
  console.log('Courses to insert if absent: ' + batch.rows.courses.length);
  const sql = buildBatchSql(batch);
  fs.writeFileSync(path.join(batchDir, 'import.sql'), sql, 'utf8');
  console.log('Wrote scripts/catalog/batch1/import.sql (not executed).');
}

if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { aztuName, aztuId, headers, readCsv, loadBatch, validateBatch, buildBatchSql, main };
