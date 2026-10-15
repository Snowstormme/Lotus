import { getSupabase } from '../../lib/_supabase.js';
import { matchStudyPartners } from '../../lib/_matching.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestGet(context) {
  const rawId = new URL(context.request.url).searchParams.get('user_id');
  const userId = Number(rawId);
  if (!rawId || !Number.isInteger(userId) || userId <= 0) return json({ error: 'A valid demo user id is required.' }, 400);
  try {
    const supabase = getSupabase(context.env);
    const { data: users, error: usersError } = await supabase.from('users').select('id, name, year, is_demo').eq('is_demo', true);
    if (usersError) throw usersError;
    const requestingUser = users.find((user) => user.id === userId);
    if (!requestingUser) return json({ error: 'Demo user not found.' }, 404);
    const userIds = users.map((user) => user.id);
    const [enrollmentsResult, slotsResult] = await Promise.all([
      supabase.from('enrollments').select('user_id, course_id, courses!inner(code)').in('user_id', userIds),
      supabase.from('availability_slots').select('user_id, weekday, start_time, end_time').in('user_id', userIds)
    ]);
    if (enrollmentsResult.error) throw enrollmentsResult.error;
    if (slotsResult.error) throw slotsResult.error;
    const enrollments = enrollmentsResult.data.map((enrollment) => ({ user_id: enrollment.user_id, course_id: enrollment.course_id, course_code: enrollment.courses.code }));
    return json(matchStudyPartners({ requestingUserId: userId, users, enrollments, slots: slotsResult.data }));
  } catch (err) {
    console.error('Could not load study partners:', err);
    return json({ error: 'Could not load study partners. Check the Supabase settings in Netlify.' }, 500);
  }
}
