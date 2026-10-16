function isCompleteProfile(user) {
  return Boolean(user && typeof user.name === 'string' && user.name.trim() && Number.isInteger(user.university_id) && user.university_id > 0 && Number.isInteger(user.faculty_id) && user.faculty_id > 0 && Number.isInteger(user.year) && user.year >= 1 && user.year <= 6);
}

function otherUserId(conversation, userId) {
  return conversation.user_a_id === userId ? conversation.user_b_id : conversation.user_a_id;
}

async function areUsersBlocked(supabase, firstId, secondId) {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocker_id, blocked_id')
    .or('and(blocker_id.eq.' + firstId + ',blocked_id.eq.' + secondId + '),and(blocker_id.eq.' + secondId + ',blocked_id.eq.' + firstId + ')');
  if (error) throw error;
  return (data || []).length > 0;
}

async function findConversation(supabase, conversationId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, user_a_id, user_b_id, created_at, last_message_at, hidden_for_a, hidden_for_b')
    .eq('id', conversationId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export { areUsersBlocked, findConversation, isCompleteProfile, otherUserId };
