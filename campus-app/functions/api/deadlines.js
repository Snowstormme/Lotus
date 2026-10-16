import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestGet(context) {
  try {
    const supabase = getSupabase(context.env);
    let enrollmentQuery = supabase.from('enrollments').select('course_id, users!inner(is_demo)');
    if (context.request.headers.get('Authorization')) {
      const profile = await requireOwnProfile(context.request, context.env);
      enrollmentQuery = supabase.from('enrollments').select('course_id').eq('user_id', profile.id);
    } else {
      enrollmentQuery = enrollmentQuery.eq('users.is_demo', true);
    }
    const { data: enrollments, error: enrollmentsError } = await enrollmentQuery;
    if (enrollmentsError) throw enrollmentsError;
    const courseIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.course_id)));
    if (courseIds.length === 0) return json([]);
    const { data, error } = await supabase.from('deadlines').select('title, type, due_at, courses!inner(code)').in('course_id', courseIds).gte('due_at', new Date().toISOString()).order('due_at', { ascending: true });
    if (error) throw error;
    return json(data.map((deadline) => ({ id: deadline.id, title: deadline.title, code: deadline.courses.code, type: deadline.type, due_at: deadline.due_at })));
  } catch (err) {
    if (err.status === 401 || err.status === 404) return json({ error: err.publicMessage }, err.status);
    console.error('Could not load deadlines:', err);
    return json({ error: 'Could not load deadlines. Check the Supabase settings in Netlify.' }, 500);
  }
}
