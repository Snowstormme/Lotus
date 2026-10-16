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
