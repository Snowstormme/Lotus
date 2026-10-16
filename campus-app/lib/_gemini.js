const DEFAULT_MODEL = 'gemini-2.5-flash';

async function generateText(env, prompt, timeoutMs, responseMimeType) {
  const apiKey = env.GEMINI_API_KEY;
  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY in environment settings');

  const endpoint = new URL(
    '/v1beta/models/' + encodeURIComponent(model) + ':generateContent',
    'https://generativelanguage.googleapis.com'
  );
  endpoint.searchParams.set('key', apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: responseMimeType ? { responseMimeType } : undefined
      }),
      signal: controller.signal
    });

    if (!response.ok) throw new Error('Gemini request failed with status ' + response.status);
    const payload = await response.json();
    const text = payload.candidates && payload.candidates[0] &&
      payload.candidates[0].content && payload.candidates[0].content.parts &&
      payload.candidates[0].content.parts.map((part) => part.text || '').join('');
    if (!text) throw new Error('Gemini returned no text');
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

async function generatePlan(env, prompt) {
  return generateText(env, prompt, 10000, 'application/json');
}

async function generateChat(env, prompt) {
  return generateText(env, prompt, 15000);
}

export { generatePlan, generateChat };
