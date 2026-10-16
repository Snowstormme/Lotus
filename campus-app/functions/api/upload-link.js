import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';

function json(body, status = 200) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }); }

export async function onRequestGet(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env); const id = Number(new URL(context.request.url).searchParams.get('id')); if (!Number.isInteger(id) || id <= 0) return json({ error: 'A valid upload id is required.' }, 400); const supabase = getSupabase(context.env); const upload = await supabase.from('course_uploads').select('id, course_id, storage_path, hidden').eq('id', id).maybeSingle(); if (upload.error) throw upload.error; if (!upload.data || upload.data.hidden) return json({ error: 'Upload not found.' }, 404); const enrollment = await supabase.from('enrollments').select('course_id').eq('user_id', profile.id).eq('course_id', upload.data.course_id).maybeSingle(); if (enrollment.error) throw enrollment.error; if (!enrollment.data) return json({ error: 'Upload not found.' }, 404); const signed = await supabase.storage.from('course-files').createSignedUrl(upload.data.storage_path, 300); if (signed.error) throw signed.error; return json({ url: signed.data.signedUrl });
  } catch (error) { if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status); console.error('Could not create upload link:', error); return json({ error: 'Could not open the upload.' }, 500); }
}
