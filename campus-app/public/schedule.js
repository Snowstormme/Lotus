import { getSession } from './js/auth.js';
import { formatBakuDateTime, getBakuDateKey } from './js/dates.js';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const state = { view: 'daily', selected: startOfDay(new Date()), classes: [], personalClasses: [], deadlines: [], courses: [], session: null };

function startOfDay(date) { const result = new Date(date); result.setHours(0, 0, 0, 0); return result; }
function mondayOf(date) { const result = startOfDay(date); const day = (result.getDay() + 6) % 7; result.setDate(result.getDate() - day); return result; }
function dateKey(date) { return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0'); }
function displayDate(date) { return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); }
function classDay(date) { return (date.getDay() + 6) % 7; }
function parseDueDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
function showMessage(container, message, error = false) { container.replaceChildren(); const p = document.createElement('p'); p.className = error ? 'alert error' : 'empty-state'; p.textContent = message; container.appendChild(p); }
function showLoginMessage(container, message) { container.replaceChildren(); const p = document.createElement('p'); p.className = 'empty-state'; p.append(document.createTextNode(message + ' ')); const link = document.createElement('a'); link.className = 'btn secondary'; link.href = 'login.html'; link.textContent = 'Log in'; p.appendChild(link); container.appendChild(p); }
function createText(tag, value, className) { const node = document.createElement(tag); if (className) node.className = className; node.textContent = value == null ? '' : String(value); return node; }
function courseName(code) { const course = state.courses.find((item) => item.code === code); return course ? course.name : ''; }
function classLabel(item) { return item.type ? String(item.type) : 'Class'; }
function courseColor(index) { return 'course-color-' + (index % 4); }

function classCard(item, index) {
  const article = document.createElement('article'); article.className = 'schedule-item';
  const bar = document.createElement('span'); bar.className = 'course-status-bar ' + courseColor(index); bar.setAttribute('aria-hidden', 'true');
  const content = document.createElement('div');
  content.append(createText('strong', String(item.code || 'Course') + (courseName(item.code) ? ' · ' + courseName(item.code) : '')));
  content.append(createText('p', String(item.start_time || '') + '–' + String(item.end_time || '') + ' · Room ' + String(item.room || '—'), 'muted'));
  content.append(createText('span', classLabel(item), 'badge schedule-type'));
  article.append(bar, content); return article;
}

function personalClassCard(item, index) {
  const article = document.createElement('article'); article.className = 'schedule-item personal-schedule-item';
  const bar = document.createElement('span'); bar.className = 'course-status-bar course-color-' + ((index + 2) % 4); bar.setAttribute('aria-hidden', 'true');
  const content = document.createElement('div');
  content.append(createText('strong', String(item.title || 'Personal class')));
  content.append(createText('p', String(item.start_time || '') + '–' + String(item.end_time || '') + ' · Room ' + String(item.room || '—'), 'muted'));
  content.append(createText('span', 'Personal', 'badge schedule-type'));
  article.append(bar, content); return article;
}

function deadlineCard(item) { const itemNode = document.createElement('article'); itemNode.className = 'schedule-deadline'; itemNode.append(createText('strong', item.title || 'Deadline'), createText('span', String(item.type || 'Deadline') + ' · ' + String(item.code || '') + ' · ' + (formatBakuDateTime(item.due_at) || 'Due time unavailable'), 'muted')); return itemNode; }
function datesForWeek() { const monday = mondayOf(state.selected); return Array.from({ length: 7 }, (_, index) => { const date = new Date(monday); date.setDate(monday.getDate() + index); return date; }); }
function classesForDate(date) { return state.classes.filter((item) => Number(item.weekday) === classDay(date)); }
function personalClassesForDate(date) { return state.personalClasses.filter((item) => Number(item.weekday) === classDay(date)); }
function deadlinesForDate(date) { return state.deadlines.filter((item) => parseDueDate(item.due_at) && getBakuDateKey(item.due_at) === dateKey(date)); }

function renderDaily() {
  const date = state.selected; document.getElementById('schedule-date').textContent = displayDate(date);
  const classes = classesForDate(date); const personal = personalClassesForDate(date); const deadlines = deadlinesForDate(date);
  const classContainer = document.getElementById('daily-classes'); const deadlineContainer = document.getElementById('daily-deadlines');
  classContainer.replaceChildren();
  if (!classes.length && !personal.length) showMessage(classContainer, 'No classes scheduled for this day.');
  else { classes.forEach((item, index) => classContainer.appendChild(classCard(item, index))); personal.forEach((item, index) => classContainer.appendChild(personalClassCard(item, index))); }
  if (!deadlines.length) showMessage(deadlineContainer, 'No deadlines for this day.'); else deadlineContainer.replaceChildren(...deadlines.map(deadlineCard));
}

function renderWeekly() {
  const container = document.getElementById('weekly-content'); container.replaceChildren();
  const grid = document.createElement('div'); grid.className = 'schedule-week';
  datesForWeek().forEach((date, index) => {
    const column = document.createElement('section'); column.className = 'week-day'; column.append(createText('h3', shortDays[index] + ' ' + date.getDate()));
    const classes = classesForDate(date); const personal = personalClassesForDate(date);
    if (!classes.length && !personal.length) column.appendChild(createText('p', 'No classes', 'empty-state'));
    else { classes.forEach((item, itemIndex) => column.appendChild(classCard(item, itemIndex))); personal.forEach((item, itemIndex) => column.appendChild(personalClassCard(item, itemIndex))); }
    grid.appendChild(column);
  });
  container.appendChild(grid);
}

function renderCalendar() {
  const container = document.getElementById('calendar-content'); container.replaceChildren();
  const monthStart = new Date(state.selected.getFullYear(), state.selected.getMonth(), 1); const firstDay = (monthStart.getDay() + 6) % 7; const daysInMonth = new Date(state.selected.getFullYear(), state.selected.getMonth() + 1, 0).getDate();
  container.appendChild(createText('h2', monthStart.toLocaleDateString(undefined, { year: 'numeric', month: 'long' }), 'card-title'));
  const grid = document.createElement('div'); grid.className = 'calendar-grid'; shortDays.forEach((day) => grid.appendChild(createText('div', day, 'calendar-weekday')));
  for (let index = 0; index < firstDay; index += 1) grid.appendChild(document.createElement('div'));
  for (let day = 1; day <= daysInMonth; day += 1) { const date = new Date(state.selected.getFullYear(), state.selected.getMonth(), day); const button = document.createElement('button'); button.type = 'button'; button.className = 'calendar-day'; button.textContent = String(day); button.setAttribute('aria-label', displayDate(date)); if (dateKey(date) === dateKey(state.selected)) button.classList.add('selected'); if (classesForDate(date).length || personalClassesForDate(date).length || deadlinesForDate(date).length) button.classList.add('has-events'); button.addEventListener('click', () => { state.selected = date; state.view = 'daily'; updateView(); }); grid.appendChild(button); }
  container.appendChild(grid);
}

function updateView() { document.querySelectorAll('.view-tab').forEach((tab) => { const active = tab.id === state.view + '-tab'; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; }); document.querySelectorAll('.schedule-view').forEach((view) => { view.hidden = view.id !== state.view + '-view'; }); if (state.view === 'daily') renderDaily(); if (state.view === 'weekly') renderWeekly(); if (state.view === 'calendar') renderCalendar(); }
function movePeriod(amount) { if (state.view === 'daily') state.selected.setDate(state.selected.getDate() + amount); else if (state.view === 'weekly') state.selected.setDate(state.selected.getDate() + amount * 7); else state.selected = new Date(state.selected.getFullYear(), state.selected.getMonth() + amount, Math.min(state.selected.getDate(), 28)); updateView(); }
function setupTabs() { const tabs = Array.from(document.querySelectorAll('.view-tab')); tabs.forEach((tab, index) => { tab.addEventListener('click', () => { state.view = tab.id.replace('-tab', ''); updateView(); }); tab.addEventListener('keydown', (event) => { if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); let next = index; if (event.key === 'ArrowRight') next = (index + 1) % tabs.length; if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length; if (event.key === 'Home') next = 0; if (event.key === 'End') next = tabs.length - 1; tabs[next].focus(); tabs[next].click(); }); }); }

function responseMessage(response, fallback) { return response.json().then((body) => body && typeof body.error === 'string' ? body.error : fallback).catch(() => fallback); }
function personalHeaders() { return state.session ? { Authorization: 'Bearer ' + state.session.access_token, 'Content-Type': 'application/json' } : {}; }

function renderPersonalList(classes) {
  const container = document.getElementById('personal-classes-list'); container.replaceChildren();
  if (!classes.length) { showMessage(container, 'No personal classes yet. Add your own classes or paste your timetable.'); return; }
  const list = document.createElement('ul'); list.className = 'personal-class-list';
  classes.forEach((item) => {
    const row = document.createElement('li'); row.className = 'personal-class-row';
    const details = document.createElement('div'); details.append(createText('strong', item.title), createText('span', dayNames[item.weekday] + ' · ' + item.start_time + '–' + item.end_time + (item.room ? ' · ' + item.room : ''), 'muted'));
    const button = document.createElement('button'); button.type = 'button'; button.className = 'btn danger'; button.textContent = 'Delete'; button.addEventListener('click', async () => { if (!window.confirm('Delete this personal class?')) return; button.disabled = true; const response = await fetch('/api/personal-classes', { method: 'DELETE', headers: personalHeaders(), body: JSON.stringify({ id: item.id }) }); if (!response.ok) { document.getElementById('personal-status').className = 'alert error'; document.getElementById('personal-status').textContent = await responseMessage(response, 'Could not delete the personal class.'); button.disabled = false; return; } await loadPersonalClasses(); });
    row.append(details, button); list.appendChild(row);
  });
  container.appendChild(list);
}

async function loadPersonalClasses() {
  const status = document.getElementById('personal-status');
  if (!state.session) { status.className = 'empty-state'; status.textContent = 'Log in to manage your personal classes.'; renderPersonalList([]); return; }
  status.className = 'empty-state'; status.textContent = 'Loading your personal classes...';
  const response = await fetch('/api/personal-classes', { headers: personalHeaders() });
  if (!response.ok) { status.className = 'alert error'; status.textContent = await responseMessage(response, 'Could not load your personal classes.'); showMessage(document.getElementById('personal-classes-list'), 'Could not load your personal classes.', true); return; }
  const classes = await response.json(); state.personalClasses = Array.isArray(classes) ? classes : []; status.className = 'alert success'; status.textContent = 'Personal classes loaded.'; renderPersonalList(state.personalClasses); updateView();
}

function setupPersonalForms() {
  const form = document.getElementById('personal-class-form'); const importForm = document.getElementById('personal-import-form'); const addButton = document.getElementById('personal-add'); const importButton = document.getElementById('personal-import-button');
  if (!state.session) { form.hidden = true; importForm.hidden = true; return; }
  form.addEventListener('submit', async (event) => { event.preventDefault(); addButton.disabled = true; const body = { title: document.getElementById('personal-title').value.trim(), weekday: Number(document.getElementById('personal-weekday').value), start_time: document.getElementById('personal-start').value, end_time: document.getElementById('personal-end').value, room: document.getElementById('personal-room').value.trim() || null }; const response = await fetch('/api/personal-classes', { method: 'POST', headers: personalHeaders(), body: JSON.stringify(body) }); const status = document.getElementById('personal-status'); if (!response.ok) { status.className = 'alert error'; status.textContent = await responseMessage(response, 'Could not save the personal class.'); addButton.disabled = false; return; } form.reset(); status.className = 'alert success'; status.textContent = 'Personal class added.'; addButton.disabled = false; await loadPersonalClasses(); });
  importForm.addEventListener('submit', async (event) => { event.preventDefault(); importButton.disabled = true; const status = document.getElementById('personal-status'); const response = await fetch('/api/personal-classes', { method: 'POST', headers: personalHeaders(), body: JSON.stringify({ import_text: document.getElementById('personal-import').value }) }); if (!response.ok) { status.className = 'alert error'; status.textContent = await responseMessage(response, 'Could not import personal classes.'); importButton.disabled = false; return; } document.getElementById('personal-import').value = ''; status.className = 'alert success'; status.textContent = 'Personal classes imported.'; importButton.disabled = false; await loadPersonalClasses(); });
}

async function load() {
  const status = document.getElementById('schedule-status');
  try {
    state.session = await getSession();
    if (!state.session) {
      state.classes = []; state.deadlines = []; state.courses = [];
      showLoginMessage(status, 'Log in to see your weekly schedule and deadlines.');
      showMessage(document.getElementById('daily-classes'), 'No classes scheduled for this day.');
      showMessage(document.getElementById('daily-deadlines'), 'No deadlines for this day.');
      setupPersonalForms();
      await loadPersonalClasses();
      updateView();
      return;
    }
    const headers = { Authorization: 'Bearer ' + state.session.access_token };
    const responses = await Promise.all([fetch('/api/calendar', { headers }), fetch('/api/deadlines', { headers }), fetch('/api/courses', { headers })]);
    if (responses.some((response) => response.status === 401)) throw new Error('Your session is not valid.');
    if (responses.some((response) => !response.ok)) throw new Error('Schedule request failed');
    const [classes, deadlines, courses] = await Promise.all(responses.map((response) => response.json())); state.classes = Array.isArray(classes) ? classes : []; state.deadlines = Array.isArray(deadlines) ? deadlines : []; state.courses = Array.isArray(courses) ? courses : []; status.textContent = 'Schedule loaded.'; status.className = 'alert success';
  } catch (error) {
    status.textContent = error.message === 'Your session is not valid.' ? error.message : 'Could not load the schedule.'; status.className = 'alert error'; showMessage(document.getElementById('daily-classes'), 'Could not load classes.', true); showMessage(document.getElementById('daily-deadlines'), 'Could not load deadlines.', true); showMessage(document.getElementById('weekly-content'), 'Could not load the weekly schedule.', true); showMessage(document.getElementById('calendar-content'), 'Could not load the calendar.', true);
  }
  setupPersonalForms();
  await loadPersonalClasses().catch(() => { const statusNode = document.getElementById('personal-status'); statusNode.className = 'alert error'; statusNode.textContent = 'Could not load your personal classes.'; showMessage(document.getElementById('personal-classes-list'), 'Could not load your personal classes.', true); });
  updateView();
}

document.getElementById('previous-button').addEventListener('click', () => movePeriod(-1)); document.getElementById('next-button').addEventListener('click', () => movePeriod(1)); document.getElementById('today-button').addEventListener('click', () => { state.selected = startOfDay(new Date()); updateView(); }); setupTabs(); load();
