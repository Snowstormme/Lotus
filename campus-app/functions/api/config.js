function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestGet(context) {
  const supabaseUrl = context.env.SUPABASE_URL;
  const supabasePublishableKey = context.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabasePublishableKey) {
    console.error('Could not load public config: required public Supabase settings are missing.');
    return json({ error: 'Could not load the public configuration.' }, 500);
  }
  return json({ supabaseUrl, supabasePublishableKey });
}
