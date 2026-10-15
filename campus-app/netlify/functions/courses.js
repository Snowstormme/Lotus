const { getSupabase } = require('./_supabase');

exports.handler = async () => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('courses')
      .select('id, code, name, teacher, room');

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Could not load courses. Check the Supabase settings in Netlify.' })
    };
  }
};
