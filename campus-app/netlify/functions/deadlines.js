const { getSupabase } = require('./_supabase');

exports.handler = async () => {
  try {
    const supabase = getSupabase();
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('course_id, users!inner(is_demo)')
      .eq('users.is_demo', true);

    if (enrollmentsError) throw enrollmentsError;

    const courseIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.course_id)));
    if (courseIds.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([])
      };
    }

    const { data, error } = await supabase
      .from('deadlines')
      .select('title, type, due_at, courses!inner(code)')
      .in('course_id', courseIds)
      .gte('due_at', new Date().toISOString())
      .order('due_at', { ascending: true });

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.map((deadline) => ({
        title: deadline.title,
        code: deadline.courses.code,
        type: deadline.type,
        due_at: deadline.due_at
      })))
    };
  } catch (err) {
    console.error('Could not load deadlines:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Could not load deadlines. Check the Supabase settings in Netlify.' })
    };
  }
};
