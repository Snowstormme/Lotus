import { createClient } from '@supabase/supabase-js';

// Server-only client. Uses the service role key, which bypasses Row Level Security.
// Never import this file from anything in public/.
function getSupabase(env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment settings');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export { getSupabase };
