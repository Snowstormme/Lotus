const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../public/js/settings-page.js'), 'utf8').replace(/^import .*;\n/, '').replace(/loadSettings\(\);\s*$/, 'globalThis.loaded = loadSettings();');

function page(options = {}) {
  const elements = new Map();
  const requests = [];
  let destination = null;
  const context = vm.createContext({
    document: { getElementById(id) {
      if (!elements.has(id)) elements.set(id, { disabled: true, hidden: false, checked: false, textContent: '', addEventListener(type, fn) { this[type] = fn; } });
      return elements.get(id);
    } },
    window: { location: { replace(url) { destination = url; } } },
    getSession: async () => options.loggedOut ? null : { access_token: 'fixture', user: { id: 'fixture' } },
    getOwnProfile: async () => { if (options.loadFails) throw Error('Load failed'); return { allow_messages: options.initial !== false }; },
    signOut: async () => { if (options.logoutFails) throw Error('Logout failed'); },
    fetch: async (url, request) => { requests.push({ url, ...request }); return { ok: !options.saveFails }; }
  });
  vm.runInContext(source, context);
  return { options, elements, requests, context, destination: () => destination };
}

(async () => {
  const saved = page(); await saved.context.loaded;
  const toggle = saved.elements.get('allow-messages');
  assert.equal(toggle.checked, true); assert.equal(toggle.disabled, false);
  toggle.checked = false;
  const saving = toggle.change();
  assert.equal(toggle.disabled, true);
  await saving;
  assert.equal(saved.requests[0].url, '/api/profile');
  assert.equal(saved.requests[0].method, 'PUT');
  assert.deepEqual(JSON.parse(saved.requests[0].body), { allow_messages: false }, 'Saving must not overwrite other profile fields');
  assert.equal(toggle.checked, false); assert.equal(toggle.disabled, false);
  assert.match(saved.elements.get('messaging-status').textContent, /saved/);
  await saved.elements.get('settings-logout').click();
  assert.equal(saved.destination(), 'index.html');

  const failed = page({ initial: false, saveFails: true, logoutFails: true }); await failed.context.loaded;
  const failedToggle = failed.elements.get('allow-messages'); failedToggle.checked = true;
  await failedToggle.change(); assert.equal(failedToggle.checked, false); assert.equal(failedToggle.disabled, false);
  assert.match(failed.elements.get('messaging-status').textContent, /Could not save/);
  await failed.elements.get('settings-logout').click(); assert.equal(failed.destination(), null);
  assert.equal(failed.elements.get('settings-logout').disabled, false);

  const visitor = page({ loggedOut: true }); await visitor.context.loaded;
  assert.equal(visitor.elements.get('allow-messages').disabled, true);
  assert.equal(visitor.elements.get('settings-logout').disabled, true);
  assert.equal(visitor.elements.get('settings-login').hidden, false);
  assert.equal(visitor.requests.length, 0);

  const retry = page({ loadFails: true }); await retry.context.loaded;
  assert.equal(retry.elements.get('settings-retry').hidden, false);
  retry.options.loadFails = false; await retry.elements.get('settings-retry').click();
  assert.equal(retry.elements.get('settings-retry').hidden, true);
  assert.equal(retry.elements.get('allow-messages').disabled, false);
  const profileSource = fs.readFileSync(path.join(__dirname, '../public/js/profile-page.js'), 'utf8');
  const updateFunction = profileSource.match(/function getProfileUpdate\(includeDetails\) \{[\s\S]*?return update;\n    \}/)[0];
  const profileContext = vm.createContext({ document: { getElementById(id) {
    const fields = { year: '2', languages: 'en', 'weekly-free-hours': '10', name: 'Preview Student', university: '1', faculty: '1' };
    assert.ok(id in fields, 'Profile save must not read the removed messaging toggle');
    return { value: fields[id] };
  } } });
  vm.runInContext(updateFunction + '\nglobalThis.update = getProfileUpdate(true);', profileContext);
  assert.equal(Object.hasOwn(profileContext.update, 'allow_messages'), false, 'Profile save must preserve the preference managed in Settings');
  console.log('Settings tests passed: initial preference, field-only save, pending state, rollback, logout success/failure, visitors, and load retry.');
})().catch(error => { console.error(error); process.exitCode = 1; });
