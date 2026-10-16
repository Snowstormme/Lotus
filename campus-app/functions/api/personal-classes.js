import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_PATTERN = '(?:[01]\\d|2[0-3]):[0-5]\\d';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function parseBody(request) {
  try {
    const body = await request.json();
    if (typeof body === 'string') return JSON.parse(body);
    return body;
  } catch (error) {
    return null;
  }
}

function validTitle(value) {
  return typeof value === 'string' && value.trim().length >= 1 && value.trim().length <= 100;
}

function validRoom(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim().length <= 30);
}

function validTime(value) {
  return typeof value === 'string' && new RegExp('^' + TIME_PATTERN + '$').test(value);
}

function timeMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function validClassFields(item) {
  return validTitle(item.title) && Number.isInteger(item.weekday) && item.weekday >= 0 && item.weekday <= 6 && validTime(item.start_time) && validTime(item.end_time) && timeMinutes(item.end_time) > timeMinutes(item.start_time) && validRoom(item.room);
}

function responseItem(item) {
  return { id: item.id, title: item.title, weekday: item.weekday, start_time: item.start_time, end_time: item.end_time, room: item.room || null };
}

function sortClasses(first, second) {
  return first.weekday - second.weekday || String(first.start_time).localeCompare(String(second.start_time));
}

function parseImportLine(line) {
  const pattern = new RegExp('^(' + DAY_NAMES.join('|') + ') (' + TIME_PATTERN + ')-(' + TIME_PATTERN + ') ([^|]{1,100})(?: \\| (.{1,30}))?$');
  const match = line.match(pattern);
  if (!match) return null;
  const title = match[4].trim();
  const room = match[5] === undefined ? null : match[5].trim();
  if (!title || title.length > 100 || (room !== null && (!room || room.length > 30))) return null;
  const item = { title, weekday: DAY_NAMES.indexOf(match[1]), start_time: match[2], end_time: match[3], room };
  return timeMinutes(item.end_time) > timeMinutes(item.start_time) ? item : null;
}

function parseImport(value) {
  if (typeof value !== 'string') return { error: 'Import text is invalid.' };
  const lines = value.split(/\\r?\\n/);
  if (lines.length > 30) return { error: 'You can import at most 30 classes at a time.' };
  const items = [];
  for (let index = 0; index < lines.length; index += 1) {
    const item = parseImportLine(lines[index]);
    if (!item) return { error: 'Invalid class on line ' + (index + 1) + '.' };
    items.push(item);
  }
  return { items };
}

async function getOwnCount(supabase, profileId) {
  const { count, error } = await supabase.from('personal_classes').select('id', { count: 'exact', head: true }).eq('user_id', profileId);
  if (error) throw error;
  return count || 0;
}

export async function onRequestGet(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const { data, error } = await getSupabase(context.env).from('personal_classes').select('id, title, weekday, start_time, end_time, room').eq('user_id', profile.id).order('weekday', { ascending: true }).order('start_time', { ascending: true });
    if (error) throw error;
    return json((data || []).map(responseItem));
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not load personal classes:', error);
    return json({ error: 'Could not load your personal classes.' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const body = await parseBody(context.request);
    if (!body || Array.isArray(body) || typeof body !== 'object') return json({ error: 'Class details are invalid.' }, 400);
    let items;
    if (Object.prototype.hasOwnProperty.call(body, 'import_text')) {
      const parsed = parseImport(body.import_text);
      if (parsed.error) return json({ error: parsed.error }, 400);
      items = parsed.items;
    } else {
      if (!validClassFields(body)) return json({ error: 'Class details are invalid.' }, 400);
      items = [{ title: body.title.trim(), weekday: body.weekday, start_time: body.start_time, end_time: body.end_time, room: body.room == null || body.room.trim() === '' ? null : body.room.trim() }];
    }
    const supabase = getSupabase(context.env);
    if ((await getOwnCount(supabase, profile.id)) + items.length > 60) return json({ error: 'You can have up to 60 personal classes.' }, 400);
    const { data, error } = await supabase.from('personal_classes').insert(items.map((item) => ({ ...item, user_id: profile.id }))).select('id, title, weekday, start_time, end_time, room');
    if (error) throw error;
    const result = (data || []).map(responseItem).sort(sortClasses);
    return json(Object.prototype.hasOwnProperty.call(body, 'import_text') ? result : result[0], 201);
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not create personal classes:', error);
    return json({ error: 'Could not save your personal classes.' }, 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const body = await parseBody(context.request);
    const id = body && Number.isInteger(body.id) && body.id > 0 ? body.id : null;
    if (!id) return json({ error: 'A valid class id is required.' }, 400);
    const { data, error } = await getSupabase(context.env).from('personal_classes').delete().eq('id', id).eq('user_id', profile.id).select('id').maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: 'Personal class not found.' }, 404);
    return json({ ok: true });
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not delete personal class:', error);
    return json({ error: 'Could not delete the personal class.' }, 500);
  }
}
