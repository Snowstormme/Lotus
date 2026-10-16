const fs = require('fs');
const path = require('path');

const catalogDir = __dirname;
const inputPath = path.join(catalogDir, 'universities-courses.csv');
const outputPath = path.join(catalogDir, 'import.sql');
const header = ['university_name', 'city', 'faculty_name', 'course_code', 'course_name', 'teacher', 'source_url', 'level', 'notes'];

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}

function parseCatalog(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim() !== '');
  if (!lines.length || lines[0].trim() !== header.join(',')) {
    throw new Error('CSV header does not match the required column order.');
  }
  const rows = [];
  const rejected = [];
  lines.slice(1).forEach((line, index) => {
    const rowNumber = index + 2;
    const urlMatch = line.match(/,(https?:\/\/[^,]+),bachelor,(.*)$/);
    if (!urlMatch) {
      rejected.push({ row: rowNumber, reason: 'missing source_url or level is not bachelor' });
      return;
    }
    const left = parseCsvLine(line.slice(0, urlMatch.index));
    const row = {
      university_name: left[0] || '',
      city: left[1] || '',
      faculty_name: (left[2] || '').trim() || 'Faculty not specified',
      course_code: left[3] || '',
      course_name: left.slice(4, -1).join(',') || '',
      teacher: left[left.length - 1] || '',
      source_url: urlMatch[1],
      level: 'bachelor',
      notes: urlMatch[2] || ''
    };
    const missing = ['university_name', 'city', 'course_name', 'source_url'].filter((field) => !row[field].trim());
    if (missing.length) {
      rejected.push({ row: rowNumber, reason: 'missing ' + missing.join(', ') });
      return;
    }
    rows.push(row);
  });
  const seen = new Set();
  const unique = rows.filter((row) => {
    const key = [row.university_name, row.faculty_name, row.course_name].join('\u0000');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { rows: unique, rejected, duplicateCount: rows.length - unique.length };
}

function sqlString(value) {
  return "'" + String(value == null ? '' : value).replace(/'/g, "''") + "'";
}

function buildSql(rows) {
  const universities = new Map();
  const faculties = new Map();
  rows.forEach((row) => {
    universities.set(row.university_name, row.city);
    const faculty = row.faculty_name.trim() || 'Faculty not specified';
    faculties.set(row.university_name + '\u0000' + faculty, { university: row.university_name, name: faculty });
  });
  const lines = [
    'begin;',
    '',
    '-- Generated from universities-courses.csv. No student, enrollment, or sample data is inserted.'
  ];
  universities.forEach((city, name) => {
    lines.push('insert into universities (name, city) select ' + sqlString(name) + ', ' + sqlString(city) + ' where not exists (select 1 from universities where name = ' + sqlString(name) + ');');
  });
  faculties.forEach((faculty) => {
    lines.push('insert into faculties (university_id, name) select u.id, ' + sqlString(faculty.name) + ' from universities u where u.name = ' + sqlString(faculty.university) + ' and not exists (select 1 from faculties f where f.university_id = u.id and f.name = ' + sqlString(faculty.name) + ');');
  });
  rows.forEach((row) => {
    const faculty = row.faculty_name.trim() || 'Faculty not specified';
    lines.push('insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note) select f.id, ' + sqlString(row.course_code) + ', ' + sqlString(row.course_name) + ', true, ' + sqlString(row.level) + ', ' + sqlString(row.source_url) + ', ' + sqlString(row.notes) + ' from faculties f join universities u on u.id = f.university_id where u.name = ' + sqlString(row.university_name) + ' and f.name = ' + sqlString(faculty) + ' and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = ' + sqlString(row.course_name) + ');');
  });
  lines.push('', 'commit;', '');
  return { sql: lines.join('\n'), universityCount: universities.size, facultyCount: faculties.size, courseCount: rows.length };
}

function main() {
  const parsed = parseCatalog(fs.readFileSync(inputPath, 'utf8'));
  const result = buildSql(parsed.rows);
  fs.writeFileSync(outputPath, result.sql);
  console.log('Rows accepted: ' + parsed.rows.length);
  console.log('Exact duplicates removed: ' + parsed.duplicateCount);
  console.log('Rejected rows: ' + parsed.rejected.length);
  parsed.rejected.forEach((item) => console.log('  row ' + item.row + ': ' + item.reason));
  console.log('Universities to insert if absent: ' + result.universityCount);
  console.log('Faculties to insert if absent: ' + result.facultyCount);
  console.log('Courses to insert if absent: ' + result.courseCount);
  console.log('Wrote ' + path.relative(process.cwd(), outputPath));
}

if (require.main === module) main();
module.exports = { parseCatalog, buildSql };
