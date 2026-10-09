import { cookies } from 'next/headers';
import { z } from 'zod';
import { addEvidence, confirm, createSession, editCriteria, interpret, log, skipEvidence, step, validateInput } from '@/lib/agent';
import { demoReasoner } from '@/lib/demo-reasoner';
import { commandSchema } from '@/lib/schemas';
import { createLiveReasoner } from '@/server/llm';
import { insertSession, loadSession, saveSession } from '@/server/persistence';
import type { Session } from '@/lib/types';
import { human } from '@/lib/run';
import { publicDemoOnly } from '@/server/demo-policy';

export const runtime = 'nodejs';
export const maxDuration = 60;
const COOKIE = 'buylens_guest';
const headers = { 'Cache-Control': 'no-store' };
const LIVE_LIMIT_MESSAGE = 'This public demo has reached its live AI limit. Start a new demo later or view the prepared example.';
function modelLimit() {
  const parsed = Number(process.env.MAX_LIVE_MODEL_CALLS_PER_SESSION ?? '6');
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 6;
}
function sameOrigin(request: Request) {
  try {
    const origin = new URL(request.headers.get('origin') ?? '');
    // Next's internal request URL can use localhost while the browser uses
    // 127.0.0.1. Compare with the public Host header, not that internal URL.
    return ['http:', 'https:'].includes(origin.protocol) && origin.host === request.headers.get('host');
  } catch { return false; }
}
async function current() {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id || !z.uuid().safeParse(id).success) throw new Error('No saved guest session. Start a new live task.');
  return loadSession(id);
}
export async function GET() {
  if (publicDemoOnly()) return Response.json({ session: null }, { headers });
  if (!(await cookies()).has(COOKIE)) return Response.json({ session: null }, { headers });
  try { const { session } = await current(); return Response.json({ session }, { headers }); }
  catch (e) { return Response.json({ error: e instanceof Error ? e.message : 'Unable to restore this task.' }, { status: 503, headers }); }
}
export async function DELETE(request: Request) {
  if (publicDemoOnly()) return Response.json({ error: 'Live sessions are disabled in the public portfolio demo.' }, { status: 403, headers });
  if (!sameOrigin(request)) return Response.json({ error: 'Same-origin request required.' }, { status: 403 });
  (await cookies()).delete(COOKIE);
  return Response.json({ ok: true }, { headers });
}
export async function POST(request: Request) {
  if (publicDemoOnly()) return Response.json({ error: 'Live sessions are disabled in the public portfolio demo.' }, { status: 403, headers });
  if (!sameOrigin(request)) return Response.json({ error: 'Same-origin request required.' }, { status: 403 });
  const text = await request.text();
  if (text.length > 30000) return Response.json({ error: 'Request is too large.' }, { status: 413 });
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return Response.json({ error: 'Invalid request JSON.' }, { status: 400 }); }
  const parsed = commandSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: 'The input does not match the expected action or field limits.' }, { status: 400 });
  const command = parsed.data;
  let s: Session | null = null;
  let updatedAt: string | null = null;
  let before: Session | null = null;
  try {
    if (command.action === 'create') {
      if (command.mode === 'live' && !process.env.OPENAI_API_KEY) throw new Error('Set OPENAI_API_KEY before starting live analysis.');
      s = createSession(command.reviewText, command.mode); s.product = command.product; s.need = command.need;
      s.productProvided = !!command.product.trim();
      validateInput(s, false); log(s, 'user_action', 'Task created', `${s.mode} mode`); await insertSession(s);
      (await cookies()).set(COOKIE, s.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 60 * 60 * 24 * 7 });
      return Response.json({ session: s }, { headers });
    }
    const saved = await current(); s = saved.session; updatedAt = saved.updatedAt; before = structuredClone(s);
    const reasoner = s.mode === 'live' ? createLiveReasoner(async () => {
      if (!s || !updatedAt) throw new Error('The saved task is unavailable. Reload before continuing.');
      if ((s.modelRequests ?? 0) >= modelLimit()) throw new Error(LIVE_LIMIT_MESSAGE);
      const previousCount = s.modelRequests ?? 0;
      s.modelRequests = previousCount + 1;
      try { updatedAt = await saveSession(s, updatedAt); }
      catch (error) { s.modelRequests = previousCount; throw error; }
    }) : demoReasoner;
    if (command.action === 'interpret') {
      if (!['criteria', 'ready'].includes(s.phase) || s.confirmed) throw new Error('This task has already interpreted and confirmed criteria.');
      await interpret(s, reasoner);
    }
    if (command.action === 'clarify') {
      if (s.phase !== 'clarify' || s.clarifications >= 1) throw new Error('Only one clarification round is available.');
      s.need += `\n${command.answer}`; s.clarifications++; human(s, 'Clarify needs', 'Clarification answer received'); await interpret(s, reasoner);
    }
    if (command.action === 'confirm') {
      if (new Set(command.criteria.map(c => c.id)).size !== command.criteria.length) throw new Error('Each criterion ID must be unique.');
      confirm(s, command.criteria);
    }
    if (command.action === 'step') await step(s, reasoner);
    if (command.action === 'add') addEvidence(s, command.text);
    if (command.action === 'skip') skipEvidence(s);
    if (command.action === 'edit') editCriteria(s);
    s.error = null; await saveSession(s, updatedAt);
    return Response.json({ session: s }, { headers });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'The operation failed. Your previously saved progress is preserved.';
    if (s && updatedAt) {
      const failedLog = s.log;
      const failedRun = s.run;
      if (before) s = { ...before, log: failedLog, run: failedRun, iterations: Math.max(before.iterations, s.iterations), modelRequests: Math.max(before.modelRequests ?? 0, s.modelRequests ?? 0) };
      s.error = error;
      // Preserve failed tool/action logs and the resumable phase; never claim success.
      try { await saveSession(s, updatedAt); } catch { return Response.json({ error: `${error} Reload to restore the last saved task.` }, { status: 503, headers }); }
      return Response.json({ error, session: s }, { status: 422, headers });
    }
    return Response.json({ error }, { status: 503, headers });
  }
}
