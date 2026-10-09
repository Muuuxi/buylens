import { test } from 'node:test';
import assert from 'node:assert/strict';
import { confirm, createSession, interpret, step } from '../src/lib/agent';
import { demoReasoner } from '../src/lib/demo-reasoner';
import { createDemoSession, initialCriteria, defaultNeed, scenarios } from '../src/lib/fixtures';
import { observeRun, runMetrics } from '../src/lib/run';
import { markdownBrief } from '../src/lib/markdown';
import { evaluatePortfolio } from './evaluation';

test('portfolio evaluation: eight actual branching and rejection scenarios', async t => {
  const report = await evaluatePortfolio();
  assert.equal(report.results.length, 8);
  for (const result of report.results) await t.test(result.name, () => assert.equal(result.status, 'PASS', result.observed));
});
test('run trace measures real operations, records running/failure, and excludes nested/idle time', async () => {
  const s = createDemoSession(scenarios.sufficient.reviews.join('\n\n')); s.need = defaultNeed;
  let sawRunning = false;
  const unsubscribe = observeRun(s, () => { sawRunning ||= s.run!.some(x => x.status === 'RUNNING'); });
  await interpret(s, demoReasoner); confirm(s, s.criteria); await step(s, demoReasoner);
  await assert.rejects(step(s, { ...demoReasoner, extract: async () => { throw new Error('Model transport failed'); } }), /transport/);
  unsubscribe();
  assert.ok(sawRunning); assert.equal(runMetrics(s.run!).modelCalls, 0); assert.equal(runMetrics(s.run!).toolCalls, 2);
  assert.ok(s.run!.some(x => x.type === 'HUMAN'));
  assert.ok(s.run!.some(x => x.name === 'Extract evidence' && x.status === 'FAILED'));
  assert.ok(s.run!.every(x => x.endedAt !== undefined && x.durationMs === x.endedAt - x.startedAt));
  assert.equal(runMetrics([
    { ...s.run![0], type: 'TOOL', startedAt: 10, endedAt: 50 },
    { ...s.run![0], type: 'MODEL', startedAt: 20, endedAt: 40 },
    { ...s.run![0], type: 'CONTROLLER', startedAt: 100, endedAt: 110 },
    { ...s.run![0], type: 'HUMAN', startedAt: 50, endedAt: 100 },
  ]).runtimeMs, 50);
  const live = createSession('Review', 'live'); live.need = defaultNeed;
  // Instrumentation unit test with a stub, not a live connection result.
  await interpret(live, demoReasoner); assert.equal(runMetrics(live.run!).modelCalls, 1);
});
test('Markdown is derived from validated brief state with source citations and all required sections', async () => {
  const s = createDemoSession(scenarios.conflict.reviews.join('\n\n')); s.need = defaultNeed;
  assert.throws(() => markdownBrief(s), /validated/);
  await interpret(s, demoReasoner); confirm(s, s.criteria);
  while (!['complete', 'waiting', 'stopped'].includes(s.phase)) await step(s, demoReasoner);
  const history = structuredClone(s.run); const markdown = markdownBrief(s);
  for (const heading of ['User Context', 'Confirmed Buying Criteria', 'Evidence Summary', 'What Fits Your Needs', 'Risks For You', 'Contradictory Evidence', 'Evidence Gaps / Unknowns', 'Before You Buy', 'Sources']) assert.ok(markdown.includes(`## ${heading}`));
  for (const item of [...s.brief!.fits, ...s.brief!.risks]) for (const id of item.evidenceIds) assert.ok(markdown.includes(`[${s.evidence.find(e => e.id === id)!.reviewId}](#source-`));
  assert.deepEqual(s.run, history);
});
