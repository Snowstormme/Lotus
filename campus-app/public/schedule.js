import { getSession } from './js/auth.js';
import { formatBakuDateTime, getBakuDateKey } from './js/dates.js';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const state = { view: 'daily', selected: startOfDay(new Date()), classes: [], deadlines: [], courses: [], error: false };

function startOfDay(date) { const result = new Date(date); result.setHours(0, 0, 0, 0); return result; }
function mondayOf(date) { const result = startOfDay(date); const day = (result.getDay() + 6) % 7; result.setDate(result.getDate() - day); return result; }
function dateKey(date) { return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0'); }
function displayDate(date) { return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); }
function classDay(date) { return (date.getDay() + 6) % 7; }
function parseDueDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
function showMessage(container, message, error = false) { container.replaceChildren(); const p = document.createElement('p'); p.className = error ? 'alert error' : 'empty-state'; p.textContent = message; container.appendChild(p); }
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
function deadlineCard(item) { const itemNode = document.createElement('article'); itemNode.className = 'schedule-deadline'; itemNode.append(createText('strong', item.title || 'Deadline'), createText('span', String(item.type || 'Deadline') + ' · ' + String(item.code || '') + ' · ' + (formatBakuDateTime(item.due_at) || 'Due time unavailable'), 'muted')); return itemNode; }
function datesForWeek() { const monday = mondayOf(state.selected); return Array.from({ length: 7 }, (_, index) => { const date = new Date(monday); date.setDate(monday.getDate() + index); return date; }); }
function classesForDate(date) { return state.classes.filter((item) => Number(item.weekday) === classDay(date)); }
function deadlinesForDate(date) { return state.deadlines.filter((item) => parseDueDate(item.due_at) && getBakuDateKey(item.due_at) === dateKey(date)); }

function renderDaily() {
  const date = state.selected; document.getElementById('schedule-date').textContent = displayDate(date);
  const classes = classesForDate(date); const deadlines = deadlinesForDate(date);
  const classContainer = document.getElementById('daily-classes'); const deadlineContainer = document.getElementById('daily-deadlines');
  if (!classes.length) showMessage(classContainer, 'No classes scheduled for this day.'); else { classContainer.replaceChildren(...classes.map(classCard)); }
  if (!deadlines.length) showMessage(deadlineContainer, 'No deadlines for this day.'); else { deadlineContainer.replaceChildren(...deadlines.map(deadlineCard)); }
}
function renderWeekly() {
  const container = document.getElementById('weekly-content'); container.replaceChildren();
  const grid = document.createElement('div'); grid.className = 'schedule-week';
  datesForWeek().forEach((date, index) => { const column = document.createElement('section'); column.className = 'week-day'; column.append(createText('h3', shortDays[index] + ' ' + date.getDate())); const items = classesForDate(date); if (!items.length) column.appendChild(createText('p', 'No classes', 'empty-state')); else items.forEach((item, itemIndex) => column.appendChild(classCard(item, itemIndex))); grid.appendChild(column); });
  container.appendChild(grid);
}
function renderCalendar() {
  const container = document.getElementById('calendar-content'); container.replaceChildren();
  const monthStart = new Date(state.selected.getFullYear(), state.selected.getMonth(), 1); const firstDay = (monthStart.getDay() + 6) % 7; const daysInMonth = new Date(state.selected.getFullYear(), state.selected.getMonth() + 1, 0).getDate();
  const heading = createText('h2', monthStart.toLocaleDateString(undefined, { year: 'numeric', month: 'long' }), 'card-title'); container.appendChild(heading);
  const grid = document.createElement('div'); grid.className = 'calendar-grid'; shortDays.forEach((day) => grid.appendChild(createText('div', day, 'calendar-weekday')));
  for (let index = 0; index < firstDay; index += 1) grid.appendChild(document.createElement('div'));
  for (let day = 1; day <= daysInMonth; day += 1) { const date = new Date(state.selected.getFullYear(), state.selected.getMonth(), day); const button = document.createElement('button'); button.type = 'button'; button.className = 'calendar-day'; button.textContent = String(day); button.setAttribute('aria-label', displayDate(date)); if (dateKey(date) === dateKey(state.selected)) button.classList.add('selected'); if (classesForDate(date).length || deadlinesForDate(date).length) button.classList.add('has-events'); button.addEventListener('click', () => { state.selected = date; state.view = 'daily'; updateView(); }); grid.appendChild(button); }
  container.appendChild(grid);
}
function updateView() { document.querySelectorAll('.view-tab').forEach((tab) => { const active = tab.id === state.view + '-tab'; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; }); document.querySelectorAll('.schedule-view').forEach((view) => { view.hidden = view.id !== state.view + '-view'; }); if (state.view === 'daily') renderDaily(); if (state.view === 'weekly') renderWeekly(); if (state.view === 'calendar') renderCalendar(); }
function movePeriod(amount) { if (state.view === 'daily') state.selected.setDate(state.selected.getDate() + amount); else if (state.view === 'weekly') state.selected.setDate(state.selected.getDate() + amount * 7); else state.selected = new Date(state.selected.getFullYear(), state.selected.getMonth() + amount, Math.min(state.selected.getDate(), 28)); updateView(); }
function setupTabs() { const tabs = Array.from(document.querySelectorAll('.view-tab')); tabs.forEach((tab, index) => { tab.addEventListener('click', () => { state.view = tab.id.replace('-tab', ''); updateView(); }); tab.addEventListener('keydown', (event) => { if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); let next = index; if (event.key === 'ArrowRight') next = (index + 1) % tabs.length; if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length; if (event.key === 'Home') next = 0; if (event.key === 'End') next = tabs.length - 1; tabs[next].focus(); tabs[next].click(); }); }); }
async function load() { const status = document.getElementById('schedule-status'); try { const session = await getSession(); const headers = session ? { Authorization: 'Bearer ' + session.access_token } : {}; const responses = await Promise.all([fetch('/api/calendar', { headers }), fetch('/api/deadlines', { headers }), fetch('/api/courses', { headers })]); if (responses.some((response) => !response.ok)) throw new Error('Schedule request failed'); const [classes, deadlines, courses] = await Promise.all(responses.map((response) => response.json())); state.classes = Array.isArray(classes) ? classes : []; state.deadlines = Array.isArray(deadlines) ? deadlines : []; state.courses = Array.isArray(courses) ? courses : []; status.textContent = 'Schedule loaded.'; status.className = 'alert success'; updateView(); } catch (error) { state.error = true; status.textContent = 'Could not load the schedule.'; status.className = 'alert error'; showMessage(document.getElementById('daily-classes'), 'Could not load classes.', true); showMessage(document.getElementById('daily-deadlines'), 'Could not load deadlines.', true); showMessage(document.getElementById('weekly-content'), 'Could not load the weekly schedule.', true); showMessage(document.getElementById('calendar-content'), 'Could not load the calendar.', true); } }
document.getElementById('previous-button').addEventListener('click', () => movePeriod(-1)); document.getElementById('next-button').addEventListener('click', () => movePeriod(1)); document.getElementById('today-button').addEventListener('click', () => { state.selected = startOfDay(new Date()); updateView(); }); setupTabs(); load();
