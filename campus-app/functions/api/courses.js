import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestGet(context) {
  try {
    if (!context.request.headers.get('Authorization')) return json([]);
    const supabase = getSupabase(context.env);
    let query = supabase.from('courses').select('id, code, name, teacher, room');
    const profile = await requireOwnProfile(context.request, context.env);
    const { data: enrollments, error: enrollmentsError } = await supabase.from('enrollments').select('course_id').eq('user_id', profile.id);
    if (enrollmentsError) throw enrollmentsError;
    const courseIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.course_id)));
    if (courseIds.length === 0) return json([]);
    query = query.in('id', courseIds);
    const { data, error } = await query;
    if (error) throw error;
    return json(data);
  } catch (err) {
    if (err.status === 401 || err.status === 404) return json({ error: err.publicMessage }, err.status);
    console.error('Could not load courses:', err);
    return json({ error: 'Could not load courses. Check the Supabase settings in Netlify.' }, 500);
  }
}
