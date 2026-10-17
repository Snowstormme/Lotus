import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';
import { createContactToken } from '../../lib/_contact.js';
import { readJsonLimited } from '../../lib/_body.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function mapPosts(posts, authors, likes, profileId, env) {
  const likeRows = likes || [];
  const counts = new Map();
  const liked = new Set();
  likeRows.forEach(function (like) {
    counts.set(like.post_id, (counts.get(like.post_id) || 0) + 1);
    if (like.user_id === profileId) liked.add(like.post_id);
  });
  return Promise.all((posts || []).map(async function (post) {
    const author = authors.get(post.author_id) || {};
    return {
      id: post.id,
      body: post.body,
      created_at: post.created_at,
      author_name: author.name || 'Student',
      author_year: author.year,
      like_count: counts.get(post.id) || 0,
      liked_by_me: liked.has(post.id),
      is_sample: author.is_demo === true,
      contact_token: await createContactToken(post.author_id, env)
    };
  }));
}

export async function onRequestGet(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const supabase = getSupabase(context.env);
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, author_id, body, created_at')
      .eq('university_id', profile.university_id)
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(20);
    if (postsError) throw postsError;

    const postIds = (posts || []).map((post) => post.id);
    if (postIds.length === 0) return json([]);
    const authorIds = Array.from(new Set((posts || []).map((post) => post.author_id).filter(Boolean)));
    const { data: authors, error: authorsError } = authorIds.length > 0
      ? await supabase.from('users').select('id, name, year, is_demo').in('id', authorIds)
      : { data: [], error: null };
    if (authorsError) throw authorsError;
    const { data: likes, error: likesError } = await supabase
      .from('post_likes')
      .select('post_id, user_id')
      .in('post_id', postIds);
    if (likesError) throw likesError;
    const authorsById = new Map((authors || []).map((author) => [author.id, author]));
    return json(await mapPosts(posts, authorsById, likes, profile.id, context.env));
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not load posts:', error);
    return json({ error: 'Could not load the feed.' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const parsed = await readJsonLimited(context.request, 2 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.value;
    const postBody = body && typeof body.body === 'string' ? body.body.trim() : '';
    if (!postBody || postBody.length > 500) return json({ error: 'Post text must be between 1 and 500 characters.' }, 400);

    const supabase = getSupabase(context.env);
    const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', profile.id)
      .gte('created_at', cutoff);
    if (countError) throw countError;
    if ((count || 0) >= 5) return json({ error: 'Please wait before posting again.' }, 429);

    const { error } = await supabase.from('posts').insert({
      author_id: profile.id,
      university_id: profile.university_id,
      body: postBody,
      hidden: false
    });
    if (error) throw error;
    return json({ message: 'Post created.' });
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not create post:', error);
    return json({ error: 'Could not create the post.' }, 500);
  }
}
