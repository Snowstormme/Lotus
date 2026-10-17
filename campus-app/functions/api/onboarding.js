import { getSupabase } from '../../lib/_supabase.js';
import { readJsonLimited } from '../../lib/_body.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function getBearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+([^\s]+)$/i);
  return match ? match[1] : null;
}

async function getAuthUser(supabase, token) {
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

function validateProfile(body) {
  if (!body || Array.isArray(body) || typeof body !== 'object') return null;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const languages = typeof body.languages === 'string' ? body.languages.trim() : '';
  const universityId = Number(body.university_id);
  const facultyId = Number(body.faculty_id);

  if (name.length < 2 || name.length > 80 || /[\r\n]/.test(name)) return null;
  if (!Number.isInteger(universityId) || universityId < 1) return null;
  if (!Number.isInteger(facultyId) || facultyId < 1) return null;
  if (!Number.isInteger(body.year) || body.year < 1 || body.year > 6) return null;
  if (languages.length > 50 || /[\r\n]/.test(languages)) return null;

  return {
    name,
    university_id: universityId,
    faculty_id: facultyId,
    year: body.year,
    languages
  };
}

export async function onRequestGet(context) {
  try {
    const supabase = getSupabase(context.env);
    const token = getBearerToken(context.request);
    if (token) {
      const user = await getAuthUser(supabase, token);
      if (!user) return json({ error: 'Your session is not valid.' }, 401);

      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return json({ hasProfile: Boolean(data) });
    }

    const [universitiesResult, facultiesResult] = await Promise.all([
      supabase.from('universities').select('id, name, city').order('name'),
      supabase.from('faculties').select('id, university_id, name').order('name')
    ]);
    if (universitiesResult.error) throw universitiesResult.error;
    if (facultiesResult.error) throw facultiesResult.error;

    return json({
      universities: universitiesResult.data || [],
      faculties: facultiesResult.data || []
    });
  } catch (error) {
    console.error('Could not load onboarding data:', error);
    return json({ error: 'Could not load onboarding data.' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const supabase = getSupabase(context.env);
    const user = await getAuthUser(supabase, getBearerToken(context.request));
    if (!user) return json({ error: 'You must be logged in to save your profile.' }, 401);

    const parsed = await readJsonLimited(context.request, 4 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = validateProfile(parsed.value);
    if (!body) return json({ error: 'Please check your profile details.' }, 400);

    const { data: university, error: universityError } = await supabase
      .from('universities')
      .select('id')
      .eq('id', body.university_id)
      .maybeSingle();
    if (universityError) throw universityError;
    if (!university) return json({ error: 'Please choose a valid university.' }, 400);

    const { data: faculty, error: facultyError } = await supabase
      .from('faculties')
      .select('id')
      .eq('id', body.faculty_id)
      .eq('university_id', body.university_id)
      .maybeSingle();
    if (facultyError) throw facultyError;
    if (!faculty) return json({ error: 'Please choose a faculty from that university.' }, 400);

    const profileFields = {
      name: body.name,
      university_id: body.university_id,
      faculty_id: body.faculty_id,
      year: body.year,
      languages: body.languages
    };
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();
    if (existingError) {
      if (existingError.code === 'PGRST116') return json({ error: 'A profile already exists for this account.' }, 400);
      throw existingError;
    }

    if (existing) {
      const { error } = await supabase.from('users').update(profileFields).eq('id', existing.id).eq('auth_user_id', user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('users').insert({
        ...profileFields,
        auth_user_id: user.id,
        is_demo: false
      });
      if (error) {
        if (error.code === '23505') return json({ error: 'A profile already exists for this account.' }, 400);
        throw error;
      }
    }

    return json({ message: 'Your profile is saved' });
  } catch (error) {
    console.error('Could not save onboarding profile:', error);
    return json({ error: 'Could not save your profile.' }, 500);
  }
}
