const DEFAULT_MODEL = 'gemini-2.5-flash';

async function generatePlan(env, prompt) {
  const apiKey = env.GEMINI_API_KEY;
  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY in environment settings');

  const endpoint = new URL(
    '/v1beta/models/' + encodeURIComponent(model) + ':generateContent',
    'https://generativelanguage.googleapis.com'
  );
  endpoint.searchParams.set('key', apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      }),
      signal: controller.signal
    });

    if (!response.ok) throw new Error('Gemini request failed with status ' + response.status);
    const payload = await response.json();
    const text = payload.candidates && payload.candidates[0] &&
      payload.candidates[0].content && payload.candidates[0].content.parts &&
      payload.candidates[0].content.parts.map((part) => part.text || '').join('');
    if (!text) throw new Error('Gemini returned no plan text');
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

export { generatePlan };
