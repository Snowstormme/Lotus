import { getSession } from './js/auth.js';
import { formatBakuDateTime } from './js/dates.js';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function showMessage(container, message, isError) {
  container.replaceChildren();
  const paragraph = document.createElement('p');
  paragraph.textContent = message;
  paragraph.className = isError ? 'alert error' : 'empty-state';
  container.appendChild(paragraph);
}

async function getAuthContext() {
  try {
    const session = await getSession();
    return { session, headers: session ? { Authorization: 'Bearer ' + session.access_token } : {} };
  } catch (error) {
    return { session: null, headers: {} };
  }
}

function appendCourseTable(container, courses) {
  container.replaceChildren();
  const table = document.createElement('table');
  table.className = 'table';
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

function renderClasses(container, classes) {
  container.replaceChildren();
  const list = document.createElement('div');
  list.className = 'class-list';
  classes.forEach(function (classItem, index) {
    const row = document.createElement('article');
    row.className = 'class-row';
    const bar = document.createElement('span');
    bar.className = 'course-status-bar course-color-' + (index % 4);
    bar.setAttribute('aria-hidden', 'true');
    const details = document.createElement('div');
    const course = document.createElement('strong');
    course.textContent = String(classItem.code || 'Course');
    const schedule = document.createElement('p');
    schedule.className = 'muted';
    schedule.textContent = (weekdays[classItem.weekday] || 'Day') + ' · ' + String(classItem.start_time || '') + '–' + String(classItem.end_time || '') + ' · Room ' + String(classItem.room || '—');
    details.append(course, schedule);
    row.append(bar, details);
    list.appendChild(row);
  });
  container.appendChild(list);
}

function renderDeadlines(container, deadlines) {
  container.replaceChildren();
  const list = document.createElement('ul');
  list.className = 'dashboard-list';
  deadlines.forEach(function (deadline) {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = String(deadline.title || 'Deadline');
    const meta = document.createElement('span');
    meta.className = 'muted';
    meta.textContent = String(deadline.code || '') + ' · ' + String(deadline.type || '') + ' · ' + (formatBakuDateTime(deadline.due_at) || 'Due time unavailable');
    item.append(title, meta);
    list.appendChild(item);
  });
  container.appendChild(list);
}

function renderFeedPreview(container, posts) {
  container.replaceChildren();
  const list = document.createElement('ul');
  list.className = 'dashboard-list';
  posts.slice(0, 3).forEach(function (post) {
    const item = document.createElement('li');
    const header = document.createElement('div');
    header.className = 'feed-post-meta';
    const author = document.createElement('strong');
    author.textContent = String(post.author_name || 'Student');
    header.appendChild(author);
    if (post.is_sample === true) {
      const sample = document.createElement('span');
      sample.className = 'badge';
      sample.textContent = 'Sample';
      header.appendChild(sample);
    }
    const time = document.createElement('time');
    time.className = 'muted';
    time.textContent = formatBakuDateTime(post.created_at) || 'Time unavailable';
    item.append(header, time);
    const body = document.createElement('p');
    body.className = 'pre-wrap';
    body.textContent = String(post.body || '');
    item.appendChild(body);
    list.appendChild(item);
  });
  container.appendChild(list);
}

function setWelcome(container, title, university) {
  container.replaceChildren();
  const heading = document.createElement('h1');
  heading.className = 'page-title';
  heading.textContent = title;
  container.appendChild(heading);
  if (university) {
    const detail = document.createElement('p');
    detail.className = 'muted';
    detail.textContent = university;
    container.appendChild(detail);
  }
}

async function init() {
  const welcome = document.getElementById('welcome-content');
  const coursesSection = document.getElementById('courses-list');
  const deadlinesSection = document.getElementById('deadlines-list');
  const scheduleSection = document.getElementById('schedule-list');
  const feedSection = document.getElementById('feed-preview-list');
  const context = await getAuthContext();

  if (context.session) {
    try {
      const profileResponse = await fetch('/api/profile?id=1', { headers: context.headers });
      if (!profileResponse.ok) throw new Error('Profile unavailable');
      const profile = await profileResponse.json();
      const firstName = String(profile.name || '').trim().split(/\s+/)[0] || 'student';
      setWelcome(welcome, 'Welcome back, ' + firstName, profile.university || '');
    } catch (error) {
      setWelcome(welcome, 'Welcome to Lotus Campus', '');
    }
  } else {
    setWelcome(welcome, 'Welcome to Lotus Campus', '');
  }

  try {
    const coursesResponse = await fetch('/api/courses', { headers: context.headers });
    if (!coursesResponse.ok) throw new Error('Courses unavailable');
    const courses = await coursesResponse.json();
    if (!Array.isArray(courses) || courses.length === 0) {
      showMessage(coursesSection, 'No courses yet. Your schedule will appear here once courses are added.');
    } else {
      appendCourseTable(coursesSection, courses);
    }
  } catch (error) {
    showMessage(coursesSection, 'Could not load courses.', true);
  }

  try {
    const deadlinesResponse = await fetch('/api/deadlines', { headers: context.headers });
    if (!deadlinesResponse.ok) throw new Error('Deadlines unavailable');
    const deadlines = await deadlinesResponse.json();
    if (!Array.isArray(deadlines) || deadlines.length === 0) {
      showMessage(deadlinesSection, 'No deadlines yet. Your upcoming work will appear here once courses are added.');
    } else {
      renderDeadlines(deadlinesSection, deadlines);
    }
  } catch (error) {
    showMessage(deadlinesSection, 'Could not load deadlines.', true);
  }

  try {
    const scheduleResponse = await fetch('/api/calendar', { headers: context.headers });
    if (!scheduleResponse.ok) throw new Error('Schedule unavailable');
    const schedule = await scheduleResponse.json();
    if (!Array.isArray(schedule) || schedule.length === 0) {
      showMessage(scheduleSection, 'No classes yet. Your weekly schedule will appear here once courses are added.');
    } else {
      renderClasses(scheduleSection, schedule);
    }
  } catch (error) {
    showMessage(scheduleSection, 'Could not load the weekly schedule.', true);
  }

  try {
    const feedResponse = await fetch('/api/posts', { headers: context.headers });
    if (!feedResponse.ok) throw new Error('Feed unavailable');
    const posts = await feedResponse.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      showMessage(feedSection, 'No posts yet. Start the conversation.');
    } else {
      renderFeedPreview(feedSection, posts);
    }
  } catch (error) {
    showMessage(feedSection, 'Could not load the feed preview.', true);
  }
}

init();
