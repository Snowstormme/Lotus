import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';
import { getCatalogFacultyIds } from '../../lib/_catalog.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestGet(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const supabase = getSupabase(context.env);
    const facultyIds = await getCatalogFacultyIds(supabase, profile);
    const { data, error } = await supabase
      .from('courses')
      .select('id, code, name, teacher, is_catalog')
      .in('faculty_id', facultyIds)
      .order('code', { ascending: true });
    if (error) throw error;
    return json(data || []);
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not load course catalog:', error);
    return json({ error: 'Could not load the course catalog.' }, 500);
  }
}
