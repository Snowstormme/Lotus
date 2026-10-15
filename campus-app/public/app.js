async function init() {
  const status = document.getElementById('status');
  const studentsSection = document.getElementById('students');
  const coursesSection = document.getElementById('courses-list');

  try {
    // Health check
    const healthRes = await fetch('/.netlify/functions/health');
    const healthData = await healthRes.json();
    if (!healthData.ok) throw new Error('Health check failed');
    status.textContent = 'Connected to server.';

    // Load demo students
    try {
      const usersRes = await fetch('/.netlify/functions/users');
      if (!usersRes.ok) {
        const body = await usersRes.json().catch(() => ({}));
        studentsSection.innerHTML = '<p class="error">Could not load students: ' +
          (body.error || 'unknown error') + '</p>';
      } else {
        const users = await usersRes.json();
        if (users.length === 0) {
          studentsSection.innerHTML = '<p>No demo students found.</p>';
        } else {
          const list = users.map(function (u) {
            return '<li>' + u.name + ' — Year ' + u.year + '</li>';
          }).join('');
          studentsSection.innerHTML = '<ul>' + list + '</ul>';
        }
      }
    } catch (e) {
      studentsSection.innerHTML = '<p class="error">Failed to load students.</p>';
    }

    // Load courses
    try {
      const coursesRes = await fetch('/.netlify/functions/courses');
      if (!coursesRes.ok) {
        const body = await coursesRes.json().catch(() => ({}));
        coursesSection.innerHTML = '<p class="error">Could not load courses: ' +
          (body.error || 'unknown error') + '</p>';
      } else {
        const courses = await coursesRes.json();
        if (courses.length === 0) {
          coursesSection.innerHTML = '<p>No courses found.</p>';
        } else {
          var rows = courses.map(function (c) {
            return '<tr><td>' + c.code + '</td><td>' + c.name +
              '</td><td>' + c.teacher + '</td><td>' + c.room + '</td></tr>';
          }).join('');
          coursesSection.innerHTML =
            '<table><thead><tr><th>Code</th><th>Name</th><th>Teacher</th><th>Room</th></tr></thead>' +
            '<tbody>' + rows + '</tbody></table>';
        }
      }
    } catch (e) {
      coursesSection.innerHTML = '<p class="error">Failed to load courses.</p>';
    }
  } catch (err) {
    status.textContent = 'Could not reach the server functions. Check the Netlify deploy.';
  }
}
init();
