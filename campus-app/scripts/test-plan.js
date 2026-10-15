const assert = require('node:assert/strict');
const { validatePlan } = require('../netlify/functions/_planValidation');

const validPlan = {
  weeks: [{
    week_start: '2026-10-19',
    days: [{ day: 'Mon', tasks: [{ course: 'MATH201', task: 'Review limits', minutes: 45 }] }]
  }],
  summary: 'Review the first upcoming topic.'
};

assert.equal(validatePlan(validPlan, 12), true);
assert.equal(validatePlan({
  ...validPlan,
  weeks: [{
    ...validPlan.weeks[0],
    days: [{ day: 'Mon', tasks: [{ course: 'MATH201', task: 'Invalid task', minutes: -5 }] }]
  }]
}, 12), false);

console.log('Plan test passed: valid plan accepted and invalid minutes rejected.');
