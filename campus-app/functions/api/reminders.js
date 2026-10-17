import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_MS = 48 * 60 * 60 * 1000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function daysLeft(value, now) {
  return Math.ceil((Date.parse(value) - now) / DAY_MS);
}

function sortReminders(first, second) {
  if (first.is_overdue !== second.is_overdue) return first.is_overdue ? -1 : 1;
  return Date.parse(first.due_at) - Date.parse(second.due_at);
}

export async function onRequestGet(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const supabase = getSupabase(context.env);
    const now = Date.now();
    const windowEnd = new Date(now + WINDOW_MS).toISOString();
    const nowIso = new Date(now).toISOString();

    const { data: enrollments, error: enrollmentsError } = await supabase.from('enrollments').select('course_id').eq('user_id', profile.id);
    if (enrollmentsError) throw enrollmentsError;

    const courseIds = Array.from(new Set((enrollments || []).map((enrollment) => enrollment.course_id)));
    let deadlines = [];
    if (courseIds.length > 0) {
      const { data, error } = await supabase.from('deadlines').select('id, title, due_at, courses!inner(code)').in('course_id', courseIds).gte('due_at', nowIso).lte('due_at', windowEnd);
      if (error) throw error;
      deadlines = data || [];
    }

    const deadlineReminders = deadlines.map((deadline) => ({
      id: deadline.id,
      source: 'deadline',
      title: deadline.title,
      course_code: deadline.courses.code,
      due_at: deadline.due_at,
      days_left: daysLeft(deadline.due_at, now),
      is_overdue: false
    }));
    return json(deadlineReminders.sort(sortReminders));
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not load reminders:', error);
    return json({ error: 'Could not load reminders.' }, 500);
  }
}
