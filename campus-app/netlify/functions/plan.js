const { getSupabase } = require('./_supabase');
const { generatePlan } = require('./_gemini');
const { validatePlan } = require('./_planValidation');

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

function getUserId(event) {
  const rawId = event.queryStringParameters && event.queryStringParameters.user_id;
  const id = Number(rawId);
  return rawId && Number.isInteger(id) && id > 0 ? id : null;
}

async function getSavedPlan(supabase, userId) {
  const { data, error } = await supabase
    .from('study_plans')
    .select('plan_json, source, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getDemoUser(supabase, userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, weekly_free_hours, is_demo')
    .eq('id', userId)
    .eq('is_demo', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function buildPlanInput(supabase, userId, weeklyFreeHours) {
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select('course_id, courses!inner(code, name)')
    .eq('user_id', userId);
  if (enrollmentsError) throw enrollmentsError;

  const courses = enrollments.map((enrollment) => ({
    code: enrollment.courses.code,
    name: enrollment.courses.name
  }));
  const courseIds = enrollments.map((enrollment) => enrollment.course_id);
  const now = new Date();
  const nextTwentyOneDays = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
  const deadlineQuery = supabase
    .from('deadlines')
    .select('title, type, due_at, courses!inner(code)')
    .gte('due_at', now.toISOString())
    .lte('due_at', nextTwentyOneDays.toISOString())
    .order('due_at', { ascending: true });
  const deadlinesPromise = courseIds.length > 0
    ? deadlineQuery.in('course_id', courseIds)
    : Promise.resolve({ data: [], error: null });

  const [deadlinesResult, slotsResult] = await Promise.all([
    deadlinesPromise,
    supabase
      .from('availability_slots')
      .select('weekday, start_time, end_time')
      .eq('user_id', userId)
      .order('weekday', { ascending: true })
      .order('start_time', { ascending: true })
  ]);
  if (deadlinesResult.error) throw deadlinesResult.error;
  if (slotsResult.error) throw slotsResult.error;

  return {
    courses,
    deadlines: deadlinesResult.data.map((deadline) => ({
      course_code: deadline.courses.code,
      title: deadline.title,
      type: deadline.type,
      due_at: deadline.due_at
    })),
    weekly_free_hours: weeklyFreeHours,
    availability: slotsResult.data.map((slot) => ({
      weekday: slot.weekday,
      start_time: slot.start_time,
      end_time: slot.end_time
    }))
  };
}

function buildPrompt(input) {
  return [
    'Create a practical study plan from this data:',
    JSON.stringify(input),
    '',
    'Return only valid JSON, with no text before or after and no markdown.',
    'Use exactly this shape: { "weeks": [ { "week_start": "YYYY-MM-DD", "days": [ { "day": "Mon", "tasks": [ { "course": "string", "task": "string", "minutes": number } ] } ] } ], "summary": "string under 40 words" }.',
    'Do not invent courses or deadlines that are not in the input.'
  ].join('\n');
}

function parseAndValidatePlan(text, weeklyFreeHours) {
  let plan;
  try {
    plan = JSON.parse(text);
  } catch (err) {
    throw new Error('Gemini returned invalid JSON');
  }
  if (!validatePlan(plan, weeklyFreeHours)) throw new Error('Gemini returned an invalid plan shape');
  return plan;
}

function fallbackResponse(savedPlan) {
  if (!savedPlan) return null;
  return {
    plan_json: savedPlan.plan_json,
    source: 'fallback',
    created_at: savedPlan.created_at,
    note: 'Showing a saved plan because the AI is unavailable.'
  };
}

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return json(400, { error: 'A valid demo user id is required.' });
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  try {
    const supabase = getSupabase();
    const user = await getDemoUser(supabase, userId);
    if (!user) return json(404, { error: 'Demo user not found.' });

    const savedPlan = await getSavedPlan(supabase, userId);
    if (event.httpMethod === 'GET') {
      if (!savedPlan) return json(404, { error: 'No saved study plan found.' });
      return json(200, savedPlan);
    }

    if (savedPlan && Date.now() - new Date(savedPlan.created_at).getTime() < 10000) {
      return json(429, { error: 'Please wait a few seconds before generating again.' });
    }

    try {
      const input = await buildPlanInput(supabase, userId, user.weekly_free_hours);
      const plan = parseAndValidatePlan(await generatePlan(buildPrompt(input)), user.weekly_free_hours);
      const { data: saved, error: saveError } = await supabase
        .from('study_plans')
        .insert({ user_id: userId, plan_json: plan, source: 'ai' })
        .select('plan_json, source, created_at')
        .single();
      if (saveError) throw saveError;
      return json(200, saved);
    } catch (err) {
      console.error('Could not generate AI study plan:', err);
      const fallback = fallbackResponse(savedPlan);
      if (fallback) return json(200, fallback);
      return json(503, { error: 'The AI study plan is unavailable and no saved plan exists.' });
    }
  } catch (err) {
    console.error('Could not load study plan:', err);
    return json(500, { error: 'Could not load the study plan. Check the Supabase settings in Netlify.' });
  }
};
