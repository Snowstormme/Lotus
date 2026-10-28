import { getSession, getOwnProfile, signOut } from './auth.js';

const toggle = document.getElementById('allow-messages');
const status = document.getElementById('messaging-status');
const retry = document.getElementById('settings-retry');
const login = document.getElementById('settings-login');
const logout = document.getElementById('settings-logout');
const logoutStatus = document.getElementById('logout-status');
let session = null;
let savedPreference = false;

function showStatus(message, error = false) {
  status.textContent = message;
  status.className = error ? 'settings-status alert error' : 'settings-status muted';
}

async function loadSettings() {
  toggle.disabled = true;
  retry.hidden = true;
  login.hidden = true;
  showStatus('Loading messaging preference...');
  try {
    session = await getSession();
    if (!session) {
      logout.disabled = true;
      showStatus('Log in to manage messaging privacy and your account.');
      login.hidden = false;
      return;
    }
    logout.disabled = false;
    const profile = await getOwnProfile(session);
    savedPreference = profile.allow_messages !== false;
    toggle.checked = savedPreference;
    toggle.disabled = false;
    showStatus('Changes save automatically.');
  } catch (error) {
    showStatus('Could not load your messaging preference. Please try again.', true);
    retry.hidden = false;
  }
}

toggle.addEventListener('change', async function () {
  if (!session || toggle.disabled) return;
  const requested = toggle.checked;
  toggle.disabled = true;
  showStatus('Saving messaging preference...');
  try {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ allow_messages: requested })
    });
    if (!response.ok) throw new Error('Preference update failed');
    savedPreference = requested;
    showStatus('Messaging preference saved.');
  } catch (error) {
    toggle.checked = savedPreference;
    showStatus('Could not save your preference. Your previous setting is still selected.', true);
  } finally {
    toggle.disabled = false;
  }
});

logout.addEventListener('click', async function () {
  logout.disabled = true;
  logoutStatus.textContent = 'Signing out...';
  logoutStatus.className = 'settings-status muted';
  try {
    await signOut();
    window.location.replace('index.html');
  } catch (error) {
    logout.disabled = false;
    logoutStatus.textContent = 'Could not sign out. Please try again.';
    logoutStatus.className = 'settings-status alert error';
  }
});

retry.addEventListener('click', loadSettings);
loadSettings();
