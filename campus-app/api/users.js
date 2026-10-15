const { getSupabase } = require('../lib/_supabase');

module.exports = async function handler(req, res) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('id, name, year, is_demo')
      .eq('is_demo', true);
    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error('Could not load users:', err);
    return res.status(500).json({ error: 'Could not load users. Check the Supabase settings in Netlify.' });
  }
};
