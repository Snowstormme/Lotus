
    import { getSession } from './auth.js';

    const userId = new URLSearchParams(window.location.search).get('id') || '1';
    const generateButton = document.getElementById('generate');
    const status = document.getElementById('status');
    const source = document.getElementById('source');
    const summary = document.getElementById('summary');
    const planContainer = document.getElementById('plan');

    function clearPlan(message) {
      source.textContent = 'No saved plan';
      summary.textContent = 'No summary yet.';
      planContainer.replaceChildren();
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = message;
      planContainer.appendChild(empty);
    }

    function setStatus(message, isError) {
      status.textContent = message;
      status.className = isError ? 'alert error' : 'alert info';
    }

    function showLoggedOutMessage() {
      status.replaceChildren();
      status.className = 'empty-state';
      status.append(document.createTextNode('Log in to create and view your study plan. '));
      const link = document.createElement('a');
      link.className = 'btn secondary';
      link.href = 'login.html';
      link.textContent = 'Log in';
      status.appendChild(link);
    }

    function renderPlan(responseBody) {
      const plan = responseBody.plan_json;
      source.textContent = responseBody.source === 'ai' ? 'AI generated' : 'Saved plan';
      summary.textContent = plan && typeof plan.summary === 'string' && plan.summary
        ? plan.summary : 'No summary available.';
      planContainer.replaceChildren();

      if (responseBody.note) {
        const note = document.createElement('p');
        note.className = 'alert warning';
        note.textContent = responseBody.note;
        planContainer.appendChild(note);
      }

      if (!plan || !Array.isArray(plan.weeks) || plan.weeks.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'No study plan weeks are available yet.';
        planContainer.appendChild(empty);
        return;
      }
      plan.weeks.forEach(function (week) {
        const weekSection = document.createElement('section');
        weekSection.className = 'card';
        const heading = document.createElement('h2');
        heading.textContent = 'Week of ' + String(week.week_start || '');
        weekSection.appendChild(heading);

        (Array.isArray(week.days) ? week.days : []).forEach(function (day) {
          const dayHeading = document.createElement('h3');
          dayHeading.textContent = String(day.day || 'Day');
          weekSection.appendChild(dayHeading);
          const list = document.createElement('ul');
          (Array.isArray(day.tasks) ? day.tasks : []).forEach(function (task) {
            const item = document.createElement('li');
            item.textContent = String(task.course || '') + ': ' + String(task.task || '') +
              ' (' + String(task.minutes || 0) + ' minutes)';
            list.appendChild(item);
          });
          weekSection.appendChild(list);
        });
        planContainer.appendChild(weekSection);
      });
    }

    async function requestPlan(method) {
      setStatus(method === 'POST' ? 'Generating plan...' : 'Loading saved plan...', false);
      generateButton.disabled = method === 'POST';
      try {
        const session = await getSession().catch(function () { return null; });
        if (!session) {
          generateButton.disabled = true;
          showLoggedOutMessage();
          clearPlan('Log in to create and view your study plan.');
          return;
        }
        generateButton.disabled = false;
        const headers = { Authorization: 'Bearer ' + session.access_token };
        const response = await fetch('/api/plan?user_id=' + encodeURIComponent(userId), {
          method: method,
          headers
        });
        const body = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(response.status === 401 ? 'Your session is not valid.' : (body.error || 'Could not load the study plan.'));
        setStatus('Plan loaded.', false);
        status.className = 'alert success';
        renderPlan(body);
      } catch (error) {
        setStatus(error.message || 'Could not load the study plan.', true);
        clearPlan('No study plan yet. Generate one after courses and deadlines are available.');
      } finally {
        generateButton.disabled = false;
      }
    }

    generateButton.addEventListener('click', function () { requestPlan('POST'); });
    requestPlan('GET');

