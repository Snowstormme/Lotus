const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4';
let browserClientPromise;
let clientPromise;
let sessionPromise;
let profilePromise;
let profileOwner;

function readConfig() {
  try {
    const cached = JSON.parse(sessionStorage.getItem('lotus-public-config'));
    if (cached && cached.expires > Date.now() && cached.config.supabaseUrl && cached.config.supabasePublishableKey) return cached.config;
  } catch (error) { /* Storage is optional. */ }
  return null;
}

function loadBrowserClient() {
  if (window.supabase) return Promise.resolve(window.supabase);
  if (browserClientPromise) return browserClientPromise;
  browserClientPromise = new Promise(function (resolve, reject) {
    const script = document.createElement('script');
    script.src = SUPABASE_CDN;
    script.onload = function () { resolve(window.supabase); };
    script.onerror = function () { browserClientPromise = null; script.remove(); reject(new Error('Could not load the browser client.')); };
    document.head.appendChild(script);
  });
  return browserClientPromise;
}

async function loadConfig() {
  const cached = readConfig();
  if (cached) return cached;
  const response = await fetch('/api/config');
  if (!response.ok) throw new Error('Could not load public configuration.');
  const config = await response.json();
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw new Error('Could not load public configuration.');
  }
  try { sessionStorage.setItem('lotus-public-config', JSON.stringify({ config, expires: Date.now() + 3600000 })); } catch (error) { /* Storage is optional. */ }
  return config;
}

function getClient() {
  if (!clientPromise) {
    clientPromise = Promise.all([loadConfig(), loadBrowserClient()]).then(function ([config, browserClient]) {
      return browserClient.createClient(config.supabaseUrl, config.supabasePublishableKey);
    }).catch(function (error) { clientPromise = null; throw error; });
  }
  return clientPromise;
}

function getSession() {
  if (!sessionPromise) {
    sessionPromise = getClient().then(client => client.auth.getSession()).then(function (result) {
      if (result.error) throw new Error('Could not load the session.');
      return result.data.session;
    }).finally(function () { sessionPromise = null; });
  }
  return sessionPromise;
}

// Share the authenticated profile within this document, never across accounts.
function getOwnProfile(session) {
  const owner = session.user.id + ':' + session.access_token;
  if (!profilePromise || profileOwner !== owner) {
    profileOwner = owner;
    profilePromise = fetch('/api/profile?id=1', { headers: { Authorization: 'Bearer ' + session.access_token } }).then(function (response) {
      if (!response.ok) throw new Error('Could not load the profile.');
      return response.json();
    }).catch(function (error) { profilePromise = null; throw error; });
  }
  return profilePromise;
}

async function signOut() {
  const client = await getClient();
  const result = await client.auth.signOut();
  if (result.error) throw new Error('Could not sign out.');
  profilePromise = null;
  profileOwner = null;
  try { sessionStorage.removeItem('lotus-university-brand'); } catch (error) { /* Storage is optional. */ }
  window.dispatchEvent(new Event('lotus-brand-cleared'));
}

export { getClient, getSession, getOwnProfile, signOut };
