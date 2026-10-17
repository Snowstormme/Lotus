import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';
import { findConversation } from '../../lib/_messaging.js';
import { readJsonLimited } from '../../lib/_body.js';

const REPORT_REASONS = new Set(['spam', 'harassment', 'scam', 'other']);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestPost(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const parsed = await readJsonLimited(context.request, 4 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.value;
    const conversationId = body && body.conversation_id;
    const reason = body && body.reason;
    if (!Number.isInteger(conversationId) || conversationId < 1 || typeof reason !== 'string' || !REPORT_REASONS.has(reason)) return json({ error: 'Please choose a valid report reason.' }, 400);
    const supabase = getSupabase(context.env);
    const conversation = await findConversation(supabase, conversationId);
    if (!conversation || (conversation.user_a_id !== profile.id && conversation.user_b_id !== profile.id)) return json({ error: 'Conversation not found.' }, 404);
    const { data: existing, error: existingError } = await supabase.from('conversation_reports').select('id').eq('conversation_id', conversationId).eq('reporter_id', profile.id).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return json({ message: 'Thanks, this conversation is already reported.' });
    const { error } = await supabase.from('conversation_reports').insert({ conversation_id: conversationId, reporter_id: profile.id, reason });
    if (error) throw error;
    return json({ message: 'Thanks, this conversation was reported.' });
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not report conversation:', error);
    return json({ error: 'Could not report the conversation.' }, 500);
  }
}
