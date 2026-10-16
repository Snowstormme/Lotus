
    let client;
    const form = document.getElementById('signup-form');
    const message = document.getElementById('message');

    function showMessage(text, isError) {
      message.textContent = text;
      message.className = isError ? 'alert error' : 'alert success';
    }

    async function loadClient() {
      const response = await fetch('/api/config');
      if (!response.ok) throw new Error('Configuration unavailable');
      const config = await response.json();
      if (!config.supabaseUrl || !config.supabasePublishableKey || !window.supabase) {
        throw new Error('Configuration unavailable');
      }
      client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey);
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const password = document.getElementById('password').value;
      if (password.length < 8) {
        showMessage('Password must be at least 8 characters.', true);
        return;
      }
      try {
        if (!client) await loadClient();
        const result = await client.auth.signUp({
          email: document.getElementById('email').value,
          password,
          options: { data: { full_name: document.getElementById('full-name').value } }
        });
        if (result.error) throw result.error;
        showMessage('Account created. Check your email for the confirmation link.', false);
        form.reset();
      } catch (error) {
        showMessage('Could not create the account. Please check your details and try again.', true);
      }
    });
  