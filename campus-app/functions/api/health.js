export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true, service: 'campus-app' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
