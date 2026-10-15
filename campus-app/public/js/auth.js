const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4';

function loadBrowserClient() {
  if (window.supabase) return Promise.resolve(window.supabase);
  return new Promise(function (resolve, reject) {
    const script = document.createElement('script');
    script.src = SUPABASE_CDN;
    script.onload = function () { resolve(window.supabase); };
    script.onerror = function () { reject(new Error('Could not load the browser client.')); };
    document.head.appendChild(script);
  });
}

async function getClient() {
  const response = await fetch('/api/config');
  if (!response.ok) throw new Error('Could not load public configuration.');
  const config = await response.json();
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw new Error('Could not load public configuration.');
  }
  const browserClient = await loadBrowserClient();
  return browserClient.createClient(config.supabaseUrl, config.supabasePublishableKey);
}

async function getSession() {
  const client = await getClient();
  const result = await client.auth.getSession();
  if (result.error) throw new Error('Could not load the session.');
  return result.data.session;
}

async function signOut() {
  const client = await getClient();
  const result = await client.auth.signOut();
  if (result.error) throw new Error('Could not sign out.');
}

export { getClient, getSession, signOut };
