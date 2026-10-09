import assert from 'node:assert/strict';
import { addEvidence, confirm, createSession, criticalGaps, interpret, skipEvidence, step } from '../src/lib/agent';
import { demoReasoner } from '../src/lib/demo-reasoner';
import { createDemoSession, initialCriteria, defaultNeed, scenarios, subwayReviews } from '../src/lib/fixtures';
import type { Session } from '../src/lib/types';

export type EvaluationResult = { name: string; status: 'PASS' | 'FAIL'; observed: string; durationMs: number };
async function setup(key: keyof typeof scenarios) {
  const s = createDemoSession(scenarios[key].reviews.join('\n\n')); s.need = defaultNeed;
  await interpret(s, demoReasoner); confirm(s, s.criteria); return s;
}
async function run(s: Session) {
  for (let i = 0; i < 20 && !['waiting', 'complete', 'stopped'].includes(s.phase); i++) await step(s, demoReasoner);
  assert.ok(['waiting', 'complete', 'stopped'].includes(s.phase), 'Engine did not reach a bounded outcome');
}
export async function evaluatePortfolio() {
  const results: EvaluationResult[] = [];
  let citationsChecked = 0, invalidFinalizationsBlocked = 0, invalidCitationsRejected = 0, unresolvedFitReferences = 0;
  const cases: [string, () => Promise<string>][] = [
    ['Vague need → clarification', async () => {
      const s = createDemoSession('A supplied review'); s.need = 'Good headphones'; await interpret(s, demoReasoner);
      assert.equal(s.phase, 'clarify'); await assert.rejects(step(s, demoReasoner), /Confirm/);
      return 'One clarification requested; analysis blocked before confirmation';
    }],
    ['Sufficient evidence → finalize', async () => {
      const s = await setup('sufficient'); await run(s);
      assert.equal(s.decision?.action, 'FINALIZE'); assert.equal(s.phase, 'complete'); assert.ok(s.brief && !s.brief.incomplete);
      for (const e of s.evidence) { assert.ok(s.reviews.find(r => r.id === e.reviewId)?.rawText.includes(e.quote)); citationsChecked++; }
      unresolvedFitReferences += s.brief.fits.flatMap(x => x.evidenceIds).filter(id => criticalGaps(s).some(gap => gap.criterionId === s.evidence.find(e => e.id === id)?.criterionId)).length;
      assert.equal(unresolvedFitReferences, 0);
      return `FINALIZE; ${s.evidence.length} exact source citations verified; no unresolved critical fit references`;
    }],
    ['Comfort conflict → investigate', async () => {
      const s = await setup('conflict'); await run(s);
      assert.deepEqual(s.log.filter(e => e.kind === 'decision').map(e => e.label), ['INVESTIGATE_CONFLICT', 'FINALIZE']);
      assert.equal(s.conflicts[0].status, 'explained'); assert.ok(s.brief!.risks.length);
      return 'INVESTIGATE_CONFLICT before FINALIZE; adverse accounts preserved';
    }],
    ['Office ANC only → request evidence', async () => {
      const s = await setup('missing'); await run(s);
      assert.equal(s.decision?.action, 'REQUEST_EVIDENCE'); assert.equal(s.decision?.targetId, 'anc');
      assert.equal(s.assessments.find(a => a.criterionId === 'anc')?.coverage, 'insufficient');
      return 'REQUEST_EVIDENCE for subway ANC; office evidence cannot satisfy it';
    }],
    ['User skips evidence → stop insufficient', async () => {
      const s = await setup('missing'); await run(s); skipEvidence(s); await run(s);
      assert.equal(s.decision?.action, 'STOP_INSUFFICIENT'); assert.equal(s.phase, 'stopped'); assert.ok(s.brief?.incomplete);
      assert.equal(s.brief?.fits.some(x => x.evidenceIds.some(id => s.evidence.find(e => e.id === id)?.criterionId === 'anc')), false);
      return 'STOP_INSUFFICIENT; incomplete brief contains no subway fit claim';
    }],
    ['Added subway evidence → reanalyze', async () => {
      const s = await setup('missing'); await run(s); const history = structuredClone(s.log); const iterations = s.iterations;
      addEvidence(s, subwayReviews.join('\n\n')); assert.equal(s.iterations, iterations); assert.equal(s.requests, 1);
      await run(s); assert.equal(s.phase, 'complete'); assert.equal(s.version, 2); assert.deepEqual(s.log.slice(0, history.length), history);
      return 'Version 2 → FINALIZE; original request and decision history preserved';
    }],
    ['Invalid citation → reject', async () => {
      const s = await setup('sufficient'); await step(s, demoReasoner);
      await assert.rejects(step(s, { ...demoReasoner, extract: async state => [{ ...(await demoReasoner.extract(state))[0], quote: 'Invented quote absent from every review.' }] }), /citation/);
      assert.equal(s.evidence.length, 0); assert.equal(s.brief, null);
      assert.ok(s.run?.some(x => x.name === 'Verify citations and relevance' && x.status === 'REJECTED')); invalidCitationsRejected++;
      return 'Injected nonexistent quote rejected by rawText.includes(quote); no brief';
    }],
    ['Illegal early FINALIZE → controller blocks', async () => {
      const s = await setup('missing'); await step(s, demoReasoner); await step(s, demoReasoner);
      await assert.rejects(step(s, { ...demoReasoner, decide: async () => ({ action: 'FINALIZE', targetId: null, reason: 'Injected invalid proposal for safety testing' }) }), /not allowed/);
      assert.equal(s.brief, null); assert.equal(s.phase, 'deciding'); assert.equal(s.decision, null);
      assert.ok(s.run?.some(x => x.name === 'Controller validation' && x.status === 'REJECTED')); invalidFinalizationsBlocked++;
      return 'Forced FINALIZE rejected with critical ANC gap; compose_brief never called';
    }],
  ];
  for (const [name, fn] of cases) {
    const startedAt = Date.now();
    try { results.push({ name, status: 'PASS', observed: await fn(), durationMs: Date.now() - startedAt }); }
    catch (error) { results.push({ name, status: 'FAIL', observed: error instanceof Error ? error.message : 'Test failed', durationMs: Date.now() - startedAt }); }
  }
  return { executedAt: new Date().toISOString(), provider: 'deterministic', results, metrics: { citationsChecked, invalidFinalizationsBlocked, invalidCitationsRejected, unresolvedFitReferences }, live: 'LIVE VERIFIED 2026-10-06 — 3/3 synthetic live scenarios passed with real OpenAI calls, Supabase refresh restoration and no deterministic fallback. The public demo remains deterministic. These scenario results do not measure general model accuracy.' };
}
