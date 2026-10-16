
    import { getSession } from './auth.js';

    function showMessage(container, message, isError) {
      container.replaceChildren();
      const paragraph = document.createElement('p');
      paragraph.textContent = message;
      paragraph.className = isError ? 'alert error' : 'empty-state';
      container.appendChild(paragraph);
    }

    function appendList(card, headingText, values, emptyText) {
      const heading = document.createElement('h3');
      heading.textContent = headingText;
      card.appendChild(heading);
      if (!values || values.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = emptyText;
        card.appendChild(empty);
        return;
      }
      const list = document.createElement('ul');
      values.forEach(function (value) {
        const item = document.createElement('li');
        item.textContent = value;
        list.appendChild(item);
      });
      card.appendChild(list);
    }

    async function loadPartners() {
      const status = document.getElementById('status');
      const list = document.getElementById('partners-list');
      const id = new URLSearchParams(window.location.search).get('id') || '1';
      try {
        const session = await getSession().catch(function () { return null; });
        const headers = session ? { Authorization: 'Bearer ' + session.access_token } : {};
        const response = await fetch('/api/partners?user_id=' + encodeURIComponent(id), { headers });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Partner request failed');
        if (body.length === 0) {
          status.textContent = 'Study partners';
          showMessage(list, 'No study partners found yet.');
          return;
        }

        status.textContent = 'Study partners';
        list.replaceChildren();
        body.forEach(function (partner) {
          const card = document.createElement('article');
          card.className = 'card partner-card';
          const name = document.createElement('h2');
          name.textContent = partner.name;
          card.appendChild(name);
          const year = document.createElement('p');
          year.textContent = 'Year ' + partner.year;
          card.appendChild(year);
          appendList(card, 'Shared courses', partner.shared_courses, 'No shared courses.');
          appendList(card, 'Free times in common', partner.overlapping_free_times, 'No overlapping free times.');
          const messageButton = document.createElement('button');
          messageButton.className = 'btn secondary';
          messageButton.type = 'button';
          messageButton.textContent = 'Message';
          messageButton.addEventListener('click', async function () {
            const session = await getSession().catch(function () { return null; });
            if (!session) {
              window.location.href = 'login.html';
              return;
            }
            messageButton.disabled = true;
            try {
              const response = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ contact_token: partner.contact_token }) });
              const result = await response.json().catch(function () { return {}; });
              if (!response.ok) throw new Error(result.error || 'Could not start the conversation.');
              window.location.href = 'messages.html?conversation_id=' + encodeURIComponent(result.conversation_id);
            } catch (error) {
              status.textContent = error.message || "You can't message this student.";
              status.className = 'alert error';
              messageButton.disabled = false;
            }
          });
          card.appendChild(messageButton);
          list.appendChild(card);
        });
      } catch (err) {
        status.textContent = 'Study partners';
        showMessage(list, 'Could not load study partners.', true);
      }
    }
    loadPartners();

