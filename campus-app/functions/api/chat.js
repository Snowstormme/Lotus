import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';
import { generateChat } from '../../lib/_gemini.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function parseBody(request) {
  try { return await request.json(); } catch (error) { return null; }
}

function validateBody(body) {
  if (!body || Array.isArray(body) || typeof body !== 'object') return null;
  if (typeof body.message !== 'string' || body.message.trim().length < 1 || body.message.trim().length > 2000) return null;
  if (!['explain', 'summarize', 'quiz', 'plan'].includes(body.mode)) return null;
  if (body.course_id !== null && body.course_id !== undefined && (!Number.isInteger(body.course_id) || body.course_id < 1)) return null;
  return { message: body.message.trim(), mode: body.mode, courseId: body.course_id == null ? null : body.course_id };
}

const modeInstructions = {
  explain: 'Explain the topic clearly with a useful example when appropriate.',
  summarize: 'Summarize the student message into concise study notes.',
  quiz: 'Create practice questions based only on the student message and course context.',
  plan: 'Suggest practical study steps based only on the student message, course context, and supplied deadlines.'
};

const DEFAULT_WORKERS_AI_MODEL = '@cf/meta/llama-3.1-8b-instruct';

async function generateWorkersAi(env, prompt) {
  const model = env.WORKERS_AI_MODEL || DEFAULT_WORKERS_AI_MODEL;
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Workers AI request timed out')), 15000);
  });
  const request = Promise.resolve(env.AI.run(model, { prompt })).then((result) => {
    if (!result || typeof result.response !== 'string' || !result.response.trim()) {
      throw new Error('Workers AI returned no text');
    }
    return result.response;
  });
  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getCourses(supabase, userId) {
  const { data, error } = await supabase.from('enrollments').select('course_id, courses!inner(code, name)').eq('user_id', userId);
  if (error) throw error;
  return data.map((enrollment) => ({ id: enrollment.course_id, code: enrollment.courses.code, name: enrollment.courses.name }));
}

async function getPlanDeadlines(supabase, courseIds) {
  if (!courseIds.length) return [];
  const { data, error } = await supabase.from('deadlines').select('title, due_at').in('course_id', courseIds).gte('due_at', new Date().toISOString()).order('due_at', { ascending: true });
  if (error) throw error;
  return data.map((deadline) => ({ title: deadline.title, due_at: deadline.due_at }));
}

function buildPrompt(input) {
  return [
    'System instruction: You are a study assistant for university students in Azerbaijan. Explain clearly, admit uncertainty, do not invent university rules, grades, or deadlines, and do not claim to be a university system. If a question is unrelated to studying, politely steer back to study topics.',
    'Mode instruction: ' + modeInstructions[input.mode],
    'Course context: ' + (input.course ? JSON.stringify({ code: input.course.code, name: input.course.name }) : 'General study'),
    input.deadlines ? 'Upcoming deadlines: ' + JSON.stringify(input.deadlines) : '',
    'Student message: ' + input.message
  ].filter(Boolean).join('\n');
}

export async function onRequestPost(context) {
  let profile;
  try {
    profile = await requireOwnProfile(context.request, context.env);
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not verify chat user:', error);
    return json({ error: 'Could not verify your session.' }, 500);
  }
  if (context.env.AI_CHAT_ENABLED !== 'true') return json({ error: 'The study assistant is paused right now. Please try again later.' }, 503);

  const body = validateBody(await parseBody(context.request));
  if (!body) return json({ error: 'Message, mode, or course selection is invalid.' }, 400);
  try {
    const supabase = getSupabase(context.env);
    const courses = await getCourses(supabase, profile.id);
    const course = body.courseId === null ? null : courses.find((item) => item.id === body.courseId);
    if (body.courseId !== null && !course) return json({ error: 'That course is not available in your profile.' }, 400);
    const deadlines = body.mode === 'plan' ? await getPlanDeadlines(supabase, courses.map((item) => item.id)) : null;
    const prompt = buildPrompt({ message: body.message, mode: body.mode, course, deadlines });
    let reply;
    if (context.env.AI) {
      reply = await generateWorkersAi(context.env, prompt);
    } else if (context.env.GEMINI_API_KEY) {
      reply = await generateChat(context.env, prompt);
    } else {
      return json({ reply: 'Demo mode: the AI service is not connected yet.', mode: body.mode, course_code: course ? course.code : null, demo: true });
    }
    reply = reply.trim();
    return json({ reply, mode: body.mode, course_code: course ? course.code : null });
  } catch (error) {
    console.error('Could not generate AI chat reply:', error);
    return json({ error: 'The study assistant could not answer right now. Please try again.' }, 503);
  }
}
