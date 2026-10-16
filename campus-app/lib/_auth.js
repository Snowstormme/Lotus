import { getSupabase } from './_supabase.js';

class AuthRequirementError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.publicMessage = message;
  }
}

function getBearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+([^\s]+)$/i);
  return match ? match[1] : null;
}

async function getVerifiedUser(supabase, token) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function findProfile(supabase, authUserId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, university_id, faculty_id, year, languages, weekly_free_hours, is_demo, share_for_partners, university:universities(name), faculty:faculties(name)')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getCurrentUser(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;
  const supabase = getSupabase(env);
  const authUser = await getVerifiedUser(supabase, token);
  if (!authUser) return null;
  const profile = await findProfile(supabase, authUser.id);
  if (!profile) return null;
  return { authUserId: authUser.id, profile };
}

async function requireOwnProfile(request, env) {
  const token = getBearerToken(request);
  if (!token) throw new AuthRequirementError(401, 'You must be logged in.');
  const supabase = getSupabase(env);
  const authUser = await getVerifiedUser(supabase, token);
  if (!authUser) throw new AuthRequirementError(401, 'Your session is not valid.');
  const profile = await findProfile(supabase, authUser.id);
  if (!profile) throw new AuthRequirementError(404, 'Profile not found.');
  return profile;
}

export { getCurrentUser, requireOwnProfile, AuthRequirementError };
