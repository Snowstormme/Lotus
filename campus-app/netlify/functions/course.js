const { getSupabase } = require('./_supabase');

exports.handler = async (event) => {
  const rawId = event.queryStringParameters && event.queryStringParameters.id;
  const id = Number(rawId);

  if (!rawId || !Number.isInteger(id) || id <= 0) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'A valid course id is required.' })
    };
  }

  try {
    const supabase = getSupabase();
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('code, name, teacher, room, schedule_text, syllabus')
      .eq('id', id)
      .maybeSingle();

    if (courseError) throw courseError;
    if (!course) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Course not found.' })
      };
    }

    const [classesResult, deadlinesResult, filesResult] = await Promise.all([
      supabase
        .from('classes')
        .select('weekday, start_time, end_time, room')
        .eq('course_id', id)
        .order('weekday', { ascending: true })
        .order('start_time', { ascending: true }),
      supabase
        .from('deadlines')
        .select('title, type, due_at')
        .eq('course_id', id)
        .order('due_at', { ascending: true }),
      supabase
        .from('course_files')
        .select('kind, title, url')
        .eq('course_id', id)
        .order('title', { ascending: true })
    ]);

    if (classesResult.error) throw classesResult.error;
    if (deadlinesResult.error) throw deadlinesResult.error;
    if (filesResult.error) throw filesResult.error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course,
        classes: classesResult.data,
        deadlines: deadlinesResult.data,
        files: filesResult.data
      })
    };
  } catch (err) {
    console.error('Could not load course:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Could not load the course. Check the Supabase settings in Netlify.' })
    };
  }
};
