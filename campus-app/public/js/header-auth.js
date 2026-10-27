(async function () {
  const actions = document.getElementById('auth-actions');
  const loginLink = document.getElementById('login-link');
  const signupLink = document.getElementById('signup-link');
  if (!actions || !loginLink || !signupLink) return;

  try {
    const auth = await import('./auth.js');
    const session = await auth.getSession();
    if (!session) return;

    loginLink.remove();
    signupLink.remove();

    const pageName = window.location.pathname.split('/').pop() || 'index.html';
    if (pageName === 'login' || pageName === 'login.html' || pageName === 'signup' || pageName === 'signup.html') {
      window.location.replace('index.html');
      return;
    }

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
