module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabasePublishableKey) {
    console.error('Could not load public config: required public Supabase settings are missing.');
    return res.status(500).json({ error: 'Could not load the public configuration.' });
  }

  return res.status(200).json({ supabaseUrl, supabasePublishableKey });
};
