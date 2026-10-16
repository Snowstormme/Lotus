const DEFAULT_PER_STUDENT_LIMIT = 20;
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

async function checkAiLimit(supabase, profileId, env) {
  const perStudentLimit = readLimit(env.AI_DAILY_LIMIT_PER_STUDENT, DEFAULT_PER_STUDENT_LIMIT);
  const totalLimit = readLimit(env.AI_DAILY_LIMIT_TOTAL, DEFAULT_TOTAL_LIMIT);
  const usageDate = todayUtc();
  const [totalUsed, studentUsed] = await readUsage(supabase, usageDate, ['total', 'user:' + profileId]);
  if (studentUsed >= perStudentLimit) return { allowed: false, reason: 'student' };
  if (totalUsed >= totalLimit) return { allowed: false, reason: 'total' };
  return { allowed: true, perStudentLimit, remainingBefore: perStudentLimit - studentUsed };
}

async function recordAiUsage(supabase, profileId, env) {
  const perStudentLimit = readLimit(env.AI_DAILY_LIMIT_PER_STUDENT, DEFAULT_PER_STUDENT_LIMIT);
  const usageDate = todayUtc();
  const studentScope = 'user:' + profileId;
  const [totalUsed, studentUsed] = await readUsage(supabase, usageDate, ['total', studentScope]);
  const rows = [
    { usage_date: usageDate, scope: 'total', count: totalUsed + 1 },
    { usage_date: usageDate, scope: studentScope, count: studentUsed + 1 }
  ];
  const { error } = await supabase.from('ai_daily_usage').upsert(rows, { onConflict: 'usage_date,scope' });
  if (error) throw error;
  return Math.max(perStudentLimit - studentUsed - 1, 0);
}

export { checkAiLimit, recordAiUsage };
