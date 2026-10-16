import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';
import { areUsersBlocked, isCompleteProfile, otherUserId } from '../../lib/_messaging.js';
import { readContactToken } from '../../lib/_contact.js';

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

export async function onRequestGet(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const supabase = getSupabase(context.env);
    const { data: conversations, error: conversationError } = await supabase
      .from('conversations')
      .select('id, user_a_id, user_b_id, created_at, last_message_at')
      .or('user_a_id.eq.' + profile.id + ',user_b_id.eq.' + profile.id);
    if (conversationError) throw conversationError;

    const conversationRows = conversations || [];
    if (conversationRows.length === 0) return json([]);
    const { data: blocks, error: blocksError } = await supabase
      .from('user_blocks')
      .select('blocker_id, blocked_id')
      .or('blocker_id.eq.' + profile.id + ',blocked_id.eq.' + profile.id);
    if (blocksError) throw blocksError;
    const blockedPairs = new Set((blocks || []).map(function (block) {
      return block.blocker_id + ':' + block.blocked_id;
    }));
    const visible = conversationRows.filter(function (conversation) {
      const otherId = otherUserId(conversation, profile.id);
      const isBlocked = blockedPairs.has(profile.id + ':' + otherId) || blockedPairs.has(otherId + ':' + profile.id);
      return !isBlocked;
    });
    if (visible.length === 0) return json([]);

    const otherIds = Array.from(new Set(visible.map((conversation) => otherUserId(conversation, profile.id))));
    const conversationIds = visible.map((conversation) => conversation.id);
    const [usersResult, messagesResult, readsResult] = await Promise.all([
      supabase.from('users').select('id, name, year').in('id', otherIds),
      supabase.from('messages').select('conversation_id, sender_id, body, created_at').in('conversation_id', conversationIds).order('created_at', { ascending: false }),
      supabase.from('conversation_reads').select('conversation_id, last_read_at').eq('user_id', profile.id).in('conversation_id', conversationIds)
    ]);
    if (usersResult.error) throw usersResult.error;
    if (messagesResult.error) throw messagesResult.error;
    if (readsResult.error) throw readsResult.error;

    const usersById = new Map((usersResult.data || []).map((user) => [user.id, user]));
    const messagesByConversation = new Map();
    (messagesResult.data || []).forEach(function (message) {
      if (!messagesByConversation.has(message.conversation_id)) messagesByConversation.set(message.conversation_id, []);
      messagesByConversation.get(message.conversation_id).push(message);
    });
    const readsByConversation = new Map((readsResult.data || []).map((read) => [read.conversation_id, read.last_read_at]));
    const result = visible.map(function (conversation) {
      const other = usersById.get(otherUserId(conversation, profile.id)) || {};
      const messages = messagesByConversation.get(conversation.id) || [];
      const latest = messages[0];
      const lastReadAt = readsByConversation.get(conversation.id);
      const unread = messages.some(function (message) {
        return message.sender_id !== profile.id && (!lastReadAt || new Date(message.created_at).getTime() > new Date(lastReadAt).getTime());
      });
      let preview = 'No messages yet.';
      if (latest) preview = latest.deleted || latest.body === null ? 'Message deleted' : String(latest.body).slice(0, 80);
      return {
        id: conversation.id,
        other_person_name: other.name || 'Student',
        other_person_year: other.year,
        last_message_preview: preview,
        last_message_at: conversation.last_message_at,
        unread
      };
    });
    result.sort(function (first, second) {
      return new Date(second.last_message_at || 0).getTime() - new Date(first.last_message_at || 0).getTime();
    });
    return json(result);
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not load conversations:', error);
    return json({ error: 'Could not load conversations.' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const body = await parseBody(context.request);
    const contactToken = body && body.contact_token;
    const recipientId = await readContactToken(contactToken, context.env);
    if (!recipientId) return json({ error: 'This contact link has expired. Refresh the page and try again.' }, 400);

    const supabase = getSupabase(context.env);
    const { data: recipient, error: recipientError } = await supabase.from('users').select('id, name, university_id, faculty_id, year, allow_messages').eq('id', recipientId).maybeSingle();
    if (recipientError) throw recipientError;
    if (recipient && recipient.id === profile.id) return json({ error: "You can't message this student." }, 403);
    if (!isCompleteProfile(recipient) || recipient.allow_messages === false || await areUsersBlocked(supabase, profile.id, recipient.id)) return json({ error: "You can't message this student." }, 403);

    const userA = Math.min(profile.id, recipient.id);
    const userB = Math.max(profile.id, recipient.id);
    const { data: existing, error: existingError } = await supabase.from('conversations').select('id').eq('user_a_id', userA).eq('user_b_id', userB).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return json({ conversation_id: existing.id });

    const { data: created, error: createError } = await supabase.from('conversations').insert({ user_a_id: userA, user_b_id: userB }).select('id').single();
    if (createError) throw createError;
    return json({ conversation_id: created.id });
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not create conversation:', error);
    return json({ error: 'Could not start the conversation.' }, 500);
  }
}
