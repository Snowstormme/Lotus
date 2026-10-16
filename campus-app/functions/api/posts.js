import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function parseBody(request) {
  try {
    const body = await request.json();
    if (typeof body === 'string') return JSON.parse(body);
    return body;
  } catch (error) {
    return null;
  }
}

function mapPosts(posts, likes, profileId) {
  const likeRows = likes || [];
  const counts = new Map();
  const liked = new Set();
  likeRows.forEach(function (like) {
    counts.set(like.post_id, (counts.get(like.post_id) || 0) + 1);
    if (like.user_id === profileId) liked.add(like.post_id);
  });
  return (posts || []).map(function (post) {
    const author = post.author || {};
    return {
      id: post.id,
      body: post.body,
      created_at: post.created_at,
      author_name: author.name || 'Student',
      author_year: author.year,
      like_count: counts.get(post.id) || 0,
      liked_by_me: liked.has(post.id),
      is_sample: author.is_demo === true
    };
  });
}

export async function onRequestGet(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const supabase = getSupabase(context.env);
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, body, created_at, author:users(name, year, is_demo)')
      .eq('university_id', profile.university_id)
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(20);
    if (postsError) throw postsError;

    const postIds = (posts || []).map((post) => post.id);
    if (postIds.length === 0) return json([]);
    const { data: likes, error: likesError } = await supabase
      .from('post_likes')
      .select('post_id, user_id')
      .in('post_id', postIds);
    if (likesError) throw likesError;
    return json(mapPosts(posts, likes, profile.id));
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not load posts:', error);
    return json({ error: 'Could not load the feed.' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const body = await parseBody(context.request);
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
