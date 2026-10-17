import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';
import { readJsonLimited } from '../../lib/_body.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestPost(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const parsed = await readJsonLimited(context.request, 4 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.value;
    let userId = body && body.user_id;
    const action = body && body.action;
    if (!Number.isInteger(userId) || userId < 1 || userId === profile.id || !['block', 'unblock'].includes(action)) return json({ error: 'Please choose a valid student and action.' }, 400);

    const supabase = getSupabase(context.env);
    const { data: target, error: targetError } = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
    if (targetError) throw targetError;
    if (!target) return json({ error: 'Student not found.' }, 404);
    if (action === 'block') {
      const { error } = await supabase.from('user_blocks').upsert({ blocker_id: profile.id, blocked_id: userId });
      if (error) throw error;
      return json({ message: 'Student blocked.' });
    }
    const { error } = await supabase.from('user_blocks').delete().eq('blocker_id', profile.id).eq('blocked_id', userId);
    if (error) throw error;
    return json({ message: 'Student unblocked.' });
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not update user block:', error);
    return json({ error: 'Could not update the block.' }, 500);
  }
}
