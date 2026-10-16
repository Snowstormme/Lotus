import { getSupabase } from '../../lib/_supabase.js';
import { matchStudyPartners } from '../../lib/_matching.js';
import { requireOwnProfile } from '../../lib/_auth.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function hasCompletedProfile(user) {
  return Boolean(user && typeof user.name === 'string' && user.name.trim() && Number.isInteger(user.university_id) && user.university_id > 0 && Number.isInteger(user.faculty_id) && user.faculty_id > 0 && Number.isInteger(user.year) && user.year >= 1 && user.year <= 6);
}

export async function onRequestGet(context) {
  const hasAuth = Boolean(context.request.headers.get('Authorization'));
  const rawId = new URL(context.request.url).searchParams.get('user_id');
  const userId = Number(rawId);
  if (!hasAuth && (!rawId || !Number.isInteger(userId) || userId <= 0)) return json({ error: 'A valid demo user id is required.' }, 400);
  try {
    const supabase = getSupabase(context.env);
    const ownProfile = hasAuth ? await requireOwnProfile(context.request, context.env) : null;
    const { data: allUsers, error: usersError } = await supabase.from('users').select('id, name, university_id, faculty_id, year, is_demo, share_for_partners');
    if (usersError) throw usersError;
    const requestingUserId = ownProfile ? ownProfile.id : userId;
    const users = allUsers.filter(hasCompletedProfile);
    const requestingUser = users.find((user) => user.id === requestingUserId);
    if (!requestingUser) return json({ error: hasAuth ? 'Profile not found.' : 'Demo user not found.' }, 404);
    const userIds = users.map((user) => user.id);
    const [enrollmentsResult, slotsResult] = await Promise.all([
      supabase.from('enrollments').select('user_id, course_id, courses!inner(code)').in('user_id', userIds),
      supabase.from('availability_slots').select('user_id, weekday, start_time, end_time').in('user_id', userIds)
    ]);
    if (enrollmentsResult.error) throw enrollmentsResult.error;
    if (slotsResult.error) throw slotsResult.error;
    const enrollments = enrollmentsResult.data.map((enrollment) => ({ user_id: enrollment.user_id, course_id: enrollment.course_id, course_code: enrollment.courses.code }));
    return json(matchStudyPartners({ requestingUserId, users, enrollments, slots: slotsResult.data }));
  } catch (err) {
    if (err.status === 401 || err.status === 404) return json({ error: err.publicMessage }, err.status);
    console.error('Could not load study partners:', err);
    return json({ error: 'Could not load study partners. Check the Supabase settings in Netlify.' }, 500);
  }
}
