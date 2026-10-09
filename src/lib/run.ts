import type { RunStep, Session } from './types';

export class GuardRejection extends Error {}

// Runtime observations only. Old snapshots have no trace; do not invent one.
const observers = new WeakMap<Session, () => void>();
export function observeRun(s: Session, observer: () => void) {
  observers.set(s, observer);
  return () => { observers.delete(s); };
}
function begin(s: Session, name: string, type: RunStep['type']) {
  const entry: RunStep = { id: crypto.randomUUID(), name, type, status: 'RUNNING', result: 'In progress', startedAt: Date.now(), version: s.version };
  (s.run ??= []).push(entry);
  observers.get(s)?.();
  return entry;
}
function finish(s: Session, entry: RunStep, status: RunStep['status'], result: string) {
  entry.endedAt = Date.now(); entry.durationMs = Math.max(0, entry.endedAt - entry.startedAt);
  entry.status = status; entry.result = result;
  observers.get(s)?.();
}
function failed(s: Session, entry: RunStep, error: unknown) {
  finish(s, entry, error instanceof GuardRejection ? 'REJECTED' : 'FAILED', error instanceof Error ? error.message : 'Operation failed');
}
export async function track<T>(s: Session, name: string, type: RunStep['type'], fn: () => Promise<T> | T, result: (value: T) => string): Promise<T> {
  const entry = begin(s, name, type);
  try { const value = await fn(); finish(s, entry, 'COMPLETED', result(value)); return value; }
  catch (error) { failed(s, entry, error); throw error; }
}
export function trackSync<T>(s: Session, name: string, type: RunStep['type'], fn: () => T, result: (value: T) => string): T {
  const entry = begin(s, name, type);
  try { const value = fn(); finish(s, entry, 'COMPLETED', result(value)); return value; }
  catch (error) { failed(s, entry, error); throw error; }
}
export function human(s: Session, name: string, result: string) {
  trackSync(s, name, 'HUMAN', () => undefined, () => result);
}
export function reasoningType(s: Session) { return s.mode === 'live' ? 'MODEL' as const : 'CONTROLLER' as const; }
export function reasoningName(s: Session, name: string) { return s.mode === 'demo' ? `${name} (deterministic)` : name; }
export function runMetrics(steps: RunStep[]) {
  // Union of actual execution intervals: nested MODEL/TOOL time counts once.
  // Human waiting and gaps between requests are excluded.
  const intervals = steps.filter(x => x.type !== 'HUMAN' && x.endedAt !== undefined).map(x => [x.startedAt, x.endedAt!] as const).sort((a, b) => a[0] - b[0]);
  let runtimeMs = 0, end = 0;
  for (const [start, stop] of intervals) { runtimeMs += Math.max(0, stop - Math.max(start, end)); end = Math.max(end, stop); }
  return { runtimeMs, modelCalls: steps.filter(x => x.type === 'MODEL').length, toolCalls: steps.filter(x => x.type === 'TOOL').length, decisions: steps.filter(x => /^(Choose next action|Re-evaluate state)/.test(x.name)).length };
}
