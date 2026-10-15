import { estimateMonthlyCost } from '../../lib/_costs.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestGet(context) {
  try {
    const query = Object.fromEntries(new URL(context.request.url).searchParams.entries());
    if (query.user_id !== undefined) {
      const userId = Number(query.user_id);
      if (!Number.isInteger(userId) || userId <= 0) return json({ error: 'user_id must be a positive integer.' }, 400);
    }
    const result = estimateMonthlyCost(query);
    if (!result.valid) return json({ error: result.message }, 400);
    return json({ total_azn: result.total_azn, breakdown: result.breakdown, is_estimate: true });
  } catch (err) {
    console.error('Could not calculate cost estimate:', err);
    return json({ error: 'Could not calculate the cost estimate.' }, 500);
  }
}
