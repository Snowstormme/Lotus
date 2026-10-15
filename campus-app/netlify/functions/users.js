const { getSupabase } = require('./_supabase');

exports.handler = async () => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('id, name, year, is_demo')
      .eq('is_demo', true);

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error('Could not load users:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Could not load users. Check the Supabase settings in Netlify.' })
    };
  }
};
