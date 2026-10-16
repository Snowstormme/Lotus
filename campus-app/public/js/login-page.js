
    let client;
    const form = document.getElementById('login-form');
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
      try {
        if (!client) await loadClient();
        const result = await client.auth.signInWithPassword({
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        });
        if (result.error) throw result.error;
        try {
          const profileResponse = await fetch('/api/onboarding', {
            headers: { Authorization: 'Bearer ' + result.data.session.access_token }
          });
          if (profileResponse.ok) {
            const profileStatus = await profileResponse.json();
            window.location.replace(profileStatus.hasProfile ? 'index.html' : 'onboarding.html');
            return;
          }
        } catch (profileError) {
          // A profile check failure should not block a successful login.
        }
        window.location.replace('index.html');
      } catch (error) {
        showMessage('Email or password is not correct.', true);
      }
    });

    document.getElementById('forgot-password').addEventListener('click', async function (event) {
      event.preventDefault();
      const email = document.getElementById('email').value;
      if (!email) {
        showMessage('Enter your email first.', true);
        return;
      }
      try {
        if (!client) await loadClient();
        const result = await client.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/login.html'
        });
        if (result.error) throw result.error;
        showMessage('Password reset email sent. Check your inbox.', false);
      } catch (error) {
        showMessage('Could not send a password reset email.', true);
      }
    });
  