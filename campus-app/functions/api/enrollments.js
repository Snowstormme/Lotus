import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';
import { CURRENT_SEMESTER } from '../../lib/_enrollments.js';
import { getCatalogFacultyIds } from '../../lib/_catalog.js';

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
    const { data, error } = await getSupabase(context.env)
      .from('enrollments')
      .select('course_id')
      .eq('user_id', profile.id)
      .eq('semester', CURRENT_SEMESTER)
      .order('course_id', { ascending: true });
    if (error) throw error;
    return json({ course_ids: Array.from(new Set((data || []).map((row) => row.course_id))) });
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not load enrollments:', error);
    return json({ error: 'Could not load your courses.' }, 500);
  }
}

export async function onRequestPut(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const body = await parseBody(context.request);
    if (!body || Array.isArray(body) || typeof body !== 'object' || !Array.isArray(body.course_ids)) {
      return json({ error: 'Please send a list of course ids.' }, 400);
    }

    const courseIds = Array.from(new Set(body.course_ids));
    if (courseIds.length > 12 || courseIds.some((id) => !Number.isInteger(id) || id < 1)) {
      return json({ error: 'Please choose no more than 12 valid courses.' }, 400);
    }

    const supabase = getSupabase(context.env);
    if (courseIds.length > 0) {
      const facultyIds = await getCatalogFacultyIds(supabase, profile);
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id')
        .in('faculty_id', facultyIds)
        .in('id', courseIds);
      if (coursesError) throw coursesError;
      const validIds = new Set((courses || []).map((course) => course.id));
      if (courseIds.some((id) => !validIds.has(id))) {
        return json({ error: 'Please choose courses from your faculty.' }, 400);
      }
    }

    const { error: deleteError } = await supabase
      .from('enrollments')
      .delete()
      .eq('user_id', profile.id)
      .eq('semester', CURRENT_SEMESTER);
    if (deleteError) throw deleteError;

    if (courseIds.length > 0) {
      const { error: insertError } = await supabase.from('enrollments').insert(
        courseIds.map((course_id) => ({ user_id: profile.id, course_id, semester: CURRENT_SEMESTER }))
      );
      if (insertError) throw insertError;
    }

    return json({ course_ids: courseIds });
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not update enrollments:', error);
    return json({ error: 'Could not save your courses.' }, 500);
  }
}
