const { getSupabase } = require('./_supabase');

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

function getUserId(event) {
  const rawId = event.queryStringParameters && event.queryStringParameters.id;
  const id = Number(rawId);
  return rawId && Number.isInteger(id) && id > 0 ? id : null;
}

function parseProfileBody(event) {
  let body;
  try {
    body = JSON.parse(event.body || 'null');
  } catch (err) {
    return null;
  }

  if (!body || Array.isArray(body) || typeof body !== 'object') return null;
  if (!Object.prototype.hasOwnProperty.call(body, 'year') ||
      !Object.prototype.hasOwnProperty.call(body, 'languages') ||
      !Object.prototype.hasOwnProperty.call(body, 'weekly_free_hours')) {
    return null;
  }
  if (!Number.isInteger(body.year) || body.year < 1 || body.year > 6) return null;
  if (typeof body.languages !== 'string' || body.languages.length > 50 || /[\r\n]/.test(body.languages)) return null;
  if (!Number.isInteger(body.weekly_free_hours) || body.weekly_free_hours < 0 || body.weekly_free_hours > 60) return null;
  return body;
}

async function getDemoUser(supabase, id) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, year, languages, weekly_free_hours, university:universities(name), faculty:faculties(name)')
    .eq('id', id)
    .eq('is_demo', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

exports.handler = async (event) => {
  const id = getUserId(event);
  if (!id) return json(400, { error: 'A valid user id is required.' });

  if (event.httpMethod === 'GET') {
    try {
      const user = await getDemoUser(getSupabase(), id);
      if (!user) return json(404, { error: 'Demo user not found.' });
      return json(200, {
        name: user.name,
        year: user.year,
        languages: user.languages,
        weekly_free_hours: user.weekly_free_hours,
        university: user.university ? user.university.name : null,
        faculty: user.faculty ? user.faculty.name : null
      });
    } catch (err) {
      console.error('Could not load profile:', err);
      return json(500, { error: 'Could not load the profile. Check the Supabase settings in Netlify.' });
    }
  }

  if (event.httpMethod === 'PUT') {
    const body = parseProfileBody(event);
    if (!body) return json(400, { error: 'Year, languages, and weekly free hours are invalid.' });

    try {
      const supabase = getSupabase();
      const user = await getDemoUser(supabase, id);
      if (!user) return json(404, { error: 'Demo user not found.' });

      const { error } = await supabase
        .from('users')
        .update({
          year: body.year,
          languages: body.languages,
          weekly_free_hours: body.weekly_free_hours
        })
        .eq('id', id)
        .eq('is_demo', true);
      if (error) throw error;

      return json(200, { message: 'Profile updated.' });
    } catch (err) {
      console.error('Could not update profile:', err);
      return json(500, { error: 'Could not update the profile. Check the Supabase settings in Netlify.' });
    }
  }

  return json(405, { error: 'Method not allowed.' });
};
