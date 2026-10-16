const DEFAULT_TOTAL_LIMIT = 300;

function readLimit(value, fallback) {
  const limit = Number(value);
  return Number.isInteger(limit) && limit > 0 ? limit : fallback;
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

async function readUsage(supabase, usageDate, scopes) {
  const { data, error } = await supabase
    .from('ai_daily_usage')
    .select('scope, count')
    .eq('usage_date', usageDate)
    .in('scope', scopes);
  if (error) throw error;
  const usage = new Map((data || []).map((row) => [row.scope, Number(row.count) || 0]));
  return scopes.map((scope) => usage.get(scope) || 0);
}

async function checkAiLimit(supabase, env) {
  const totalLimit = readLimit(env.AI_DAILY_LIMIT_TOTAL, DEFAULT_TOTAL_LIMIT);
  const usageDate = todayUtc();
  const [totalUsed] = await readUsage(supabase, usageDate, ['total']);
  if (totalUsed >= totalLimit) return { allowed: false, reason: 'total' };
  return { allowed: true };
}

async function recordAiUsage(supabase) {
  const usageDate = todayUtc();
  const [totalUsed] = await readUsage(supabase, usageDate, ['total']);
  const rows = [{ usage_date: usageDate, scope: 'total', count: totalUsed + 1 }];
  const { error } = await supabase.from('ai_daily_usage').upsert(rows, { onConflict: 'usage_date,scope' });
  if (error) throw error;
}

export { checkAiLimit, recordAiUsage };
