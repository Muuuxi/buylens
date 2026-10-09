import { test } from 'node:test';
import assert from 'node:assert/strict';
import { confirm, createSession, criticalGaps, editConstraintValue, interpret, revisePurchase, step, validateEvidence } from '../src/lib/agent';
import { createDemoSession } from '../src/lib/fixtures';
import { demoReasoner } from '../src/lib/demo-reasoner';
import type { Criterion, Evidence, Reasoner } from '../src/lib/types';

const budget: Criterion = { id: 'budget', label: 'Budget', priority: 'Hard constraint', context: 'Price under $200', minutes: null, constraint: { operator: 'lte', value: 200, unit: 'USD' } };
const weight: Criterion = { id: 'portability', label: 'Lightweight portability', priority: 'Critical', context: 'Carry on trains to the airport', minutes: null };

test('ordinary initialization and product changes never seed or retain demo context', async () => {
  const fresh = createSession();
  assert.equal(fresh.mode, 'live');
  assert.equal(fresh.product, ''); assert.equal(fresh.need, ''); assert.equal(fresh.reviewText, '');
  assert.deepEqual(fresh.criteria, []); assert.deepEqual(fresh.evidence, []);
  const demo = createDemoSession();
  await interpret(demo, demoReasoner); confirm(demo, demo.criteria);
  for (let i = 0; i < 12 && demo.phase !== 'complete'; i++) await step(demo, demoReasoner);
  const next = revisePurchase(demo, 'need', 'A light, durable carry-on suitcase under $200.');
  assert.equal(next.product, ''); assert.equal(next.reviewText, ''); assert.equal(next.mode, 'live');
  for (const key of ['criteria', 'reviews', 'evidence', 'conflicts', 'assessments', 'run', 'log'] as const) assert.deepEqual(next[key], []);
  assert.equal(next.brief, null); assert.equal(next.decision, null); assert.equal(next.requests, 0); assert.equal(next.iterations, 0);
  assert.doesNotMatch(JSON.stringify(next), /headphones|Demo-H1|subway|\banc\b/i);
});

test('no supplied reviews cannot call extraction or finalize critical/hard constraints', async () => {
  const s = createSession(); s.product = 'Carry-on suitcase'; s.need = 'Light and durable under $200';
  const r: Reasoner = {
    ...demoReasoner,
    interpret: async () => ({ product: s.product, criteria: [weight, budget], question: null }),
    extract: async () => { throw new Error('Must not extract missing reviews'); },
    decide: async (_, allowed) => { assert.ok(!allowed.includes('FINALIZE')); return { action: 'REQUEST_EVIDENCE', targetId: 'budget', reason: 'No price evidence has been supplied.' }; },
  };
  await interpret(s, r); confirm(s, s.criteria);
  await step(s, r); await step(s, r); await step(s, r);
  assert.equal(s.phase, 'waiting'); assert.equal(s.brief, null);
  assert.deepEqual(s.reviews, []); assert.deepEqual(s.evidence, []);
  assert.equal(criticalGaps(s).length, 2);
});

test('numeric hard constraints are guarded by source numbers and confirmed limits', () => {
  const s = createSession(); s.product = 'Suitcase'; s.need = 'Under $200'; s.criteria = [budget];
  s.reviews = [{ id: 'R1', rawText: 'I paid $249 for it.', rating: 5, group: 'g1' }];
  const e: Omit<Evidence, 'id'> = { reviewId: 'R1', criterionId: 'budget', quote: s.reviews[0].rawText, polarity: 'support', quality: 'high', relevance: 'direct', environment: 'unknown', minutes: null, glasses: null, reason: 'Paid price', repetitive: false, ratingContradiction: false, measurement: { value: 249, unit: 'USD' } };
  validateEvidence(s, [e]); assert.equal(s.evidence[0].polarity, 'challenge');
  assert.throws(() => validateEvidence(s, [{ ...e, measurement: { value: 24, unit: 'USD' } }]), /measurement/);
});

test('editing a hard limit keeps its displayed context and confirmed numeric value consistent', () => {
  const changed = editConstraintValue(budget, 190);
  assert.equal(changed.constraint?.value, 190);
  assert.equal(changed.context, 'Price under $190');
  assert.equal(budget.constraint?.value, 200);
  assert.throws(() => editConstraintValue(budget, NaN), /valid/);
});
