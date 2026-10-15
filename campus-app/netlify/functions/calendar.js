const { getSupabase } = require('./_supabase');

exports.handler = async () => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('classes')
      .select('weekday, start_time, end_time, room, courses!inner(code)')
      .order('weekday', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.map((classItem) => ({
        code: classItem.courses.code,
        weekday: classItem.weekday,
        start_time: classItem.start_time,
        end_time: classItem.end_time,
        room: classItem.room
      })))
    };
  } catch (err) {
    console.error('Could not load calendar:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Could not load the weekly schedule. Check the Supabase settings in Netlify.' })
    };
  }
};
