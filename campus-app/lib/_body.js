function response(message, status) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { 'Content-Type': 'application/json' } });
}

async function readJsonLimited(request, maxBytes) {
  let text;
  try {
    text = await request.text();
  } catch (error) {
    return { ok: false, response: response('Request body is not valid.', 400) };
  }
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return { ok: false, response: response('Request is too large.', 413) };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, response: response('Request body is not valid.', 400) };
  }
}

export { readJsonLimited };
