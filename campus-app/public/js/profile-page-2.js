
    import { signOut } from './js/auth.js';

    document.getElementById('profile-logout').addEventListener('click', async function () {
      const status = document.getElementById('logout-status');
      status.textContent = 'Signing out...';
      status.className = 'alert info';
      try {
        await signOut();
        window.location.replace('index.html');
      } catch (error) {
        status.textContent = 'Could not sign out. Please try again.';
        status.className = 'alert error';
      }
    });
  