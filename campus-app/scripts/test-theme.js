const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../public/js/theme.js'), 'utf8');
function browser(saved, options = {}) {
  const documentEvents = {};
  const windowEvents = {};
  const status = { textContent: '' };
  const inputs = ['light', 'dark'].map(value => ({
    value, checked: false,
    addEventListener(type, callback) { this[type] = callback; }
  }));
  const document = {
    documentElement: { dataset: {} },
    querySelectorAll() { return inputs; },
    getElementById() { return status; },
    addEventListener(type, callback) { documentEvents[type] = callback; }
  };
  let stored = saved;
  const window = {
    matchMedia() { return { matches: Boolean(options.darkSystem) }; },
    localStorage: {
      getItem() { if (options.blockStorage) throw new Error('Unavailable'); return stored; },
      setItem(key, value) { if (options.blockStorage) throw new Error('Unavailable'); stored = value; }
    },
    addEventListener(type, callback) { windowEvents[type] = callback; }
  };
  vm.runInNewContext(source, { window, document });
  return {
    document, inputs, status,
    ready() { documentEvents.DOMContentLoaded(); },
    choose(value) { const input = inputs.find(item => item.value === value); input.checked = true; input.change(); },
    storage(value) { windowEvents.storage({ key: 'lotus-theme', newValue: value }); },
    stored() { return stored; }
  };
}

let page = browser('dark');
assert.equal(page.document.documentElement.dataset.theme, 'dark', 'Saved theme applies before DOMContentLoaded');
page.ready();
assert.equal(page.inputs[1].checked, true);
page.choose('light');
assert.equal(page.document.documentElement.dataset.theme, 'light');
assert.equal(page.stored(), 'light');
assert.equal(page.inputs[0].checked, true);
assert.equal(page.inputs[1].checked, false);
assert.match(page.status.textContent, /saved/i);
assert.equal(browser(page.stored()).document.documentElement.dataset.theme, 'light', 'Theme survives navigation');
page.storage('dark');
assert.equal(page.document.documentElement.dataset.theme, 'dark', 'Other tabs follow saved changes');
page.storage('invalid');
assert.equal(page.document.documentElement.dataset.theme, 'dark');
assert.equal(browser('invalid', { darkSystem: true }).document.documentElement.dataset.theme, 'dark');
assert.equal(browser(null).document.documentElement.dataset.theme, 'light');
page = browser(null, { blockStorage: true });
page.ready();
page.choose('dark');
assert.equal(page.document.documentElement.dataset.theme, 'dark');
assert.match(page.status.textContent, /could not be saved/i);
console.log('Theme tests passed: pre-paint preference, selection, persistence, cross-tab sync, system fallback, invalid values and blocked storage.');
