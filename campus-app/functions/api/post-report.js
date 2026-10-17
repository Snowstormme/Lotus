import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';
import { readJsonLimited } from '../../lib/_body.js';

const REPORT_REASONS = new Set(['spam', 'harassment', 'misinformation', 'other']);

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
    const reason = body && body.reason;
    if (!Number.isInteger(postId) || postId < 1 || typeof reason !== 'string' || !REPORT_REASONS.has(reason)) {
      return json({ error: 'Please choose a valid report reason.' }, 400);
    }

    const supabase = getSupabase(context.env);
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, university_id')
      .eq('id', postId)
      .maybeSingle();
    if (postError) throw postError;
    if (!post || post.university_id !== profile.university_id) return json({ error: 'Post not found.' }, 404);

    const { data: existing, error: existingError } = await supabase
      .from('post_reports')
      .select('id')
      .eq('post_id', postId)
      .eq('reporter_id', profile.id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return json({ message: 'Thanks, this post is already reported' });

    const { error: insertError } = await supabase.from('post_reports').insert({
      post_id: postId,
      reporter_id: profile.id,
      reason
    });
    if (insertError) throw insertError;

    const { count, error: reportCountError } = await supabase
      .from('post_reports')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId);
    if (reportCountError) throw reportCountError;
    if ((count || 0) >= 3) {
      const { error: hideError } = await supabase.from('posts').update({ hidden: true }).eq('id', postId);
      if (hideError) throw hideError;
    }
    return json({ message: 'Thanks, this post was reported.' });
  } catch (error) {
    if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status);
    console.error('Could not report post:', error);
    return json({ error: 'Could not report the post.' }, 500);
  }
}
