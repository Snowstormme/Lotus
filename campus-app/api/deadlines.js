const { getSupabase } = require('../lib/_supabase');

module.exports = async function handler(req, res) {
  try {
    const supabase = getSupabase();
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('course_id, users!inner(is_demo)')
      .eq('users.is_demo', true);
    if (enrollmentsError) throw enrollmentsError;

    const courseIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.course_id)));
    if (courseIds.length === 0) return res.status(200).json([]);

    const { data, error } = await supabase
      .from('deadlines')
      .select('title, type, due_at, courses!inner(code)')
      .in('course_id', courseIds)
      .gte('due_at', new Date().toISOString())
      .order('due_at', { ascending: true });
    if (error) throw error;
    return res.status(200).json(data.map((deadline) => ({
      title: deadline.title,
      code: deadline.courses.code,
      type: deadline.type,
      due_at: deadline.due_at
    })));
  } catch (err) {
    console.error('Could not load deadlines:', err);
    return res.status(500).json({ error: 'Could not load deadlines. Check the Supabase settings in Netlify.' });
  }
};
