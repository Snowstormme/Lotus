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
  const materialsLink = document.getElementById('course-materials-link');
  if (materialsLink) {
    materialsLink.hidden = courses.length === 0;
    if (courses.length > 0) materialsLink.href = 'course.html?id=' + encodeURIComponent(courses[0].id);
  }
  const list = document.createElement('ul'); list.className = 'home-course-list';
  courses.forEach(function (course) {
    const row = document.createElement('li');
    const link = document.createElement('a'); link.href = 'course.html?id=' + encodeURIComponent(course.id);
    const code = document.createElement('span'); code.className = 'course-code'; code.textContent = String(course.code || 'Course');
    const name = document.createElement('strong'); name.textContent = String(course.name || '');
    const details = document.createElement('span'); details.className = 'muted'; details.textContent = 'Teacher: ' + String(course.teacher || '—') + ' · Room: ' + String(course.room || '—');
    link.append(code, name, details); row.appendChild(link); list.appendChild(row);
  });
  container.appendChild(list);
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

function renderPopularGroups(container, groups, headers) {
  container.replaceChildren();
  const list = document.createElement('ul');
  list.className = 'dashboard-list';
  groups.slice(0, 3).forEach(function (group) {
    const item = document.createElement('li');
    const title = document.createElement('a');
    title.href = 'groups.html?id=' + encodeURIComponent(group.id);
    title.textContent = String(group.name || 'Group');
    item.appendChild(title);
    const meta = document.createElement('span');
    meta.className = 'muted';
    meta.textContent = String(group.member_count || 0) + ' member' + (group.member_count === 1 ? '' : 's') + ' · ' + String(group.kind || 'group');
    item.appendChild(meta);
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
    const title = document.createElement('a');
    title.href = 'events.html?id=' + encodeURIComponent(event.id);
    title.textContent = String(event.title || 'Event');
    item.appendChild(title);
    const meta = document.createElement('span');
    meta.className = 'muted';
    meta.textContent = (formatBakuDateTime(event.starts_at) || 'Date unavailable') + ' · ' + String(event.location || 'Location unavailable') + ' · ' + String(event.rsvp_count || 0) + ' going';
    item.appendChild(meta);
    list.appendChild(item);
  });
  container.appendChild(list);
}

function setWelcome(container, university) {
  container.replaceChildren();
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
  const groupsSection = document.getElementById('popular-groups-list');
  const eventsSection = document.getElementById('events-list');
  const context = await getAuthContext();
  let loadedCourses = [];

  if (context.session) {
    try {
      const profileResponse = await fetch('/api/profile?id=1', { headers: context.headers });
      if (!profileResponse.ok) throw new Error('Profile unavailable');
      const profile = await profileResponse.json();
      setWelcome(welcome, profile.university || '');
      const composerAvatar = document.getElementById('composer-avatar');
      if (composerAvatar) {
        const profileName = String(profile.name || '').trim();
        composerAvatar.textContent = profileName.split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase() || 'S';
      }
    } catch (error) {
      setWelcome(welcome, '');
    }
  } else {
    setWelcome(welcome, '');
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
      showMessage(feedSection, 'No posts yet.');
    } else {
      renderFeedPreview(feedSection, posts);
    }
  } catch (error) {
    showMessage(feedSection, 'Could not load the feed preview.', true);
  }

  try {
    const groupsResponse = await fetch('/api/groups', { headers: context.headers });
    if (!groupsResponse.ok) throw new Error('Groups unavailable');
    const groups = await groupsResponse.json();
    if (!Array.isArray(groups) || groups.length === 0) {
      showMessage(groupsSection, 'No groups yet.');
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
      showMessage(eventsSection, 'No upcoming events yet.');
    } else {
      renderNextEvents(eventsSection, events);
    }
  } catch (error) {
    showMessage(eventsSection, 'Could not load campus events.', true);
  }
}

init();
