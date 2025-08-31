export async function uploadVoice({ blob, model, sessionId }: { blob: Blob; model?: string; sessionId?: string }) {
  const base = (process.env.NEXT_PUBLIC_VOICE_API_URL
    || ((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/voice')) as string;
  const fd = new FormData();
  fd.append('file', blob, 'audio.webm');
  if (sessionId) fd.append('session_id', sessionId);
  if (model) fd.append('model', model);
  const res = await fetch(base, { method: 'POST', body: fd });
  let json: any = {};
  try { json = await res.json(); } catch {}
  // try to extract transcript from common shapes
  const t = json?.transcript
    ?? json?.text
    ?? json?.result?.transcript
    ?? json?.data?.transcript
    ?? (Array.isArray(json?.alternatives) && json.alternatives[0]?.transcript)
    ?? '';
  return String(t || '').trim();
}

