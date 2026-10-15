const { getSupabase } = require('../lib/_supabase');

module.exports = async function handler(req, res) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('courses')
      .select('id, code, name, teacher, room');
    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error('Could not load courses:', err);
    return res.status(500).json({ error: 'Could not load courses. Check the Supabase settings in Netlify.' });
  }
};
