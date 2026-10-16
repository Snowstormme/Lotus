import assert from 'node:assert/strict';
import { getBakuDateKey, formatBakuDateTime } from '../public/js/dates.js';

assert.equal(getBakuDateKey('2026-10-20T00:30:00Z'), '2026-10-20');
assert.equal(getBakuDateKey('2026-10-19T21:30:00Z'), '2026-10-20');
assert.match(formatBakuDateTime('2026-10-19T21:30:00Z'), /^Oct 20, 01:30$/);
console.log('Date tests passed: both UTC timestamps match October 20 in Asia/Baku.');
