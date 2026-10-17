import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';
import { CURRENT_SEMESTER } from '../../lib/_enrollments.js';
import { readJsonLimited } from '../../lib/_body.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function getUserId(context) {
  const rawId = new URL(context.request.url).searchParams.get('id');
  const id = Number(rawId);
  return rawId && Number.isInteger(id) && id > 0 ? id : null;
}

function validateBody(body) {
  if (!body || Array.isArray(body) || typeof body !== 'object') return null;
  const fields = ['name', 'university_id', 'faculty_id', 'year', 'languages', 'weekly_free_hours', 'share_for_partners', 'allow_messages'];
  if (!fields.some((field) => Object.prototype.hasOwnProperty.call(body, field))) return null;
  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 80 || /[\r\n]/.test(body.name)) return null;
    body.name = body.name.trim();
  }
  const hasUniversity = Object.prototype.hasOwnProperty.call(body, 'university_id');
  const hasFaculty = Object.prototype.hasOwnProperty.call(body, 'faculty_id');
  if (hasUniversity !== hasFaculty) return null;
  if (hasUniversity && (!Number.isInteger(body.university_id) || body.university_id < 1 || !Number.isInteger(body.faculty_id) || body.faculty_id < 1)) return null;
  if (Object.prototype.hasOwnProperty.call(body, 'year') && (!Number.isInteger(body.year) || body.year < 1 || body.year > 6)) return null;
  if (Object.prototype.hasOwnProperty.call(body, 'languages') && (typeof body.languages !== 'string' || body.languages.length > 50 || /[\r\n]/.test(body.languages))) return null;
  if (Object.prototype.hasOwnProperty.call(body, 'weekly_free_hours') && (!Number.isInteger(body.weekly_free_hours) || body.weekly_free_hours < 0 || body.weekly_free_hours > 60)) return null;
  if (Object.prototype.hasOwnProperty.call(body, 'share_for_partners') && typeof body.share_for_partners !== 'boolean') return null;
  if (Object.prototype.hasOwnProperty.call(body, 'allow_messages') && typeof body.allow_messages !== 'boolean') return null;
  return body;
}

async function getDemoUser(supabase, id) {
  const { data, error } = await supabase.from('users').select('id, name, year, languages, weekly_free_hours, university:universities(name), faculty:faculties(name)').eq('id', id).eq('is_demo', true).maybeSingle();
  if (error) throw error;
  return data;
}

export async function onRequestGet(context) {
  if (context.request.headers.get('Authorization')) {
    try {
      const user = await requireOwnProfile(context.request, context.env);
      return json({ name: user.name, year: user.year, languages: user.languages, weekly_free_hours: user.weekly_free_hours, university_id: user.university_id, faculty_id: user.faculty_id, university: user.university ? user.university.name : null, faculty: user.faculty ? user.faculty.name : null, share_for_partners: user.share_for_partners === true, allow_messages: user.allow_messages !== false });
    } catch (err) {
      if (err.status === 401 || err.status === 404) return json({ error: err.publicMessage }, err.status);
      console.error('Could not load profile:', err);
      return json({ error: 'Could not load the profile.' }, 500);
    }
  }
  const id = getUserId(context);
  if (!id) return json({ error: 'A valid user id is required.' }, 400);
  try {
    const user = await getDemoUser(getSupabase(context.env), id);
    if (!user) return json({ error: 'Demo user not found.' }, 404);
    return json({ name: user.name, year: user.year, languages: user.languages, weekly_free_hours: user.weekly_free_hours, university: user.university ? user.university.name : null, faculty: user.faculty ? user.faculty.name : null });
  } catch (err) {
    console.error('Could not load profile:', err);
    return json({ error: 'Could not load the profile. Check the Supabase settings in Netlify.' }, 500);
  }
}

export async function onRequestPut(context) {
  const hasAuth = Boolean(context.request.headers.get('Authorization'));
  if (!hasAuth) return json({ error: 'Login is required.' }, 401);
  const parsed = await readJsonLimited(context.request, 4 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = validateBody(parsed.value);
  if (!body) return json({ error: 'Profile fields are invalid.' }, 400);
  try {
    const supabase = getSupabase(context.env);
    const user = await requireOwnProfile(context.request, context.env);
    const updateFields = {};
    if (Object.prototype.hasOwnProperty.call(body, 'name')) updateFields.name = body.name;
    if (Object.prototype.hasOwnProperty.call(body, 'university_id')) updateFields.university_id = body.university_id;
    if (Object.prototype.hasOwnProperty.call(body, 'faculty_id')) updateFields.faculty_id = body.faculty_id;
    if (Object.prototype.hasOwnProperty.call(body, 'year')) updateFields.year = body.year;
    if (Object.prototype.hasOwnProperty.call(body, 'languages')) updateFields.languages = body.languages;
    if (Object.prototype.hasOwnProperty.call(body, 'weekly_free_hours')) updateFields.weekly_free_hours = body.weekly_free_hours;
    if (Object.prototype.hasOwnProperty.call(body, 'share_for_partners')) updateFields.share_for_partners = body.share_for_partners;
    if (Object.prototype.hasOwnProperty.call(body, 'allow_messages')) updateFields.allow_messages = body.allow_messages;
    let facultyChanged = false;
    if (Object.prototype.hasOwnProperty.call(body, 'university_id')) {
      const { data: university, error: universityError } = await supabase.from('universities').select('id').eq('id', body.university_id).maybeSingle();
      if (universityError) throw universityError;
      if (!university) return json({ error: 'University is not valid.' }, 400);
      const { data: faculty, error: facultyError } = await supabase.from('faculties').select('id').eq('id', body.faculty_id).eq('university_id', body.university_id).maybeSingle();
      if (facultyError) throw facultyError;
      if (!faculty) return json({ error: 'Faculty is not valid for this university.' }, 400);
      facultyChanged = user.faculty_id !== body.faculty_id;
    }
    const update = supabase.from('users').update(updateFields).eq('id', user.id);
    const { error } = await update;
    if (error) throw error;
    if (facultyChanged) {
      const { error: enrollmentError } = await supabase.from('enrollments').delete().eq('user_id', user.id).eq('semester', CURRENT_SEMESTER);
      if (enrollmentError) throw enrollmentError;
    }
    const { data: updatedUser, error: updatedUserError } = await supabase
      .from('users')
      .select('name, university_id, faculty_id, year, languages, weekly_free_hours, share_for_partners, allow_messages, university:universities(name), faculty:faculties(name)')
      .eq('id', user.id)
      .maybeSingle();
    if (updatedUserError) throw updatedUserError;
    return json({ name: updatedUser.name, year: updatedUser.year, languages: updatedUser.languages, weekly_free_hours: updatedUser.weekly_free_hours, university_id: updatedUser.university_id, faculty_id: updatedUser.faculty_id, university: updatedUser.university ? updatedUser.university.name : null, faculty: updatedUser.faculty ? updatedUser.faculty.name : null, share_for_partners: updatedUser.share_for_partners === true, allow_messages: updatedUser.allow_messages !== false, faculty_changed: facultyChanged });
  } catch (err) {
    if (err.status === 401 || err.status === 404) return json({ error: err.publicMessage }, err.status);
    console.error('Could not update profile:', err);
    return json({ error: 'Could not update the profile.' }, 500);
  }
}
