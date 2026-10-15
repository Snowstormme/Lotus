import { getSupabase } from '../../lib/_supabase.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestGet(context) {
  const id = Number(new URL(context.request.url).searchParams.get('id'));
  const rawId = new URL(context.request.url).searchParams.get('id');
  if (!rawId || !Number.isInteger(id) || id <= 0) return json({ error: 'A valid course id is required.' }, 400);
  try {
    const supabase = getSupabase(context.env);
    const { data: course, error: courseError } = await supabase.from('courses').select('code, name, teacher, room, schedule_text, syllabus').eq('id', id).maybeSingle();
    if (courseError) throw courseError;
    if (!course) return json({ error: 'Course not found.' }, 404);
    const [classesResult, deadlinesResult, filesResult] = await Promise.all([
      supabase.from('classes').select('weekday, start_time, end_time, room').eq('course_id', id).order('weekday', { ascending: true }).order('start_time', { ascending: true }),
      supabase.from('deadlines').select('title, type, due_at').eq('course_id', id).order('due_at', { ascending: true }),
      supabase.from('course_files').select('kind, title, url').eq('course_id', id).order('title', { ascending: true })
    ]);
    if (classesResult.error) throw classesResult.error;
    if (deadlinesResult.error) throw deadlinesResult.error;
    if (filesResult.error) throw filesResult.error;
    return json({ course, classes: classesResult.data, deadlines: deadlinesResult.data, files: filesResult.data });
  } catch (err) {
    console.error('Could not load course:', err);
    return json({ error: 'Could not load the course. Check the Supabase settings in Netlify.' }, 500);
  }
}
