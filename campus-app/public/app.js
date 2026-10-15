async function init() {
  const status = document.getElementById('status');
  try {
    const res = await fetch('/.netlify/functions/health');
    const data = await res.json();
    if (!data.ok) throw new Error('bad response');

    const usersRes = await fetch('/.netlify/functions/users');
    const users = await usersRes.json();
    if (!usersRes.ok) {
      status.textContent = users.error || 'Could not load demo data.';
      return;
    }
    status.textContent = 'Connected. Demo students loaded: ' + users.map(u => u.name).join(', ');
  } catch (err) {
    status.textContent = 'Could not reach the server functions. Check the Netlify deploy.';
  }
}
init();
