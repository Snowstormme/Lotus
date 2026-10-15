const { getSupabase } = require('../lib/_supabase');
const { matchStudyPartners } = require('../lib/_matching');

module.exports = async function handler(req, res) {
  const query = req.query || {};
  const rawId = query.user_id;
  const userId = Number(rawId);
  if (!rawId || !Number.isInteger(userId) || userId <= 0) return res.status(400).json({ error: 'A valid demo user id is required.' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  try {
    const supabase = getSupabase();
    const { data: users, error: usersError } = await supabase.from('users').select('id, name, year, is_demo').eq('is_demo', true);
    if (usersError) throw usersError;
    const requestingUser = users.find((user) => user.id === userId);
    if (!requestingUser) return res.status(404).json({ error: 'Demo user not found.' });

    const userIds = users.map((user) => user.id);
    const [enrollmentsResult, slotsResult] = await Promise.all([
      supabase.from('enrollments').select('user_id, course_id, courses!inner(code)').in('user_id', userIds),
      supabase.from('availability_slots').select('user_id, weekday, start_time, end_time').in('user_id', userIds)
    ]);
    if (enrollmentsResult.error) throw enrollmentsResult.error;
    if (slotsResult.error) throw slotsResult.error;
    const enrollments = enrollmentsResult.data.map((enrollment) => ({
      user_id: enrollment.user_id,
      course_id: enrollment.course_id,
      course_code: enrollment.courses.code
    }));
    return res.status(200).json(matchStudyPartners({ requestingUserId: userId, users, enrollments, slots: slotsResult.data }));
  } catch (err) {
    console.error('Could not load study partners:', err);
    return res.status(500).json({ error: 'Could not load study partners. Check the Supabase settings in Netlify.' });
  }
};
