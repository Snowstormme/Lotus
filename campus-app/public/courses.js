import { getSession } from './js/auth.js';

let allCourses = [];
const search = document.getElementById('course-search');
const semesterField = document.getElementById('semester-field');
const semesterFilter = document.getElementById('semester-filter');
const status = document.getElementById('courses-status');
const list = document.getElementById('courses-list');

function showMessage(message, error = false) { list.replaceChildren(); status.textContent = message; status.className = error ? 'alert error' : 'empty-state'; }
function showLoggedOutMessage() {
  list.replaceChildren();
  status.replaceChildren();
  status.className = 'empty-state';
  status.append(document.createTextNode('Log in to see your courses. Browse the catalog on the Courses page after you log in. '));
  const link = document.createElement('a');
  link.className = 'btn secondary';
  link.href = 'login.html';
  link.textContent = 'Log in';
  status.appendChild(link);
}
function render() {
  const term = search.value.trim().toLowerCase(); const semester = semesterFilter.value;
  const courses = allCourses.filter((course) => (!semester || course.semester === semester) && [course.code, course.name, course.teacher, course.room].some((value) => String(value || '').toLowerCase().includes(term)));
  if (!courses.length) { showMessage('No courses yet'); return; }
  status.textContent = courses.length + (courses.length === 1 ? ' course' : ' courses') + ' found.'; status.className = 'alert info'; list.replaceChildren(...courses.map((course, index) => {
    const card = document.createElement('a'); card.className = 'card course-card'; card.href = 'course.html?id=' + encodeURIComponent(course.id);
    const bar = document.createElement('span'); bar.className = 'course-card-bar course-color-' + (index % 4); bar.setAttribute('aria-hidden', 'true');
    const content = document.createElement('span'); content.className = 'course-card-content';
    const icon = document.createElement('svg'); icon.className = 'course-card-icon'; icon.setAttribute('aria-hidden', 'true'); const iconUse = document.createElement('use'); iconUse.setAttribute('href', 'img/icons.svg#courses'); icon.appendChild(iconUse);
    const code = document.createElement('strong'); code.textContent = String(course.code || 'Course');
    const name = document.createElement('span'); name.className = 'course-card-name'; name.textContent = String(course.name || '');
    if (course.is_catalog === true) { const catalog = document.createElement('span'); catalog.className = 'badge'; catalog.textContent = 'Catalog'; content.appendChild(catalog); }
    const details = document.createElement('span'); details.className = 'muted'; details.textContent = 'Teacher: ' + String(course.teacher || '—') + ' · Room: ' + String(course.room || '—');
    const action = document.createElement('span'); action.className = 'course-card-action'; action.textContent = 'Open course'; content.append(icon, code, name, details, action); card.append(bar, content); return card;
  }));
}
function setupSemesterFilter() { const semesters = [...new Set(allCourses.map((course) => course.semester).filter(Boolean))].sort(); if (semesters.length <= 1) { semesterField.hidden = true; return; } semesterField.hidden = false; semesterFilter.replaceChildren(); semesters.forEach((semester) => { const option = document.createElement('option'); option.value = String(semester); option.textContent = String(semester); semesterFilter.appendChild(option); }); }
async function load() {
  let session;
  try { session = await getSession(); } catch (error) { session = null; }
  if (!session) { showLoggedOutMessage(); return; }
  try {
    const response = await fetch('/api/courses', { headers: { Authorization: 'Bearer ' + session.access_token } });
    if (!response.ok) {
      if (response.status === 401) { showMessage('Your session is not valid.', true); return; }
      throw new Error('Courses request failed');
    }
    const body = await response.json();
    allCourses = Array.isArray(body) ? body : [];
    if (!allCourses.length) { showMessage('No courses yet'); return; }
    setupSemesterFilter();
    render();
  } catch (error) { showMessage('Could not load courses.', true); }
}
search.addEventListener('input', render); semesterFilter.addEventListener('change', render); load();
