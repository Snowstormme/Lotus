const assert = require('assert');
const { matchStudyPartners } = require('../netlify/functions/_matching');

const partners = matchStudyPartners({
  requestingUserId: 1,
  users: [
    { id: 1, name: 'Demo Student', year: 2, is_demo: true },
    { id: 2, name: 'Study Partner', year: 3, is_demo: true }
  ],
  enrollments: [
    { user_id: 1, course_id: 1, course_code: 'MATH201' },
    { user_id: 2, course_id: 1, course_code: 'MATH201' }
  ],
  slots: [
    { user_id: 1, weekday: 1, start_time: '14:00', end_time: '16:00' },
    { user_id: 2, weekday: 1, start_time: '13:00', end_time: '15:00' }
  ]
});

assert.strictEqual(partners.length, 1);
assert.deepStrictEqual(partners[0].shared_courses, ['MATH201']);
assert.deepStrictEqual(partners[0].overlapping_free_times, ['Tue 14:00-15:00']);
console.log('Matching test passed: one shared course and one overlapping slot.');
