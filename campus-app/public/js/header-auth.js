(async function () {
  const actions = document.getElementById('auth-actions');
  const loginLink = document.getElementById('login-link');
  const signupLink = document.getElementById('signup-link');
  const logoutLink = document.getElementById('logout-link');
  if (!actions || !loginLink || !signupLink || !logoutLink) return;

  function loadBrowserClient() {
    if (window.supabase) return Promise.resolve(window.supabase);
    return new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4';
      script.onload = function () { resolve(window.supabase); };
      script.onerror = function () { reject(new Error('Could not load the browser client.')); };
      document.head.appendChild(script);
    });
  }

  try {
    const configResponse = await fetch('/api/config');
    if (!configResponse.ok) return;
    const config = await configResponse.json();
    const browserClient = await loadBrowserClient();
    const client = browserClient.createClient(config.supabaseUrl, config.supabasePublishableKey);
    const sessionResult = await client.auth.getSession();
    if (!sessionResult.data.session) return;

    loginLink.hidden = true;
    signupLink.hidden = true;
    logoutLink.hidden = false;
    logoutLink.addEventListener('click', async function (event) {
      event.preventDefault();
      await client.auth.signOut();
      window.location.href = 'index.html';
    });
  } catch (error) {
    // Keep the default login and sign-up links if session lookup is unavailable.
  }
}());
