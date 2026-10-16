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
    const session = sessionResult.data.session;
    if (!session) return;

    loginLink.hidden = true;
    signupLink.hidden = true;
    logoutLink.hidden = false;
    logoutLink.addEventListener('click', async function (event) {
      event.preventDefault();
      await client.auth.signOut();
      window.location.href = 'index.html';
    });

    try {
      const profileResponse = await fetch('/api/onboarding', {
        headers: { Authorization: 'Bearer ' + session.access_token }
      });
      if (!profileResponse.ok) return;
      const profileStatus = await profileResponse.json();
      if (profileStatus.hasProfile === false) {
        const banner = document.createElement('div');
        banner.className = 'page alert info';
        banner.setAttribute('role', 'status');
        const message = document.createElement('span');
        message.textContent = 'Finish your profile';
        banner.appendChild(message);
        const link = document.createElement('a');
        link.href = 'onboarding.html';
        link.textContent = ' Complete it now';
        banner.appendChild(link);
        const header = document.querySelector('.site-header');
        if (header) header.insertAdjacentElement('afterend', banner);
      }
    } catch (error) {
      // Profile status is optional and must not block any existing page.
    }
  } catch (error) {
    // Keep the default login and sign-up links if session lookup is unavailable.
  }
}());
