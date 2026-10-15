function showMessage(container, message, isError) {
  container.replaceChildren();
  const paragraph = document.createElement('p');
  paragraph.textContent = message;
  if (isError) paragraph.className = 'error';
  container.appendChild(paragraph);
}

function appendTable(container, headings, rows) {
  container.replaceChildren();
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headings.forEach(function (heading) {
    const cell = document.createElement('th');
    cell.textContent = heading;
    headerRow.appendChild(cell);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach(function (values) {
    const row = document.createElement('tr');
    values.forEach(function (value) {
      const cell = document.createElement('td');
      cell.textContent = value == null ? '' : String(value);
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

function appendCourseTable(container, courses) {
  container.replaceChildren();
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Code', 'Name', 'Teacher', 'Room'].forEach(function (heading) {
    const cell = document.createElement('th');
    cell.textContent = heading;
    headerRow.appendChild(cell);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  courses.forEach(function (course) {
    const row = document.createElement('tr');
    const codeCell = document.createElement('td');
    const link = document.createElement('a');
    link.href = 'course.html?id=' + encodeURIComponent(course.id);
    link.textContent = course.code == null ? '' : String(course.code);
    codeCell.appendChild(link);
    row.appendChild(codeCell);

    [course.name, course.teacher, course.room].forEach(function (value) {
      const cell = document.createElement('td');
      cell.textContent = value == null ? '' : String(value);
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

async function init() {
  const status = document.getElementById('status');
  const studentsSection = document.getElementById('students');
  const coursesSection = document.getElementById('courses-list');
  const deadlinesSection = document.getElementById('deadlines-list');
  const scheduleSection = document.getElementById('schedule-list');
  const profileLink = document.querySelector('a[href="#profile"]');
  const partnersLink = document.querySelector('a[href="#partners"]');
  const costLink = document.querySelector('a[href="#cost"]');
  const planLink = document.querySelector('a[href="#plan"]');
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (profileLink) profileLink.href = 'profile.html?id=1';
  if (partnersLink) partnersLink.href = 'partners.html?id=1';
  if (costLink) costLink.href = 'cost.html';
  if (planLink) planLink.href = 'plan.html?id=1';

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
        showMessage(studentsSection, 'Could not load students.', true);
      } else {
        const users = await usersRes.json();
        if (users.length === 0) {
          showMessage(studentsSection, 'No demo students found.');
        } else {
          const list = document.createElement('ul');
          users.forEach(function (user) {
            const item = document.createElement('li');
            item.textContent = user.name + ' — Year ' + user.year;
            list.appendChild(item);
          });
          studentsSection.replaceChildren(list);
        }
      }
    } catch (e) {
      showMessage(studentsSection, 'Could not load students.', true);
    }

    // Load courses
    try {
      const coursesRes = await fetch('/.netlify/functions/courses');
      if (!coursesRes.ok) {
        showMessage(coursesSection, 'Could not load courses.', true);
      } else {
        const courses = await coursesRes.json();
        if (courses.length === 0) {
          showMessage(coursesSection, 'No courses found.');
        } else {
          appendCourseTable(coursesSection, courses);
        }
      }
    } catch (e) {
      showMessage(coursesSection, 'Could not load courses.', true);
    }

    // Load upcoming deadlines
    try {
      const deadlinesRes = await fetch('/.netlify/functions/deadlines');
      if (!deadlinesRes.ok) {
        showMessage(deadlinesSection, 'Could not load deadlines.', true);
      } else {
        const deadlines = await deadlinesRes.json();
        if (deadlines.length === 0) {
          showMessage(deadlinesSection, 'No upcoming deadlines found.');
        } else {
          appendTable(deadlinesSection, ['Title', 'Course', 'Type', 'Due'], deadlines.map(function (deadline) {
            return [deadline.title, deadline.code, deadline.type, deadline.due_at];
          }));
        }
      }
    } catch (e) {
      showMessage(deadlinesSection, 'Could not load deadlines.', true);
    }

    // Load the weekly class schedule
    try {
      const scheduleRes = await fetch('/.netlify/functions/calendar');
      if (!scheduleRes.ok) {
        showMessage(scheduleSection, 'Could not load weekly schedule.', true);
      } else {
        const schedule = await scheduleRes.json();
        if (schedule.length === 0) {
          showMessage(scheduleSection, 'No classes scheduled.');
        } else {
          appendTable(scheduleSection, ['Course', 'Day', 'Start', 'End', 'Room'], schedule.map(function (classItem) {
            return [classItem.code, weekdays[classItem.weekday] || 'Unknown day', classItem.start_time, classItem.end_time, classItem.room];
          }));
        }
      }
    } catch (e) {
      showMessage(scheduleSection, 'Could not load weekly schedule.', true);
    }
  } catch (err) {
    status.textContent = 'Could not reach the server functions. Check the Netlify deploy.';
  }
}
init();
