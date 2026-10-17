import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';
import { readJsonLimited } from '../../lib/_body.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestPost(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env);
    const parsed = await readJsonLimited(context.request, 4 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.value;
    const postId = body && body.post_id;
    if (!Number.isInteger(postId) || postId < 1) return json({ error: 'A valid post id is required.' }, 400);

    const supabase = getSupabase(context.env);
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, university_id')
      .eq('id', postId)
      .maybeSingle();
    if (postError) throw postError;
    if (!post || post.university_id !== profile.university_id) return json({ error: 'Post not found.' }, 404);

    const { data: existing, error: existingError } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', profile.id)
      .maybeSingle();
    if (existingError) throw existingError;

    let likedByMe;
    if (existing) {
      const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', profile.id);
      if (error) throw error;
      likedByMe = false;
    } else {
      const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: profile.id });
      if (error) throw error;
      likedByMe = true;
    }

    const { count, error: likeCountError } = await supabase
      .from('post_likes')
      .select('post_id', { count: 'exact', head: true })
      .eq('post_id', postId);
    if (likeCountError) throw likeCountError;
    return json({ like_count: count || 0, liked_by_me: likedByMe });
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not toggle post like:', error);
    return json({ error: 'Could not update the like.' }, 500);
  }
}
