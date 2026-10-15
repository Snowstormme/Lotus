async function init() {
  const status = document.getElementById('status');
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    status.textContent = data.ok ? 'Server is running. Build the screens from here.' : 'Server responded with an error.';
  } catch (err) {
    status.textContent = 'Could not reach the server. Is npm start running?';
  }
}
init();
