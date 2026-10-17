import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';
import { readJsonLimited } from '../../lib/_body.js';

function json(body, status = 200) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }); }
function validId(value) { return Number.isInteger(value) && value > 0; }

async function loadEvents(supabase, profile, id) {
  let query = supabase.from('events').select('id, title, description, starts_at, location, organizer_name, university_id, group_id').eq('university_id', profile.university_id).gt('starts_at', new Date().toISOString()).order('starts_at', { ascending: true });
  if (id !== null) query = query.eq('id', id);
  if (id === null) query = query.limit(30);
  const result = await query;
  if (result.error) throw result.error;
  return result.data || [];
}

async function decorateEvents(supabase, events, profileId) {
  const eventIds = events.map((event) => event.id);
  const groupIds = events.map((event) => event.group_id).filter((id) => id !== null);
  const groups = groupIds.length ? await supabase.from('groups').select('id, name').in('id', groupIds) : { data: [], error: null };
  if (groups.error) throw groups.error;
  const rsvps = eventIds.length ? await supabase.from('event_rsvps').select('event_id, user_id').in('event_id', eventIds) : { data: [], error: null };
  if (rsvps.error) throw rsvps.error;
  const groupNames = new Map((groups.data || []).map((group) => [group.id, group.name]));
  const counts = new Map();
  const mine = new Set();
  (rsvps.data || []).forEach((rsvp) => { counts.set(rsvp.event_id, (counts.get(rsvp.event_id) || 0) + 1); if (rsvp.user_id === profileId) mine.add(rsvp.event_id); });
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    starts_at: event.starts_at,
    location: event.location,
    organizer_name: event.organizer_name,
    rsvp_count: counts.get(event.id) || 0,
    is_rsvped: mine.has(event.id),
    group_name: event.group_id === null ? null : (groupNames.get(event.group_id) || null),
    is_sample: event.group_id === null
  }));
}

export async function onRequestGet(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const supabase = getSupabase(context.env);
    const rawId = new URL(context.request.url).searchParams.get('id');
    if (rawId !== null) {
      const id = Number(rawId);
      if (!validId(id)) return json({ error: 'A valid event id is required.' }, 400);
      const events = await loadEvents(supabase, profile, id);
      if (!events.length) return json({ error: 'Event not found.' }, 404);
      return json((await decorateEvents(supabase, events, profile.id))[0]);
    }
    return json(await decorateEvents(supabase, await loadEvents(supabase, profile, null), profile.id));
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not load events:', error);
    return json({ error: 'Could not load events.' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const parsed = await readJsonLimited(context.request, 4 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.value;
    const eventId = body && Number(body.event_id);
    if (!body || !['rsvp', 'cancel'].includes(body.action) || !validId(eventId)) return json({ error: 'Event request is invalid.' }, 400);
    const supabase = getSupabase(context.env);
    const events = await loadEvents(supabase, profile, eventId);
    if (!events.length) return json({ error: 'Event not found.' }, 404);
    if (body.action === 'rsvp') {
      const result = await supabase.from('event_rsvps').upsert({ event_id: eventId, user_id: profile.id }, { onConflict: 'event_id,user_id' });
      if (result.error) throw result.error;
    } else {
      const result = await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', profile.id);
      if (result.error) throw result.error;
    }
    const rsvps = await supabase.from('event_rsvps').select('event_id, user_id').eq('event_id', eventId);
    if (rsvps.error) throw rsvps.error;
    return json({ rsvp_count: (rsvps.data || []).length, is_rsvped: body.action === 'rsvp' });
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not update event RSVP:', error);
    return json({ error: 'Could not update event RSVP.' }, 500);
  }
}
