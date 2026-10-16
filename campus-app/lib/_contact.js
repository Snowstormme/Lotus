const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const encoder = new TextEncoder();

function toBase64Url(bytes) {
  let binary = '';
  bytes.forEach(function (byte) { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  if (typeof value !== 'string' || !value || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, function (character) { return character.charCodeAt(0); });
  } catch (error) {
    return null;
  }
}

async function sign(payload, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
}

function constantTimeEqual(first, second) {
  let difference = first.length === second.length ? 0 : 1;
  const length = Math.max(first.length, second.length);
  for (let index = 0; index < length; index += 1) difference |= (first[index] || 0) ^ (second[index] || 0);
  return difference === 0;
}

async function createContactToken(userId, env) {
  if (!Number.isInteger(userId) || userId < 1 || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Contact token signing is unavailable');
  const payload = toBase64Url(encoder.encode(JSON.stringify({ userId, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS })));
  const signature = toBase64Url(await sign(payload, env.SUPABASE_SERVICE_ROLE_KEY));
  return payload + '.' + signature;
}

async function readContactToken(token, env) {
  if (typeof token !== 'string' || token.split('.').length !== 2 || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const parts = token.split('.');
  const payloadBytes = fromBase64Url(parts[0]);
  const signatureBytes = fromBase64Url(parts[1]);
  if (!payloadBytes || !signatureBytes) return null;
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch (error) {
    return null;
  }
  if (!payload || !Number.isInteger(payload.userId) || payload.userId < 1 || !Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
  const expected = await sign(parts[0], env.SUPABASE_SERVICE_ROLE_KEY);
  return constantTimeEqual(signatureBytes, expected) ? payload.userId : null;
}

export { createContactToken, readContactToken };
