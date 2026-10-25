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
const expectedCounts = { universities: 5, faculties: 27, courses: 30 };
const batch2Names = [
  'Azərbaycan Tibb Universiteti',
  'Bakı Slavyan Universiteti',
  'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti',
  'Türkiyə-Azərbaycan Universiteti',
  'Azərbaycan Turizm və Menecment Universiteti'
];

function getBatchConfig(directory = batchDir) {
  const name = path.basename(path.resolve(directory));
  if (!['batch1', 'batch2'].includes(name)) throw new Error('Expected a batch1 or batch2 directory.');
  return {
    name,
    label: name === 'batch1' ? 'Batch 1' : 'Batch 2',
    headers: name === 'batch1' ? headers : {
      ...headers,
      logos: 'university_name,logo_source_page,logo_image_url,file_type,transparent_background,verified_on_page,notes'
    },
    counts: name === 'batch1' ? expectedCounts : { universities: 5, faculties: 8, courses: 17, logos: 5 }
  };
}

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
  return Object.fromEntries(Object.entries(getBatchConfig(directory).headers).map(([name, header]) => [name,
    readCsv(fs.readFileSync(path.join(directory, name + '.csv'), 'utf8'), name + '.csv', header.split(','))
  ]));
}

function keyOf(row, keys) { return JSON.stringify(keys.map((key) => row[key])); }

function validateBatch(input, liveUniversities, batchName = 'batch1') {
  const config = getBatchConfig(batchName);
  // Batch 2 can be prepared offline; its SQL precheck enforces live identities.
  // If a live list is supplied, missing or ambiguous exact matches also reject it here.
  if ((batchName === 'batch1' || liveUniversities !== undefined) && !Array.isArray(liveUniversities)) {
    throw new Error('University lookup did not return a university list.');
  }
  const rejected = Object.values(input).flatMap((file) => file.rejected);
  const rows = {}, duplicates = {}, matched = new Map();
  const reject = (file, row, reason) => rejected.push({ file: file + '.csv', line: row.line, reason });
  for (const name of Object.keys(config.headers)) {
    const seen = new Set();
    duplicates[name] = 0;
    rows[name] = input[name].rows.filter((row) => {
      const reasons = [];
      if (Object.values(row).some((value) => typeof value === 'string' && value.includes('\u0000'))) reasons.push('NUL characters are not allowed');
      const required = name === 'logos' ? ['university_name', 'logo_source_page']
        : name === 'universities' ? ['university_name', 'city', 'official_website', 'source_page']
        : name === 'faculties' ? ['university_name', 'faculty_name', 'source_page']
          : ['university_name', 'course_name', 'source_url'];
      for (const field of required) if (!row[field].trim()) reasons.push('missing ' + field);
      if (name !== 'logos' && row.verified !== 'yes') reasons.push('verified must be yes');
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
        if (batchName === 'batch2' && !batch2Names.includes(row.university_name)) reasons.push('university is not an approved Batch 2 exact name');
        if (liveUniversities) {
          const matches = liveUniversities.filter((item) => item.name === row.university_name);
          if (matches.length !== 1) reasons.push('expected exactly one existing university; found ' + matches.length);
          else {
            const id = Number(matches[0].id);
            if (!Number.isSafeInteger(id) || id < 1) reasons.push('invalid existing university id');
            else if (batchName === 'batch1' && row.university_name === aztuName && id !== aztuId) reasons.push('approved AzTU id must be 25');
            else matched.set(row.university_name, id);
          }
        }
      } else if (!rows.universities.some((item) => item.university_name === row.university_name)) {
        reasons.push('university is not in accepted universities.csv');
      }
      if (name === 'courses') {
        if (row.level !== 'bachelor') reasons.push('level must be bachelor');
        if (row.teacher !== '') reasons.push('teacher must be blank');
        if (batchName === 'batch1' && row.university_name === aztuName) reasons.push('AzTU courses are excluded from Batch 1');
        if (!rows.faculties.some((item) => item.university_name === row.university_name && item.faculty_name === row.faculty_name)) {
          reasons.push('faculty must match faculties.csv at the same university');
        }
      }
      const keys = ['universities', 'logos'].includes(name) ? ['university_name'] : name === 'faculties'
        ? ['university_name', 'faculty_name'] : ['university_name', 'faculty_name', 'course_name', 'source_url'];
      const key = keyOf(row, keys);
      if (reasons.length) { reject(name, row, reasons.join('; ')); return false; }
      if (seen.has(key)) {
        if (['universities', 'logos'].includes(name)) reject(name, row, 'duplicate university in CSV');
        else duplicates[name] += 1;
        return false;
      }
      seen.add(key);
      return true;
    });
    if (rows[name].length !== config.counts[name]) {
      rejected.push({ file: name + '.csv', line: 1, reason: 'expected ' + config.counts[name] + ' accepted rows; found ' + rows[name].length });
    }
  }
  if (batchName === 'batch1' && !rows.universities.some((row) => row.university_name === aztuName)) {
    rejected.push({ file: 'universities.csv', line: 1, reason: 'approved AzTU name is missing' });
  }
  return { batchName, rows, matched, rejected, duplicates, read: Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value.read])) };
}

function quote(value) { return "'" + value.replace(/'/g, "''") + "'"; }

function buildBatchSql(batch) {
  if (batch.batchName === 'batch2') return buildBatch2Sql(batch);
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

function buildBatch2Sql(batch) {
  if (batch.rejected.length) throw new Error('Batch 2 has rejected rows; no SQL generated.');
  const lines = ['begin;', '', '-- Batch 2 only. Exact-name lookups; existing rows are never changed.',
    '-- All five universities must already exist exactly once before this file is run.',
    'do $batch2_check$', 'begin'];
  for (const name of batch2Names) {
    lines.push('  if (select count(*) from universities where name = ' + quote(name) + ') <> 1 then',
      "    raise exception 'Batch 2 requires exactly one university named %.', " + quote(name) + ';', '  end if;');
  }
  for (const row of batch.rows.faculties) {
    lines.push('  if (select count(*) from faculties f join universities u on u.id = f.university_id',
      '      where u.name = ' + quote(row.university_name) + ' and f.name = ' + quote(row.faculty_name) + ') > 1 then',
      "    raise exception 'Batch 2 faculty lookup is ambiguous; review existing records.';", '  end if;');
  }
  lines.push('end;', '$batch2_check$;', '');
  for (const row of batch.rows.faculties) {
    lines.push('insert into faculties (university_id, name)',
      'select u.id, ' + quote(row.faculty_name),
      'from universities u where u.name = ' + quote(row.university_name),
      'and not exists (select 1 from faculties f where f.university_id = u.id and f.name = ' + quote(row.faculty_name) + ');', '');
  }
  for (const row of batch.rows.courses) {
    lines.push('insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)',
      'select f.id, ' + [quote(row.course_code), quote(row.course_name), 'true', quote(row.level), quote(row.source_url), quote(row.notes)].join(', '),
      'from faculties f join universities u on u.id = f.university_id',
      'where u.name = ' + quote(row.university_name) + ' and f.name = ' + quote(row.faculty_name),
      'and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = ' + quote(row.course_name) + ' and c.source_url = ' + quote(row.source_url) + ');', '');
  }
  lines.push('commit;', '');
  return lines.join('\n');
}

async function main(directory = batchDir) {
  const config = getBatchConfig(directory);
  const input = loadBatch(directory);
  let universities;
  // Public GET only: no credentials, environment variables, or SQL execution.
  if (config.name === 'batch1') {
    const response = await fetch(onboardingUrl, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('University lookup failed with HTTP ' + response.status + '; no SQL generated.');
    const live = await response.json();
    universities = live.universities;
  }
  const batch = validateBatch(input, universities, config.name);
  for (const name of Object.keys(config.headers)) {
    console.log(name + '.csv: rows read ' + batch.read[name] + ', accepted ' + batch.rows[name].length + ', duplicates removed ' + batch.duplicates[name]);
  }
  console.log('Rows rejected: ' + batch.rejected.length);
  batch.rejected.forEach((item) => console.log(item.file + ':' + item.line + ': ' + item.reason));
  if (batch.rejected.length) throw new Error(config.label + ' validation failed; no SQL generated.');
  batch.matched.forEach((id, name) => console.log('Existing university: ' + name + ' = ' + id));
  console.log('Universities to create: 0');
  if (config.name === 'batch1') console.log('AzTU course rows: 0');
  else {
    console.log('Live university existence: deferred to the SQL precheck; not checked by offline generation.');
    console.log('Logo rows: metadata only; not imported.');
  }
  console.log('Faculties to insert if absent: ' + batch.rows.faculties.length);
  console.log('Courses to insert if absent: ' + batch.rows.courses.length);
  const sql = buildBatchSql(batch);
  fs.writeFileSync(path.join(directory, 'import.sql'), sql, 'utf8');
  console.log('Wrote scripts/catalog/' + config.name + '/import.sql (not executed).');
}

if (require.main === module) main(process.argv[2]).catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { aztuName, aztuId, headers, batch2Names, readCsv, loadBatch, validateBatch, buildBatchSql, main };
