const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function run() {
  const source = fs.readFileSync(path.join(__dirname, '../public/js/ui.js'), 'utf8');
  const originalDocument = global.document;
  function element(tag, namespace) {
    return {
      tag, namespace, attributes: {}, children: [], textContent: '',
      setAttribute(name, value) { this.attributes[name] = value; },
      appendChild(child) { this.children.push(child); return child; },
      append(...children) { this.children.push(...children); }
    };
  }
  global.document = {
    createElement: tag => element(tag),
    createElementNS: (namespace, tag) => element(tag, namespace)
  };
  try {
    const { icon, initials, dateBadge } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
    const svg = icon('messages');
    assert.equal(svg.namespace, 'http://www.w3.org/2000/svg');
    assert.equal(svg.children[0].namespace, svg.namespace);
    assert.equal(svg.children[0].attributes.href, '/img/icons.svg#messages');
    assert.equal(svg.attributes['aria-hidden'], 'true');
    assert.equal(initials('  Preview   Student  '), 'PS');
    assert.equal(initials('Əli Məmmədov'), 'ƏM');
    assert.equal(initials(''), 'S');
    // 21:30 UTC is already the next calendar day in Baku.
    const date = dateBadge('2026-10-27T21:30:00Z');
    assert.equal(date.children[0].textContent, 'Oct');
    assert.equal(date.children[1].textContent, '28');
    const invalid = dateBadge('not a date');
    assert.equal(invalid.textContent, '—');
    assert.equal(invalid.attributes['aria-label'], 'Date unavailable');
    assert.equal(dateBadge(null).textContent, '—');
    assert.equal(dateBadge('').textContent, '—');
    assert.ok(!source.includes('innerHTML'), 'Presentation helpers must use safe DOM text');
    console.log('UI tests passed: SVG namespaces and sprite references, initials, Baku date rollover, invalid dates and safe DOM construction.');
  } finally {
    global.document = originalDocument;
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
