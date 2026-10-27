const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const source = fs.readFileSync(path.join(__dirname, '../lib/_groups.js'), 'utf8');
  const { canSeeGroup, canJoinGroup } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const enrolled = new Set([7]);
  const group = { kind: 'university', university_id: 1 };
  assert.equal(canSeeGroup(group, enrolled), true);
  assert.equal(canJoinGroup(group, { university_id: 1 }, enrolled), true);
  assert.equal(canJoinGroup(group, { university_id: '1' }, enrolled), true);
  assert.equal(canJoinGroup(group, { university_id: 2 }, enrolled), false);
  assert.equal(canJoinGroup(group, { university_id: null }, enrolled), false);
  assert.equal(canJoinGroup({ kind: 'university', university_id: null }, { university_id: null }, enrolled), false);
  assert.equal(canSeeGroup({ kind: 'course', course_id: 7 }, enrolled), true);
  assert.equal(canJoinGroup({ kind: 'course', course_id: 8 }, { university_id: 1 }, enrolled), false);
  assert.equal(canJoinGroup({ kind: 'club' }, { university_id: 2 }, enrolled), true);
  assert.equal(canSeeGroup({ kind: 'unknown' }, enrolled), false);
  console.log('Group access tests passed: university discovery, own-university joins, missing affiliation, course restrictions, and clubs.');
})().catch(error => { console.error(error); process.exitCode = 1; });
