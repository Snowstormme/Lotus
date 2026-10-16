import { getSupabase } from '../../lib/_supabase.js';
import { requireOwnProfile } from '../../lib/_auth.js';

const BUCKET = 'course-files';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const KINDS = ['syllabus', 'presentation', 'notes', 'assignment', 'other'];
const MIME_EXTENSIONS = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx'
};

function json(body, status = 200) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }); }
function validId(value) { return Number.isInteger(value) && value > 0; }
function validText(value, max) { return typeof value === 'string' && value.trim().length >= 1 && value.trim().length <= max; }
function base64url(bytes) { let binary = ''; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''); }
function bytesFromBase64url(value) { const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4); const binary = atob(base64); return Uint8Array.from(binary, (character) => character.charCodeAt(0)); }
async function signPayload(payload, env) { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.SUPABASE_SERVICE_ROLE_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)))); }
async function createUploadToken(payload, env) { const encoded = base64url(new TextEncoder().encode(JSON.stringify(payload))); return encoded + '.' + await signPayload(encoded, env); }
async function readUploadToken(token, env) {
  try {
    if (typeof token !== 'string') return null;
    const parts = token.split('.'); if (parts.length !== 2) return null;
    const expected = await signPayload(parts[0], env); const actual = bytesFromBase64url(parts[1]); const expectedBytes = bytesFromBase64url(expected);
    if (actual.length !== expectedBytes.length || !actual.every((byte, index) => byte === expectedBytes[index])) return null;
    const payload = JSON.parse(new TextDecoder().decode(bytesFromBase64url(parts[0])));
    return payload.expires_at > Date.now() ? payload : null;
  } catch (error) { return null; }
}
async function parseBody(request) { try { const body = await request.json(); return typeof body === 'string' ? JSON.parse(body) : body; } catch (error) { return null; } }
function publicUpload(row, users, profileId) { return { id: row.id, title: row.title, kind: row.kind, mime_type: row.mime_type, file_size: row.file_size, created_at: row.created_at, uploader_name: users.get(row.uploader_id) || 'Student', is_mine: row.uploader_id === profileId }; }
async function requireEnrollment(supabase, profileId, courseId) { const { data, error } = await supabase.from('enrollments').select('course_id').eq('user_id', profileId).eq('course_id', courseId).maybeSingle(); if (error) throw error; return Boolean(data); }
async function removeObject(storage, path) { const { error } = await storage.remove([path]); if (error) throw error; }

export async function onRequestGet(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env); const courseId = Number(new URL(context.request.url).searchParams.get('course_id')); if (!validId(courseId)) return json({ error: 'A valid course id is required.' }, 400);
    const supabase = getSupabase(context.env); if (!(await requireEnrollment(supabase, profile.id, courseId))) return json({ error: 'Course not found.' }, 404);
    const { data, error } = await supabase.from('course_uploads').select('id, title, kind, mime_type, file_size, created_at, uploader_id').eq('course_id', courseId).eq('hidden', false).order('created_at', { ascending: false }); if (error) throw error;
    const uploaderIds = Array.from(new Set((data || []).map((row) => row.uploader_id))); const users = new Map(); if (uploaderIds.length) { const result = await supabase.from('users').select('id, name').in('id', uploaderIds); if (result.error) throw result.error; (result.data || []).forEach((user) => users.set(user.id, user.name)); }
    return json((data || []).map((row) => publicUpload(row, users, profile.id)));
  } catch (error) { if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status); console.error('Could not load course uploads:', error); return json({ error: 'Could not load course uploads.' }, 500); }
}

export async function onRequestPost(context) {
  try {
    const profile = await requireOwnProfile(context.request, context.env); const body = await parseBody(context.request); if (!body || Array.isArray(body)) return json({ error: 'Upload request is invalid.' }, 400); const supabase = getSupabase(context.env); const storage = supabase.storage.from(BUCKET);
    if (body.action === 'start') {
      const courseId = body.course_id; if (!validId(courseId) || !(await requireEnrollment(supabase, profile.id, courseId))) return json({ error: 'Course not found.' }, 404);
      if (!validText(body.title, 120)) return json({ error: 'Upload title must be between 1 and 120 characters.' }, 400); if (!KINDS.includes(body.kind)) return json({ error: 'Upload kind is invalid.' }, 400); if (!Object.prototype.hasOwnProperty.call(MIME_EXTENSIONS, body.mime_type)) return json({ error: 'File type is not allowed.' }, 400); if (!Number.isInteger(body.file_size) || body.file_size < 1 || body.file_size > MAX_FILE_SIZE) return json({ error: 'File size is not allowed.' }, 400);
      const countResult = await supabase.from('course_uploads').select('id', { count: 'exact', head: true }).eq('course_id', courseId).eq('uploader_id', profile.id); if (countResult.error) throw countResult.error; if ((countResult.count || 0) >= 20) return json({ error: 'You can upload up to 20 files for this course.' }, 400);
      const nonce = crypto.randomUUID(); const payload = { course_id: courseId, user_id: profile.id, nonce, extension: MIME_EXTENSIONS[body.mime_type], title: body.title.trim(), kind: body.kind, mime_type: body.mime_type, file_size: body.file_size, expires_at: Date.now() + 15 * 60 * 1000 }; const uploadId = await createUploadToken(payload, context.env); const path = 'course-' + courseId + '/user-' + profile.id + '/' + nonce + '.' + payload.extension; const signed = await storage.createSignedUploadUrl(path); if (signed.error) throw signed.error; return json({ upload_id: uploadId, signed_url: signed.data.signedUrl });
    }
    if (body.action === 'finish') {
      const payload = await readUploadToken(body.upload_id, context.env); if (!payload || payload.user_id !== profile.id) return json({ error: 'Upload session is invalid or expired.' }, 400); if (!(await requireEnrollment(supabase, profile.id, payload.course_id))) return json({ error: 'Course not found.' }, 404);
      const path = 'course-' + payload.course_id + '/user-' + profile.id + '/' + payload.nonce + '.' + payload.extension; const folder = 'course-' + payload.course_id + '/user-' + profile.id; const listed = await storage.list(folder, { limit: 100 }); if (listed.error) throw listed.error; const file = (listed.data || []).find((entry) => entry.name === payload.nonce + '.' + payload.extension); if (!file || (file.metadata && Number.isFinite(Number(file.metadata.size)) && Number(file.metadata.size) !== payload.file_size)) { await storage.remove([path]); return json({ error: 'Uploaded file could not be verified.' }, 400); }
      const inserted = await supabase.from('course_uploads').insert({ course_id: payload.course_id, uploader_id: profile.id, title: payload.title, kind: payload.kind, mime_type: payload.mime_type, file_size: payload.file_size, storage_path: path }).select('id, title, kind, mime_type, file_size, created_at').single(); if (inserted.error) { await storage.remove([path]); throw inserted.error; } return json(inserted.data, 201);
    }
    if (body.action === 'report') {
      if (!validId(body.upload_id) || !['spam', 'copyright', 'harmful', 'other'].includes(body.reason)) return json({ error: 'Report details are invalid.' }, 400); const upload = await supabase.from('course_uploads').select('id, course_id, hidden').eq('id', body.upload_id).maybeSingle(); if (upload.error) throw upload.error; if (!upload.data || upload.data.hidden || !(await requireEnrollment(supabase, profile.id, upload.data.course_id))) return json({ error: 'Upload not found.' }, 404);
      const prior = await supabase.from('upload_reports').select('id').eq('upload_id', body.upload_id).eq('reporter_id', profile.id).maybeSingle(); if (prior.error) throw prior.error; if (prior.data) return json({ error: 'You already reported this upload.' }, 400); const report = await supabase.from('upload_reports').insert({ upload_id: body.upload_id, reporter_id: profile.id, reason: body.reason }); if (report.error) throw report.error;
      const reports = await supabase.from('upload_reports').select('reporter_id').eq('upload_id', body.upload_id); if (reports.error) throw reports.error; if (new Set((reports.data || []).map((row) => row.reporter_id)).size >= 3) { const hidden = await supabase.from('course_uploads').update({ hidden: true }).eq('id', body.upload_id); if (hidden.error) throw hidden.error; } return json({ message: 'Report submitted.' });
    }
    return json({ error: 'Upload action is invalid.' }, 400);
  } catch (error) { if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status); console.error('Could not process course upload:', error); return json({ error: 'Could not process the course upload.' }, 500); }
}

export async function onRequestDelete(context) {
  try { const profile = await requireOwnProfile(context.request, context.env); const body = await parseBody(context.request); if (!body || !validId(body.id)) return json({ error: 'A valid upload id is required.' }, 400); const supabase = getSupabase(context.env); const existing = await supabase.from('course_uploads').select('id, storage_path').eq('id', body.id).eq('uploader_id', profile.id).maybeSingle(); if (existing.error) throw existing.error; if (!existing.data) return json({ error: 'Upload not found.' }, 404); const storage = supabase.storage.from(BUCKET); await removeObject(storage, existing.data.storage_path); const deleted = await supabase.from('course_uploads').delete().eq('id', body.id).eq('uploader_id', profile.id); if (deleted.error) throw deleted.error; return json({ message: 'Upload deleted.' }); } catch (error) { if (error.status === 401 || error.status === 404) return json({ error: error.publicMessage }, error.status); console.error('Could not delete course upload:', error); return json({ error: 'Could not delete the course upload.' }, 500); }
}
