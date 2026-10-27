const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '../public/', file), 'utf8');
const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};

async function authChecks() {
  const saved = storage();
  const requests = [];
  let clients = 0;
  let failConfig = false;
  const window = { dispatchEvent() {}, supabase: { createClient() {
    clients++;
    return { auth: { getSession: async () => ({ data: { session: { user: { id: 'one' }, access_token: 'token' } } }), signOut: async () => ({}) } };
  } } };
  const context = vm.createContext({ window, sessionStorage: saved, Event: class {}, fetch: async url => {
    requests.push(url);
    if (url === '/api/config') return { ok: !failConfig, json: async () => ({ supabaseUrl: 'https://example.test', supabasePublishableKey: 'public' }) };
    return { ok: true, json: async () => ({ university: 'University' }) };
  } });
  vm.runInContext(read('js/auth.js').replace(/export \{[^}]+\};/, 'globalThis.auth = { getClient, getSession, getOwnProfile, signOut };'), context);
  const sessions = await Promise.all([context.auth.getSession(), context.auth.getSession(), context.auth.getSession()]);
  assert.equal(clients, 1);
  assert.equal(requests.filter(url => url === '/api/config').length, 1);
  await Promise.all(sessions.map(session => context.auth.getOwnProfile(session)));
  assert.equal(requests.filter(url => url === '/api/profile?id=1').length, 1);
  await context.auth.getOwnProfile({ user: { id: 'two' }, access_token: 'other' });
  assert.equal(requests.filter(url => url === '/api/profile?id=1').length, 2);
  saved.setItem('lotus-university-brand', 'old');
  await context.auth.signOut();
  assert.equal(saved.getItem('lotus-university-brand'), null);
  // A new document can reuse only the public configuration, not profile data.
  const nextPage = vm.createContext({ window, sessionStorage: saved, fetch: () => { throw Error('Configuration fetched again'); } });
  vm.runInContext(read('js/auth.js').replace(/export \{[^}]+\};/, 'globalThis.auth = { getClient };'), nextPage);
  await nextPage.auth.getClient();

  const retry = vm.createContext({ window, sessionStorage: storage(), fetch: async () => ({ ok: !failConfig, json: async () => ({ supabaseUrl: 'https://example.test', supabasePublishableKey: 'public' }) }) });
  vm.runInContext(read('js/auth.js').replace(/export \{[^}]+\};/, 'globalThis.auth = { getClient };'), retry);
  failConfig = true;
  await assert.rejects(retry.auth.getClient());
  failConfig = false;
  await retry.auth.getClient();
}

function node() {
  return { dataset: {}, children: [], hidden: false, replaceChildren() { this.children = []; }, appendChild(child) { this.children.push(child); }, setAttribute() {}, addEventListener(type, handler) { this[type] = handler; }, remove() {} };
}

function brandChecks() {
  const saved = storage();
  const context = vm.createContext({ sessionStorage: saved, window: { dispatchEvent() {} }, CustomEvent: class {}, document: { createElement: node } });
  vm.runInContext(read('js/university-logo.js').replaceAll('export function ', 'function ') + '\nglobalThis.brand = { readUniversityBrand, saveUniversityBrand, renderUniversityLogo };', context);
  const brand = context.brand;
  brand.saveUniversityBrand({ user: { id: 'one' } }, { university: 'University', logo_url: '/img/universities/ada.png' });
  assert.equal(brand.readUniversityBrand().owner, 'one');
  const container = node();
  brand.renderUniversityLogo(container, 'University', '/img/universities/ada.png', 72);
  const image = container.children[1];
  assert.equal(image.loading, 'eager');
  brand.renderUniversityLogo(container, 'University', '/img/universities/ada.png', 72);
  assert.equal(container.children[1], image, 'Refreshing unchanged branding must preserve the image');
  brand.renderUniversityLogo(container, 'Other', '/img/universities/tau.svg', 72);
  assert.notEqual(container.children[1], image);
  const unavailable = vm.createContext({ sessionStorage: { getItem() { throw Error('Blocked'); }, setItem() { throw Error('Blocked'); } }, window: { dispatchEvent() {} }, CustomEvent: class {} });
  vm.runInContext(read('js/university-logo.js').replaceAll('export function ', 'function ') + '\nsaveUniversityBrand({user:{id:"one"}}, {university:"University"}); globalThis.cached = readUniversityBrand();', unavailable);
  assert.equal(unavailable.cached, null);
}

async function homeChecks() {
  const pending = new Map();
  const nodes = new Map();
  const context = vm.createContext({ window: {}, document: { createElement: node, getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); } }, getSession: async () => ({ user: { id: 'one' }, access_token: 'token' }), getOwnProfile: async () => ({ name: 'Student' }), fetch(url) { return new Promise(resolve => pending.set(url, resolve)); } });
  vm.runInContext(read('app.js').replace(/^import .*;\n/gm, '').replace('init();', 'window.finished = init();'), context);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual([...pending.keys()].sort(), ['/api/calendar', '/api/courses', '/api/deadlines', '/api/events', '/api/groups', '/api/posts'].sort(), 'All independent home requests start before any completes');
  for (const [url, resolve] of pending) resolve({ ok: url !== '/api/posts', json: async () => [] });
  await context.window.finished;
  assert.equal(nodes.get('feed-preview-list').children[0].textContent, 'Could not load the feed preview.');
  assert.equal(nodes.get('events-list').children[0].textContent, 'No upcoming events yet.');
}

(async () => {
  await authChecks();
  brandChecks();
  await homeChecks();
  console.log('Loading tests passed: shared client/config/profile, retries, account separation, logout, persistent logo, storage fallback, parallel home requests, isolated errors.');
})().catch(error => { console.error(error); process.exitCode = 1; });
