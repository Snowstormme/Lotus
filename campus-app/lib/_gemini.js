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
        generationConfig: { maxOutputTokens: 1024, ...(responseMimeType ? { responseMimeType } : {}) }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const error = new Error('Gemini request failed');
      error.provider = 'Gemini';
      error.providerStatus = response.status;
      error.providerCategory = 'bad_status';
      throw error;
    }
    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      error.provider = 'Gemini';
      error.providerCategory = 'bad_response';
      throw error;
    }
    const text = payload.candidates && payload.candidates[0] &&
      payload.candidates[0].content && payload.candidates[0].content.parts &&
      payload.candidates[0].content.parts.map((part) => part.text || '').join('');
    if (!text) {
      const error = new Error('Gemini returned no text');
      error.provider = 'Gemini';
      error.providerCategory = 'bad_response';
      throw error;
    }
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
