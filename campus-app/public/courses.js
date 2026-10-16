import { getSession } from './js/auth.js';

let allCourses = [];
const search = document.getElementById('course-search');
const semesterField = document.getElementById('semester-field');
const semesterFilter = document.getElementById('semester-filter');
const status = document.getElementById('courses-status');
const list = document.getElementById('courses-list');

function showMessage(message, error = false) { list.replaceChildren(); status.textContent = message; status.className = error ? 'alert error' : 'empty-state'; }
function render() {
  const term = search.value.trim().toLowerCase(); const semester = semesterFilter.value;
  const courses = allCourses.filter((course) => (!semester || course.semester === semester) && [course.code, course.name, course.teacher, course.room].some((value) => String(value || '').toLowerCase().includes(term)));
  if (!courses.length) { showMessage('No courses yet'); return; }
  status.textContent = courses.length + (courses.length === 1 ? ' course' : ' courses') + ' found.'; status.className = 'alert info'; list.replaceChildren(...courses.map((course, index) => {
    const card = document.createElement('a'); card.className = 'card course-card'; card.href = 'course.html?id=' + encodeURIComponent(course.id);
    const bar = document.createElement('span'); bar.className = 'course-card-bar course-color-' + (index % 4); bar.setAttribute('aria-hidden', 'true');
    const content = document.createElement('span'); content.className = 'course-card-content';
    const code = document.createElement('strong'); code.textContent = String(course.code || 'Course');
    const name = document.createElement('span'); name.className = 'course-card-name'; name.textContent = String(course.name || '');
    const details = document.createElement('span'); details.className = 'muted'; details.textContent = 'Teacher: ' + String(course.teacher || '—') + ' · Room: ' + String(course.room || '—');
    content.append(code, name, details); card.append(bar, content); return card;
  }));
}
function setupSemesterFilter() { const semesters = [...new Set(allCourses.map((course) => course.semester).filter(Boolean))].sort(); if (semesters.length <= 1) { semesterField.hidden = true; return; } semesterField.hidden = false; semesterFilter.replaceChildren(); semesters.forEach((semester) => { const option = document.createElement('option'); option.value = String(semester); option.textContent = String(semester); semesterFilter.appendChild(option); }); }
async function load() { try { const session = await getSession(); const headers = session ? { Authorization: 'Bearer ' + session.access_token } : {}; const response = await fetch('/api/courses', { headers }); if (!response.ok) throw new Error('Courses request failed'); const body = await response.json(); allCourses = Array.isArray(body) ? body : []; if (!allCourses.length) { showMessage('No courses yet'); return; } setupSemesterFilter(); render(); } catch (error) { showMessage('Could not load courses.', true); } }
search.addEventListener('input', render); semesterFilter.addEventListener('change', render); load();
