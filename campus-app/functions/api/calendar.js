import { getSupabase } from '../../lib/_supabase.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestGet(context) {
  try {
    const supabase = getSupabase(context.env);
    const { data, error } = await supabase
      .from('classes')
      .select('weekday, start_time, end_time, room, courses!inner(code)')
      .order('weekday', { ascending: true })
      .order('start_time', { ascending: true });
    if (error) throw error;
    return json(data.map((classItem) => ({
      code: classItem.courses.code,
      weekday: classItem.weekday,
      start_time: classItem.start_time,
      end_time: classItem.end_time,
      room: classItem.room
    })));
  } catch (err) {
    console.error('Could not load calendar:', err);
    return json({ error: 'Could not load the weekly schedule. Check the Supabase settings in Netlify.' }, 500);
  }
}
