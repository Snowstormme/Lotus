import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function parseBody(request) {
  try {
    const body = await request.json();
    if (typeof body === 'string') return JSON.parse(body);
    return body;
  } catch (error) {
    return null;
  }
}

export async function onRequestPost(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const body = await parseBody(context.request);
    const userId = body && body.user_id;
    const action = body && body.action;
    if (!Number.isInteger(userId) || userId < 1 || userId === profile.id || !['block', 'unblock'].includes(action)) return json({ error: 'Please choose a valid student and action.' }, 400);

    const supabase = getSupabase(context.env);
    const { data: target, error: targetError } = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
    if (targetError) throw targetError;
    if (!target) return json({ error: 'Student not found.' }, 404);
    const userA = Math.min(profile.id, userId);
    const userB = Math.max(profile.id, userId);
    if (action === 'block') {
      const { error } = await supabase.from('user_blocks').upsert({ blocker_id: profile.id, blocked_id: userId });
      if (error) throw error;
      const { error: hideError } = await supabase.from('conversations').update({ hidden_for_a: true, hidden_for_b: true }).eq('user_a_id', userA).eq('user_b_id', userB);
      if (hideError) throw hideError;
      return json({ message: 'Student blocked.' });
    }
    const { error } = await supabase.from('user_blocks').delete().eq('blocker_id', profile.id).eq('blocked_id', userId);
    if (error) throw error;
    const { error: showError } = await supabase.from('conversations').update({ hidden_for_a: false, hidden_for_b: false }).eq('user_a_id', userA).eq('user_b_id', userB);
    if (showError) throw showError;
    return json({ message: 'Student unblocked.' });
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not update user block:', error);
    return json({ error: 'Could not update the block.' }, 500);
  }
}
