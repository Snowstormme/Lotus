const { getSupabase } = require('../lib/_supabase');

function getUserId(req) {
  const rawId = (req.query || {}).user_id;
  const id = Number(rawId);
  return rawId && Number.isInteger(id) && id > 0 ? id : null;
}

function timeToMinutes(value) {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const parts = value.split(':');
  return Number(parts[0]) * 60 + Number(parts[1]);
}

function parseBody(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body || 'null'); } catch (err) { return null; }
  }
  return req.body;
}

function parseSlots(req) {
  const slots = parseBody(req);
  if (!Array.isArray(slots) || slots.length > 14) return null;
  for (const slot of slots) {
    if (!slot || typeof slot !== 'object' || Array.isArray(slot) ||
        !Number.isInteger(slot.weekday) || slot.weekday < 0 || slot.weekday > 6) return null;
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

module.exports = async function handler(req, res) {
  const id = getUserId(req);
  if (!id) return res.status(400).json({ error: 'A valid demo user id is required.' });
  try {
    const supabase = getSupabase();
    const user = await requireDemoUser(supabase, id);
    if (!user) return res.status(404).json({ error: 'Demo user not found.' });
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('availability_slots').select('weekday, start_time, end_time').eq('user_id', id).order('weekday', { ascending: true }).order('start_time', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'PUT') {
      const slots = parseSlots(req);
      if (!slots) return res.status(400).json({ error: 'Availability slots are invalid.' });
      const { error: deleteError } = await supabase.from('availability_slots').delete().eq('user_id', id);
      if (deleteError) throw deleteError;
      if (slots.length > 0) {
        const { error: insertError } = await supabase.from('availability_slots').insert(slots.map((slot) => ({
          user_id: id, weekday: slot.weekday, start_time: slot.start_time, end_time: slot.end_time
        })));
        if (insertError) throw insertError;
      }
      return res.status(200).json({ message: 'Availability updated.' });
    }
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    console.error('Could not load or update availability:', err);
    return res.status(500).json({ error: 'Could not load or update availability. Check the Supabase settings in Netlify.' });
  }
};
