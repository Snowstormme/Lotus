import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function getUserId(context) {
  const rawId = new URL(context.request.url).searchParams.get('id');
  const id = Number(rawId);
  return rawId && Number.isInteger(id) && id > 0 ? id : null;
}

async function parseBody(request) {
  try {
    const body = await request.json();
    if (typeof body === 'string') return JSON.parse(body);
    return body;
  } catch (err) {
    return null;
  }
}

function validateBody(body) {
  if (!body || Array.isArray(body) || typeof body !== 'object') return null;
  if (!Object.prototype.hasOwnProperty.call(body, 'year') || !Object.prototype.hasOwnProperty.call(body, 'languages') || !Object.prototype.hasOwnProperty.call(body, 'weekly_free_hours')) return null;
  if (!Number.isInteger(body.year) || body.year < 1 || body.year > 6) return null;
  if (typeof body.languages !== 'string' || body.languages.length > 50 || /[\r\n]/.test(body.languages)) return null;
  if (!Number.isInteger(body.weekly_free_hours) || body.weekly_free_hours < 0 || body.weekly_free_hours > 60) return null;
  return body;
}

async function getDemoUser(supabase, id) {
  const { data, error } = await supabase.from('users').select('id, name, year, languages, weekly_free_hours, university:universities(name), faculty:faculties(name)').eq('id', id).eq('is_demo', true).maybeSingle();
  if (error) throw error;
  return data;
}

export async function onRequestGet(context) {
  if (context.request.headers.get('Authorization')) {
    try {
      const user = await requireOwnProfile(context.request, context.env);
      return json({ name: user.name, year: user.year, languages: user.languages, weekly_free_hours: user.weekly_free_hours, university: user.university ? user.university.name : null, faculty: user.faculty ? user.faculty.name : null });
    } catch (err) {
      if (err.status === 401 || err.status === 404) return json({ error: err.publicMessage }, err.status);
      console.error('Could not load profile:', err);
      return json({ error: 'Could not load the profile.' }, 500);
    }
  }
  const id = getUserId(context);
  if (!id) return json({ error: 'A valid user id is required.' }, 400);
  try {
    const user = await getDemoUser(getSupabase(context.env), id);
    if (!user) return json({ error: 'Demo user not found.' }, 404);
    return json({ name: user.name, year: user.year, languages: user.languages, weekly_free_hours: user.weekly_free_hours, university: user.university ? user.university.name : null, faculty: user.faculty ? user.faculty.name : null });
  } catch (err) {
    console.error('Could not load profile:', err);
    return json({ error: 'Could not load the profile. Check the Supabase settings in Netlify.' }, 500);
  }
}

export async function onRequestPut(context) {
  const hasAuth = Boolean(context.request.headers.get('Authorization'));
  const id = getUserId(context);
  if (!hasAuth && !id) return json({ error: 'A valid user id is required.' }, 400);
  const body = validateBody(await parseBody(context.request));
  if (!body) return json({ error: 'Year, languages, and weekly free hours are invalid.' }, 400);
  try {
    const supabase = getSupabase(context.env);
    const user = hasAuth ? await requireOwnProfile(context.request, context.env) : await getDemoUser(supabase, id);
    if (!user) return json({ error: 'Demo user not found.' }, 404);
    const update = supabase.from('users').update({ year: body.year, languages: body.languages, weekly_free_hours: body.weekly_free_hours }).eq('id', user.id);
    if (!hasAuth) update.eq('is_demo', true);
    const { error } = await update;
    if (error) throw error;
    return json({ message: 'Profile updated.' });
  } catch (err) {
    if (err.status === 401 || err.status === 404) return json({ error: err.publicMessage }, err.status);
    console.error('Could not update profile:', err);
    return json({ error: 'Could not update the profile.' }, 500);
  }
}
