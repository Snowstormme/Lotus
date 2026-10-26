// Batch 4 has two new universities and one exact-name reference to an existing row.
const names = ['Azərbaycan Dövlət Gömrük Universiteti', 'Xəzər Universiteti', 'Azərbaycan Dövlət Musiqi Akademiyası'];
const droppedTitles = ['Тящлил', 'Нязяри fənnlərin тядрис методикасы', 'Хцсуси педагоъи щязарлыг'];
const facultyNames = [
  [names[0], 'Faculty not specified'],
  [names[1], 'School of Science and Engineering'],
  [names[1], 'School of Economics and Management'],
  [names[2], 'Fortepiano fakültəsi'],
  [names[2], 'Tarix-nəzəriyyə fakültəsi']
];
const config = {
  name: 'batch4', label: 'Batch 4', approvedNames: names,
  headers: {
    universities: 'university_name,city,official_website,source_page,verified,notes',
    'existing-universities': 'university_name,status',
    faculties: 'university_name,faculty_name,source_page,verified,notes',
    courses: 'university_name,faculty_name,course_code,course_name,teacher,source_url,level,verified,notes',
    logos: 'university_name,logo_source_page,logo_image_url,file_type,transparent_background,verified_on_page,notes'
  },
  counts: { universities: 2, 'existing-universities': 1, faculties: 5, courses: 37, logos: 3 }
};

function validate(input, live) {
  const rejected = Object.values(input).flatMap((file) => file.rejected);
  const rows = {}, duplicates = {};
  const reject = (file, row, reason) => rejected.push({ file: file + '.csv', line: row.line, reason });
  if (live !== undefined && !Array.isArray(live)) throw new Error('University lookup did not return a university list.');
  for (const file of Object.keys(config.headers)) {
    const seen = new Set();
    duplicates[file] = 0;
    rows[file] = input[file].rows.filter((row) => {
      const reasons = [];
      if (!names.includes(row.university_name)) reasons.push('university is not an approved Batch 4 name');
      if (Object.values(row).some((v) => typeof v === 'string' && v.includes('\u0000'))) reasons.push('NUL characters are not allowed');
      const required = file === 'existing-universities' ? ['university_name', 'status']
        : file === 'universities' ? ['university_name', 'city', 'official_website', 'source_page']
          : file === 'faculties' ? ['university_name', 'faculty_name', 'source_page']
            : file === 'courses' ? ['university_name', 'faculty_name', 'course_name', 'source_url']
              : ['university_name', 'logo_source_page'];
      for (const key of required) if (!row[key].trim()) reasons.push('missing ' + key);
      for (const key of ['university_name', 'faculty_name', 'course_name']) {
        if (row[key] !== undefined && row[key] !== row[key].trim()) reasons.push(key + ' has surrounding whitespace');
      }
      for (const key of ['source_url', 'source_page', 'official_website']) {
        if (!row[key]) continue;
        try { if (!['http:', 'https:'].includes(new URL(row[key]).protocol)) throw new Error(); }
        catch { reasons.push(key + ' must be an HTTP(S) URL'); }
      }
      if (['universities', 'faculties', 'courses'].includes(file) && row.verified !== 'yes') reasons.push('verified must be yes');
      if (file === 'universities') {
        if (![names[0], names[2]].includes(row.university_name)) reasons.push('only Customs and Music may be inserted');
        if (row.city !== 'Bakı') reasons.push('city must remain Bakı');
        const official = row.university_name === names[0]
          ? 'Azərbaycan Respublikası Dövlət Gömrük Komitəsinin Akademiyası'
          : 'Üzeyir Hacıbəyli adına Bakı Musiqi Akademiyası';
        if (!row.notes.includes(official)) reasons.push('official name must remain in notes');
      }
      if (file === 'existing-universities' && (row.university_name !== names[1] || row.status !== 'existing')) reasons.push('Xəzər must be marked existing');
      if (file === 'courses') {
        if (row.teacher !== '') reasons.push('teacher must be blank');
        if (row.level !== 'bachelor') reasons.push('level must be bachelor');
        if (droppedTitles.includes(row.course_name)) reasons.push('corrupted Music title is excluded');
        if (!rows.faculties.some((f) => f.university_name === row.university_name && f.faculty_name === row.faculty_name)) reasons.push('faculty must match faculties.csv at the same university');
        if (row.university_name === names[1]) {
          const suffix = row.faculty_name === 'School of Economics and Management'
            ? '2020 degree plan; confirm current offering' : 'Computer Science curriculum; confirm current offering';
          if (!row.notes.endsWith(suffix)) reasons.push('required curriculum note suffix missing');
        }
      }
      if (file === 'faculties' && row.university_name === names[1] && row.faculty_name === 'Faculty not specified') reasons.push('existing Xəzər placeholder must not be inserted');
      if (file === 'faculties' && !facultyNames.some(([u, f]) => u === row.university_name && f === row.faculty_name)) reasons.push('faculty is not an approved Batch 4 name');
      const keys = file === 'faculties' ? ['university_name', 'faculty_name']
        : file === 'courses' ? ['university_name', 'faculty_name', 'course_name', 'source_url'] : ['university_name'];
      const key = JSON.stringify(keys.map((k) => row[k]));
      if (reasons.length) { reject(file, row, reasons.join('; ')); return false; }
      if (seen.has(key)) {
        if (['faculties', 'courses'].includes(file)) duplicates[file] += 1;
        else reject(file, row, 'duplicate university in CSV');
        return false;
      }
      seen.add(key);
      return true;
    });
    if (rows[file].length !== config.counts[file]) reject(file, { line: 1 }, 'expected ' + config.counts[file] + ' accepted rows; found ' + rows[file].length);
  }
  const declared = [...rows.universities, ...rows['existing-universities']];
  for (const name of names) {
    if (declared.filter((r) => r.university_name === name).length !== 1) reject('universities', { line: 1 }, 'expected one declaration for ' + name);
    if (live) {
      const count = live.filter((r) => r.name === name).length;
      const expected = name === names[1] ? 1 : 0;
      if (count !== expected) reject('universities', { line: 1 }, name + ': expected ' + expected + ' live matches; found ' + count);
    }
  }
  for (const [index, expected] of [[0, 10], [1, 20], [2, 7]]) {
    if (rows.courses.filter((r) => r.university_name === names[index]).length !== expected) reject('courses', { line: 1 }, names[index] + ': expected ' + expected + ' courses');
  }
  return { batchName: 'batch4', rows, rejected, duplicates, matched: new Map(), read: Object.fromEntries(Object.entries(input).map(([key, file]) => [key, file.read])) };
}

function quote(value) { return "'" + value.replace(/'/g, "''") + "'"; }

function build(batch) {
  if (batch.rejected.length) throw new Error('Batch 4 has rejected rows; no SQL generated.');
  const lines = ['begin;', '', '-- Batch 4 only. Review before running; no existing rows are changed.', 'do $batch4_check$', 'begin'];
  for (const name of names) {
    const count = name === names[1] ? 1 : 0;
    lines.push('  if (select count(*) from universities where name = ' + quote(name) + ') <> ' + count + ' then',
      "    raise exception 'Batch 4 requires " + (count ? 'exactly one existing university' : 'no existing university') + " named %.', " + quote(name) + ';', '  end if;');
  }
  for (const f of batch.rows.faculties) lines.push('  if (select count(*) from faculties f join universities u on u.id = f.university_id',
    '      where u.name = ' + quote(f.university_name) + ' and f.name = ' + quote(f.faculty_name) + ') > 1 then',
    "    raise exception 'Batch 4 faculty lookup is ambiguous; review existing records.';", '  end if;');
  lines.push('end;', '$batch4_check$;', '');
  for (const u of batch.rows.universities) lines.push('insert into universities (name, city)',
    'select ' + quote(u.university_name) + ', ' + quote(u.city),
    'where not exists (select 1 from universities where name = ' + quote(u.university_name) + ');', '');
  for (const f of batch.rows.faculties) lines.push('insert into faculties (university_id, name)',
    'select u.id, ' + quote(f.faculty_name), 'from universities u where u.name = ' + quote(f.university_name),
    'and not exists (select 1 from faculties f where f.university_id = u.id and f.name = ' + quote(f.faculty_name) + ');', '');
  for (const c of batch.rows.courses) lines.push('insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)',
    'select f.id, ' + [quote(c.course_code), quote(c.course_name), 'true', quote(c.level), quote(c.source_url), quote(c.notes)].join(', '),
    'from faculties f join universities u on u.id = f.university_id',
    'where u.name = ' + quote(c.university_name) + ' and f.name = ' + quote(c.faculty_name),
    'and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = ' + quote(c.course_name) + ' and c.source_url = ' + quote(c.source_url) + ');', '');
  lines.push('commit;', '');
  return lines.join('\n');
}

module.exports = { config, names, droppedTitles, validate, build };
