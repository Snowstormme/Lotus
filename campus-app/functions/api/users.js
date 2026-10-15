import { getSupabase } from '../../lib/_supabase.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestGet(context) {
  try {
    const supabase = getSupabase(context.env);
    const { data, error } = await supabase.from('users').select('id, name, year, is_demo').eq('is_demo', true);
    if (error) throw error;
    return json(data);
  } catch (err) {
    console.error('Could not load users:', err);
    return json({ error: 'Could not load users. Check the Supabase settings in Netlify.' }, 500);
  }
}
