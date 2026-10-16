import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function getUserId(context) {
  const rawId = new URL(context.request.url).searchParams.get('user_id');
  const id = Number(rawId);
  return rawId && Number.isInteger(id) && id > 0 ? id : null;
}

function timeToMinutes(value) {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const parts = value.split(':');
  return Number(parts[0]) * 60 + Number(parts[1]);
}

async function parseSlots(request) {
  let slots;
  try {
    slots = await request.json();
    if (typeof slots === 'string') slots = JSON.parse(slots);
  } catch (err) {
    return null;
  }
  if (!Array.isArray(slots) || slots.length > 14) return null;
  for (const slot of slots) {
    if (!slot || typeof slot !== 'object' || Array.isArray(slot) || !Number.isInteger(slot.weekday) || slot.weekday < 0 || slot.weekday > 6) return null;
    const start = timeToMinutes(slot.start_time);
    const end = timeToMinutes(slot.end_time);
    if (start === null || end === null || end <= start) return null;
  }
  return slots;
}

async function requireDemoUser(supabase, id) {
  const { data, error } = await supabase.from('users').select('id').eq('id', id).eq('is_demo', true).maybeSingle();
  if (error) throw error;
  return data;
}

export async function onRequestGet(context) {
  const hasAuth = Boolean(context.request.headers.get('Authorization'));
  const id = getUserId(context);
  if (!hasAuth && !id) return json({ error: 'A valid demo user id is required.' }, 400);
  try {
    const supabase = getSupabase(context.env);
    const user = hasAuth ? await requireOwnProfile(context.request, context.env) : await requireDemoUser(supabase, id);
    if (!user) return json({ error: 'Demo user not found.' }, 404);
    const { data, error } = await supabase.from('availability_slots').select('weekday, start_time, end_time').eq('user_id', user.id).order('weekday', { ascending: true }).order('start_time', { ascending: true });
    if (error) throw error;
    return json(data);
  } catch (err) {
    if (err.status === 401 || err.status === 404) return json({ error: err.publicMessage }, err.status);
    console.error('Could not load or update availability:', err);
    return json({ error: 'Could not load or update availability. Check the Supabase settings in Netlify.' }, 500);
  }
}

export async function onRequestPut(context) {
  const hasAuth = Boolean(context.request.headers.get('Authorization'));
  if (!hasAuth) return json({ error: 'Login is required.' }, 401);
  const slots = await parseSlots(context.request);
  if (!slots) return json({ error: 'Availability slots are invalid.' }, 400);
  try {
    const supabase = getSupabase(context.env);
    const user = await requireOwnProfile(context.request, context.env);
    const { error: deleteError } = await supabase.from('availability_slots').delete().eq('user_id', user.id);
    if (deleteError) throw deleteError;
    if (slots.length > 0) {
      const { error: insertError } = await supabase.from('availability_slots').insert(slots.map((slot) => ({ user_id: user.id, weekday: slot.weekday, start_time: slot.start_time, end_time: slot.end_time })));
      if (insertError) throw insertError;
    }
    return json({ message: 'Availability updated.' });
  } catch (err) {
    if (err.status === 401 || err.status === 404) return json({ error: err.publicMessage }, err.status);
    console.error('Could not load or update availability:', err);
    return json({ error: 'Could not load or update availability. Check the Supabase settings in Netlify.' }, 500);
  }
}
