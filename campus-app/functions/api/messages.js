import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';
import { areUsersBlocked, findConversation, otherUserId } from '../../lib/_messaging.js';
import { readJsonLimited } from '../../lib/_body.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function getConversationId(request) {
  const raw = new URL(request.url).searchParams.get('conversation_id');
  const id = Number(raw);
  return raw && Number.isInteger(id) && id > 0 ? id : null;
}

async function getMemberConversation(supabase, conversationId, profileId) {
  if (!conversationId) return null;
  const conversation = await findConversation(supabase, conversationId);
  if (!conversation || (conversation.user_a_id !== profileId && conversation.user_b_id !== profileId)) return null;
  return conversation;
}

async function getRecipient(supabase, conversation, profileId) {
  const recipientId = otherUserId(conversation, profileId);
  const { data, error } = await supabase.from('users').select('id, allow_messages').eq('id', recipientId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function onRequestGet(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const supabase = getSupabase(context.env);
    const conversation = await getMemberConversation(supabase, getConversationId(context.request), profile.id);
    if (!conversation) return json({ error: 'Conversation not found.' }, 404);

    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, body, deleted, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(50);
    if (error) throw error;

    const now = new Date().toISOString();
    const { error: readError } = await supabase.from('conversation_reads').upsert({ conversation_id: conversation.id, user_id: profile.id, last_read_at: now }, { onConflict: 'conversation_id,user_id' });
    if (readError) throw readError;
    return json((data || []).map(function (message) {
      return { id: message.id, sender_is_me: message.sender_id === profile.id, body: message.deleted ? null : message.body, created_at: message.created_at };
    }));
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not load messages:', error);
    return json({ error: 'Could not load the conversation.' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const parsed = await readJsonLimited(context.request, 4 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.value;
    const messageBody = body && typeof body.body === 'string' ? body.body.trim() : '';
    const conversationId = body && body.conversation_id;
    if (!Number.isInteger(conversationId) || conversationId < 1 || !messageBody || messageBody.length > 1000) return json({ error: 'Message text must be between 1 and 1000 characters.' }, 400);

    const supabase = getSupabase(context.env);
    const conversation = await getMemberConversation(supabase, conversationId, profile.id);
    if (!conversation) return json({ error: 'Conversation not found.' }, 404);
    const recipient = await getRecipient(supabase, conversation, profile.id);
    if (!recipient || recipient.allow_messages === false || await areUsersBlocked(supabase, profile.id, recipient.id)) return json({ error: "You can't message this student." }, 403);

    const cutoff = new Date(Date.now() - 60 * 1000).toISOString();
    const { count, error: countError } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', profile.id).gte('created_at', cutoff);
    if (countError) throw countError;
    if ((count || 0) >= 20) return json({ error: 'Please wait before sending more messages.' }, 429);

    const { data: created, error: createError } = await supabase.from('messages').insert({ conversation_id: conversation.id, sender_id: profile.id, body: messageBody }).select('id').single();
    if (createError) throw createError;
    const { error: updateError } = await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversation.id);
    if (updateError) throw updateError;
    return json({ message_id: created.id });
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not send message:', error);
    return json({ error: 'Could not send the message.' }, 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const parsed = await readJsonLimited(context.request, 4 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.value;
    const messageId = body && body.message_id;
    if (!Number.isInteger(messageId) || messageId < 1) return json({ error: 'A valid message id is required.' }, 400);
    const supabase = getSupabase(context.env);
    const { data: message, error: messageError } = await supabase.from('messages').select('id, sender_id').eq('id', messageId).maybeSingle();
    if (messageError) throw messageError;
    if (!message || message.sender_id !== profile.id) return json({ error: 'Message not found.' }, 404);
    const { error } = await supabase.from('messages').update({ deleted: true, body: null }).eq('id', messageId).eq('sender_id', profile.id);
    if (error) throw error;
    return json({ message: 'Message deleted.' });
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not delete message:', error);
    return json({ error: 'Could not delete the message.' }, 500);
  }
}
