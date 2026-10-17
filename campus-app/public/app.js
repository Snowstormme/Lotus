import { getSession } from './js/auth.js';
import { formatBakuDateTime } from './js/dates.js';
import { samplePosts, sampleGroups, sampleEvents } from './js/home-samples.js';

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
  const materialsLink = document.getElementById('course-materials-link');
  if (materialsLink) {
    materialsLink.hidden = courses.length === 0;
    if (courses.length > 0) materialsLink.href = 'course.html?id=' + encodeURIComponent(courses[0].id);
  }
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

function renderClasses(container, classes, personalClasses, courses) {
  container.replaceChildren();
  const list = document.createElement('div');
  list.className = 'class-list';
  const allClasses = (classes || []).map(function (classItem) { return { ...classItem, personal: false }; }).concat((personalClasses || []).map(function (classItem) { return { ...classItem, personal: true }; })).sort(function (first, second) {
    return Number(first.weekday) - Number(second.weekday) || String(first.start_time || '').localeCompare(String(second.start_time || ''));
  });
  allClasses.forEach(function (classItem, index) {
    const row = document.createElement('article');
    row.className = 'class-row';
    const bar = document.createElement('span');
    bar.className = 'course-status-bar course-color-' + (index % 4);
    bar.setAttribute('aria-hidden', 'true');
    const details = document.createElement('div');
    const course = document.createElement('strong');
    const matchingCourse = (courses || []).find(function (candidate) { return String(candidate.code || '') === String(classItem.code || ''); });
    course.textContent = classItem.personal ? String(classItem.title || 'Personal class') : (matchingCourse && matchingCourse.name ? String(matchingCourse.name) + ' (' + String(classItem.code || '') + ')' : String(classItem.code || 'Course'));
    const schedule = document.createElement('p');
    schedule.className = 'muted';
    schedule.textContent = (weekdays[classItem.weekday] || 'Day') + ' · ' + String(classItem.start_time || '') + '–' + String(classItem.end_time || '') + ' · Room ' + String(classItem.room || '—');
    details.append(course, schedule);
    if (classItem.personal) {
      const label = document.createElement('span');
      label.className = 'badge';
      label.textContent = 'Personal';
      details.appendChild(label);
    }
    row.append(bar, details);
    list.appendChild(row);
  });
  container.appendChild(list);
}

function showPersonalHomeMessage(container, message) {
  const paragraph = document.createElement('p');
  paragraph.className = 'alert error';
  paragraph.textContent = message;
  container.appendChild(paragraph);
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

function reminderLabel(reminder) {
  if (reminder.is_overdue) return 'Overdue';
  if (reminder.days_left === 0) return 'Due today';
  return 'Due soon';
}

function renderReminders(container, reminders) {
  container.replaceChildren();
  const list = document.createElement('ul');
  list.className = 'dashboard-list';
  reminders.slice(0, 5).forEach(function (reminder) {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = String(reminder.title || 'Reminder');
    item.appendChild(title);
    const meta = document.createElement('span');
    meta.className = 'muted';
    meta.textContent = (reminder.course_code ? String(reminder.course_code) + ' · ' : '') + (formatBakuDateTime(reminder.due_at) || 'Due time unavailable');
    item.appendChild(meta);
    const label = document.createElement('span');
    label.className = 'badge';
    label.textContent = reminderLabel(reminder);
    item.appendChild(label);
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
    item.className = 'feed-preview-item';
    const header = document.createElement('div');
    header.className = 'feed-post-meta';
    const avatar = document.createElement('span');
    avatar.className = 'avatar-circle feed-preview-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    const authorName = String(post.author_name || 'Student').trim();
    avatar.textContent = authorName.split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase() || 'S';
    header.appendChild(avatar);
    const author = document.createElement('strong');
    author.textContent = authorName;
    header.appendChild(author);
    if (post.author_year !== null && post.author_year !== undefined) {
      const year = document.createElement('span');
      year.className = 'muted';
      year.textContent = 'Year ' + String(post.author_year);
      header.appendChild(year);
    }
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
    const stats = document.createElement('div');
    stats.className = 'feed-preview-stats muted';
    stats.textContent = String(post.like_count || 0) + ' likes';
    item.appendChild(stats);
    list.appendChild(item);
  });
  container.appendChild(list);
}

function renderTodos(container, todos) {
  container.replaceChildren();
  const openTodos = todos.filter(function (todo) { return todo.done !== true; }).slice(0, 3);
  if (openTodos.length === 0) {
    showMessage(container, 'Nothing to do yet. Add a task or link one to a deadline.');
    return;
  }
  const list = document.createElement('ul');
  list.className = 'dashboard-list';
  openTodos.forEach(function (todo) {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = String(todo.title || 'Untitled task');
    item.appendChild(title);
    const meta = document.createElement('span');
    meta.className = 'muted';
    meta.textContent = todo.due_at ? 'Due ' + (formatBakuDateTime(todo.due_at) || 'date unavailable') : 'No due date';
    item.appendChild(meta);
    if (todo.is_due_soon) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = 'Due soon';
      item.appendChild(badge);
    }
    list.appendChild(item);
  });
  container.appendChild(list);
}

function renderPopularGroups(container, groups, headers) {
  container.replaceChildren();
  const list = document.createElement('ul');
  list.className = 'dashboard-list';
  groups.slice(0, 3).forEach(function (group) {
    const item = document.createElement('li');
    const title = document.createElement(group.is_sample === true ? 'strong' : 'a');
    if (group.is_sample !== true) {
      title.href = 'groups.html?id=' + encodeURIComponent(group.id);
    }
    title.textContent = String(group.name || 'Group');
    item.appendChild(title);
    const meta = document.createElement('span');
    meta.className = 'muted';
    meta.textContent = String(group.member_count || 0) + ' member' + (group.member_count === 1 ? '' : 's') + ' · ' + String(group.kind || 'group');
    item.appendChild(meta);
    if (group.is_sample === true) {
      const sample = document.createElement('span');
      sample.className = 'badge';
      sample.textContent = 'Sample';
      item.appendChild(sample);
    }
    if (group.is_sample !== true) {
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'btn secondary dashboard-inline-action';
      action.textContent = group.is_member ? 'Leave' : 'Join';
      action.addEventListener('click', async function () {
        action.disabled = true;
        try {
          const response = await fetch('/api/groups', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: group.is_member ? 'leave' : 'join', group_id: group.id }) });
          if (!response.ok) throw new Error('Group update failed');
          const result = await response.json();
          group.is_member = result.is_member === true;
          group.member_count = Number(result.member_count || 0);
          action.textContent = group.is_member ? 'Leave' : 'Join';
          meta.textContent = String(group.member_count) + ' member' + (group.member_count === 1 ? '' : 's') + ' · ' + String(group.kind || 'group');
        } catch (error) {
          action.textContent = 'Could not update';
        } finally {
          action.disabled = false;
        }
      });
      item.appendChild(action);
    }
    list.appendChild(item);
  });
  container.appendChild(list);
}

function renderNextEvents(container, events) {
  container.replaceChildren();
  const list = document.createElement('ul');
  list.className = 'dashboard-list';
  events.slice(0, 3).forEach(function (event) {
    const item = document.createElement('li');
    const title = document.createElement(event.is_sample === true ? 'strong' : 'a');
    if (event.is_sample !== true) {
      title.href = 'events.html?id=' + encodeURIComponent(event.id);
    }
    title.textContent = String(event.title || 'Event');
    item.appendChild(title);
    const meta = document.createElement('span');
    meta.className = 'muted';
    meta.textContent = (formatBakuDateTime(event.starts_at) || 'Date unavailable') + ' · ' + String(event.location || 'Location unavailable') + ' · ' + String(event.rsvp_count || 0) + ' going';
    item.appendChild(meta);
    if (event.is_sample === true) {
      const sample = document.createElement('span');
      sample.className = 'badge';
      sample.textContent = 'Sample';
      item.appendChild(sample);
    }
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
  const remindersSection = document.getElementById('reminders-list');
  const scheduleSection = document.getElementById('schedule-list');
  const feedSection = document.getElementById('feed-preview-list');
  const todosSection = document.getElementById('todos-list');
  const groupsSection = document.getElementById('popular-groups-list');
  const eventsSection = document.getElementById('events-list');
  const context = await getAuthContext();
  let loadedCourses = [];

  if (context.session) {
    try {
      const profileResponse = await fetch('/api/profile?id=1', { headers: context.headers });
      if (!profileResponse.ok) throw new Error('Profile unavailable');
      const profile = await profileResponse.json();
      const firstName = String(profile.name || '').trim().split(/\s+/)[0] || 'student';
      setWelcome(welcome, 'Welcome back, ' + firstName, profile.university || '');
      const composerAvatar = document.getElementById('composer-avatar');
      if (composerAvatar) {
        const profileName = String(profile.name || '').trim();
        composerAvatar.textContent = profileName.split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase() || 'S';
      }
      const university = document.getElementById('dashboard-university');
      if (university) {
        university.textContent = profile.university ? String(profile.university) : 'No university selected yet.';
        university.className = profile.university ? 'university-name' : 'empty-state';
      }
    } catch (error) {
      setWelcome(welcome, 'Welcome to Lotus Campus', '');
      const university = document.getElementById('dashboard-university');
      if (university) university.textContent = 'No university selected yet.';
    }
  } else {
    setWelcome(welcome, 'Welcome to Lotus Campus', '');
    const university = document.getElementById('dashboard-university');
    if (university) university.textContent = 'Log in to see your university.';
  }

  try {
    const remindersResponse = await fetch('/api/reminders', { headers: context.headers });
    if (!remindersResponse.ok) throw new Error('Reminders unavailable');
    const reminders = await remindersResponse.json();
    if (!Array.isArray(reminders) || reminders.length === 0) {
      showMessage(remindersSection, 'Nothing due in the next 48 hours.');
    } else {
      renderReminders(remindersSection, reminders);
    }
  } catch (error) {
    showMessage(remindersSection, 'Could not load reminders.', true);
  }

  try {
    const coursesResponse = await fetch('/api/courses', { headers: context.headers });
    if (!coursesResponse.ok) throw new Error('Courses unavailable');
    const courses = await coursesResponse.json();
    loadedCourses = Array.isArray(courses) ? courses : [];
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
      renderClasses(scheduleSection, schedule, [], loadedCourses);
      if (context.session) {
        try {
          const personalResponse = await fetch('/api/personal-classes', { headers: context.headers });
          if (!personalResponse.ok) throw new Error('Personal classes unavailable');
          const personalClasses = await personalResponse.json();
          renderClasses(scheduleSection, schedule, Array.isArray(personalClasses) ? personalClasses : [], loadedCourses);
        } catch (error) {
          showPersonalHomeMessage(scheduleSection, 'Could not load personal classes.');
        }
      }
    }
  } catch (error) {
    showMessage(scheduleSection, 'Could not load the weekly schedule.', true);
  }

  try {
    const feedResponse = await fetch('/api/posts', { headers: context.headers });
    if (!feedResponse.ok) throw new Error('Feed unavailable');
    const posts = await feedResponse.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      renderFeedPreview(feedSection, samplePosts);
    } else {
      renderFeedPreview(feedSection, posts);
    }
  } catch (error) {
    showMessage(feedSection, 'Could not load the feed preview.', true);
  }

  try {
    const todosResponse = await fetch('/api/todos', { headers: context.headers });
    if (!todosResponse.ok) throw new Error('To-do items unavailable');
    const todos = await todosResponse.json();
    if (!Array.isArray(todos)) throw new Error('To-do items unavailable');
    renderTodos(todosSection, todos);
  } catch (error) {
    showMessage(todosSection, 'Could not load to-do items.', true);
  }

  try {
    const groupsResponse = await fetch('/api/groups', { headers: context.headers });
    if (!groupsResponse.ok) throw new Error('Groups unavailable');
    const groups = await groupsResponse.json();
    if (!Array.isArray(groups) || groups.length === 0) {
      renderPopularGroups(groupsSection, sampleGroups, context.headers);
    } else {
      renderPopularGroups(groupsSection, groups, context.headers);
    }
  } catch (error) {
    showMessage(groupsSection, 'Could not load groups.', true);
  }

  try {
    const eventsResponse = await fetch('/api/events', { headers: context.headers });
    if (!eventsResponse.ok) throw new Error('Events unavailable');
    const events = await eventsResponse.json();
    if (!Array.isArray(events) || events.length === 0) {
      renderNextEvents(eventsSection, sampleEvents);
    } else {
      renderNextEvents(eventsSection, events);
    }
  } catch (error) {
    showMessage(eventsSection, 'Could not load campus events.', true);
  }
}

init();
