import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';
import { CURRENT_SEMESTER } from '../../lib/_enrollments.js';
import { readJsonLimited } from '../../lib/_body.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function validDate(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function getId(value) {
  return Number.isInteger(value) && value > 0 ? value : null;
}

function validateTitle(value) {
  return typeof value === 'string' && value.trim().length >= 1 && value.trim().length <= 200;
}

function daysLeft(value, now) {
  if (!value) return null;
  const due = Date.parse(value);
  if (!Number.isFinite(due)) return null;
  return Math.ceil((due - now) / DAY_MS);
}

function mapTodo(todo, deadline, now) {
  const dueAt = todo.due_at || null;
  const dueTime = dueAt ? Date.parse(dueAt) : NaN;
  const dueSoon = !todo.done && Number.isFinite(dueTime) && dueTime >= now && dueTime - now <= 48 * 60 * 60 * 1000;
  return {
    id: todo.id,
    title: todo.title,
    done: todo.done === true,
    due_at: dueAt,
    deadline_title: deadline ? deadline.title : null,
    days_left: daysLeft(dueAt, now),
    is_due_soon: dueSoon
  };
}

function sortTodos(first, second) {
  if (first.done !== second.done) return first.done ? 1 : -1;
  const firstDue = first.due_at ? Date.parse(first.due_at) : Infinity;
  const secondDue = second.due_at ? Date.parse(second.due_at) : Infinity;
  if (firstDue !== secondDue) return firstDue - secondDue;
  return new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
}

async function getEnrolledCourseIds(supabase, profileId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', profileId)
    .eq('semester', CURRENT_SEMESTER);
  if (error) throw error;
  return new Set((data || []).map((row) => row.course_id));
}

async function getLinkedDeadline(supabase, profileId, deadlineId) {
  if (deadlineId === null) return null;
  const enrolledCourseIds = await getEnrolledCourseIds(supabase, profileId);
  const { data, error } = await supabase.from('deadlines').select('id, title, course_id').eq('id', deadlineId).maybeSingle();
  if (error) throw error;
  if (!data || !enrolledCourseIds.has(data.course_id)) return null;
  return data;
}

async function getDeadlineMap(supabase, todos) {
  const deadlineIds = Array.from(new Set((todos || []).map((todo) => todo.deadline_id).filter((id) => Number.isInteger(id))));
  if (deadlineIds.length === 0) return new Map();
  const { data, error } = await supabase.from('deadlines').select('id, title').in('id', deadlineIds);
  if (error) throw error;
  return new Map((data || []).map((deadline) => [deadline.id, deadline]));
}

async function getTodoResponse(supabase, profileId, todos) {
  const deadlineMap = await getDeadlineMap(supabase, todos);
  const now = Date.now();
  return (todos || []).sort(sortTodos).map((todo) => mapTodo(todo, deadlineMap.get(todo.deadline_id), now));
}

function validateDeadlineField(body) {
  if (!Object.prototype.hasOwnProperty.call(body, 'deadline_id')) return undefined;
  if (body.deadline_id === null) return null;
  return getId(body.deadline_id);
}

function validateDueDateField(body) {
  if (!Object.prototype.hasOwnProperty.call(body, 'due_at')) return undefined;
  if (body.due_at === null || body.due_at === '') return null;
  return validDate(body.due_at) ? body.due_at : false;
}

async function validateLinkedDeadline(supabase, profileId, deadlineId) {
  if (deadlineId === undefined || deadlineId === null) return true;
  return Boolean(await getLinkedDeadline(supabase, profileId, deadlineId));
}

export async function onRequestGet(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const supabase = getSupabase(context.env);
    const { data, error } = await supabase.from('todo_items').select('id, title, done, due_at, deadline_id, created_at').eq('user_id', profile.id);
    if (error) throw error;
    return json(await getTodoResponse(supabase, profile.id, data || []));
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not load to-do items:', error);
    return json({ error: 'Could not load your to-do items.' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const parsed = await readJsonLimited(context.request, 16 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.value;
    if (!body || Array.isArray(body) || !validateTitle(body.title)) return json({ error: 'Task title must be between 1 and 200 characters.' }, 400);
    const dueAt = validateDueDateField(body);
    if (dueAt === false) return json({ error: 'Due date is invalid.' }, 400);
    const deadlineId = validateDeadlineField(body);
    if (deadlineId === null && Object.prototype.hasOwnProperty.call(body, 'deadline_id') && body.deadline_id !== null) return json({ error: 'Deadline is invalid.' }, 400);
    const supabase = getSupabase(context.env);
    if (!(await validateLinkedDeadline(supabase, profile.id, deadlineId))) return json({ error: 'Deadline is not available for your courses.' }, 400);
    const { count, error: countError } = await supabase.from('todo_items').select('id', { count: 'exact', head: true }).eq('user_id', profile.id);
    if (countError) throw countError;
    if ((count || 0) >= 200) return json({ error: 'You can have up to 200 to-do items.' }, 400);
    const { data: created, error: createError } = await supabase.from('todo_items').insert({ user_id: profile.id, title: body.title.trim(), due_at: dueAt, deadline_id: deadlineId }).select('id, title, done, due_at, deadline_id, created_at').single();
    if (createError) throw createError;
    return json((await getTodoResponse(supabase, profile.id, [created]))[0], 201);
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not create to-do item:', error);
    return json({ error: 'Could not create the to-do item.' }, 500);
  }
}

export async function onRequestPut(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const parsed = await readJsonLimited(context.request, 16 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.value;
    if (!body || Array.isArray(body) || typeof body !== 'object') return json({ error: 'To-do item is invalid.' }, 400);
    const id = getId(body.id);
    if (!id) return json({ error: 'A valid to-do item id is required.' }, 400);
    const supabase = getSupabase(context.env);
    const { data: existing, error: existingError } = await supabase.from('todo_items').select('id, title, done, due_at, deadline_id, created_at').eq('id', id).eq('user_id', profile.id).maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return json({ error: 'To-do item not found.' }, 404);
    const update = {};
    if (Object.prototype.hasOwnProperty.call(body, 'title')) {
      if (!validateTitle(body.title)) return json({ error: 'Task title must be between 1 and 200 characters.' }, 400);
      update.title = body.title.trim();
    }
    if (Object.prototype.hasOwnProperty.call(body, 'done')) {
      if (typeof body.done !== 'boolean') return json({ error: 'Done must be a boolean.' }, 400);
      update.done = body.done;
    }
    const dueAt = validateDueDateField(body);
    if (dueAt === false) return json({ error: 'Due date is invalid.' }, 400);
    if (dueAt !== undefined) update.due_at = dueAt;
    const deadlineId = validateDeadlineField(body);
    if (deadlineId === null && Object.prototype.hasOwnProperty.call(body, 'deadline_id') && body.deadline_id !== null) return json({ error: 'Deadline is invalid.' }, 400);
    if (deadlineId !== undefined) {
      if (!(await validateLinkedDeadline(supabase, profile.id, deadlineId))) return json({ error: 'Deadline is not available for your courses.' }, 400);
      update.deadline_id = deadlineId;
    }
    if (Object.keys(update).length === 0) return json((await getTodoResponse(supabase, profile.id, [existing]))[0]);
    const { data: updated, error: updateError } = await supabase.from('todo_items').update(update).eq('id', id).eq('user_id', profile.id).select('id, title, done, due_at, deadline_id, created_at').single();
    if (updateError) throw updateError;
    return json((await getTodoResponse(supabase, profile.id, [updated]))[0]);
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not update to-do item:', error);
    return json({ error: 'Could not update the to-do item.' }, 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const parsed = await readJsonLimited(context.request, 16 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.value;
    const id = body && getId(body.id);
    if (!id) return json({ error: 'A valid to-do item id is required.' }, 400);
    const supabase = getSupabase(context.env);
    const { data, error } = await supabase.from('todo_items').delete().eq('id', id).eq('user_id', profile.id).select('id').maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: 'To-do item not found.' }, 404);
    return json({ message: 'To-do item deleted.' });
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not delete to-do item:', error);
    return json({ error: 'Could not delete the to-do item.' }, 500);
  }
}
