const { getSupabase } = require('./_supabase');
const { matchStudyPartners } = require('./_matching');

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  const rawId = event.queryStringParameters && event.queryStringParameters.user_id;
  const userId = Number(rawId);
  if (!rawId || !Number.isInteger(userId) || userId <= 0) {
    return json(400, { error: 'A valid demo user id is required.' });
  }

  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed.' });

  try {
    const supabase = getSupabase();
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, year, is_demo')
      .eq('is_demo', true);
    if (usersError) throw usersError;

    const requestingUser = users.find((user) => user.id === userId);
    if (!requestingUser) return json(404, { error: 'Demo user not found.' });

    const userIds = users.map((user) => user.id);
    const [enrollmentsResult, slotsResult] = await Promise.all([
      supabase
        .from('enrollments')
        .select('user_id, course_id, courses!inner(code)')
        .in('user_id', userIds),
      supabase
        .from('availability_slots')
        .select('user_id, weekday, start_time, end_time')
        .in('user_id', userIds)
    ]);
    if (enrollmentsResult.error) throw enrollmentsResult.error;
    if (slotsResult.error) throw slotsResult.error;

    const enrollments = enrollmentsResult.data.map((enrollment) => ({
      user_id: enrollment.user_id,
      course_id: enrollment.course_id,
      course_code: enrollment.courses.code
    }));
    return json(200, matchStudyPartners({
      requestingUserId: userId,
      users,
      enrollments,
      slots: slotsResult.data
    }));
  } catch (err) {
    console.error('Could not load study partners:', err);
    return json(500, { error: 'Could not load study partners. Check the Supabase settings in Netlify.' });
  }
};
