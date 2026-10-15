const assert = require('assert');
const { estimateMonthlyCost } = require('../netlify/functions/_costs');

const defaults = estimateMonthlyCost({});
assert.strictEqual(defaults.valid, true);
assert.strictEqual(defaults.total_azn, 78);
assert.strictEqual(defaults.is_estimate, true);
assert.strictEqual(defaults.breakdown.length, 4);

const invalid = estimateMonthlyCost({ printed_pages_per_month: 501 });
assert.strictEqual(invalid.valid, false);

console.log('Cost test passed: defaults total 78 AZN and invalid input rejected.');
