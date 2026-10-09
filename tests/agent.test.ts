import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addEvidence, confirm, createSession, editCriteria, interpret, prepare_reviews, skipEvidence, step, validateEvidence } from '../src/lib/agent';
import { demoReasoner } from '../src/lib/demo-reasoner';
import { conflictReview, createDemoSession, initialCriteria, defaultNeed, scenarios, subwayReviews } from '../src/lib/fixtures';
import type { Session } from '../src/lib/types';
import { commandSchema } from '../src/lib/schemas';
import { errorMessage } from '../src/lib/error-code';

async function setup(key: keyof typeof scenarios) {
  const s = createDemoSession(scenarios[key].reviews.join('\n\n')); s.need = defaultNeed;
  await interpret(s, demoReasoner); confirm(s, s.criteria); return s;
}
async function run(s: Session) {
  for (let i = 0; i < 20 && !['waiting', 'complete', 'stopped'].includes(s.phase); i++) await step(s, demoReasoner);
  assert.ok(['waiting', 'complete', 'stopped'].includes(s.phase));
}
test('Chinese live criteria retain canonical priority and numeric constraint through API parsing and confirmation', () => {
  const s = createSession('', 'live');
  s.product = '登机箱'; s.need = '我想买一个适合短途旅行的轻便登机箱，预算200美元以内，最在意耐用和轮子顺滑。'; s.phase = 'ready';
  const criteria = [
    { id: 'budget', label: '预算', context: '总价不超过200美元。', priority: 'Hard constraint' as const, minutes: null, requiredEnvironment: null, constraint: { operator: 'lte' as const, value: 200, unit: 'USD' } },
    { id: 'durability', label: '耐用性', context: '最在意箱体和整体结构耐用。', priority: 'Critical' as const, minutes: null, requiredEnvironment: null, constraint: null },
    { id: 'wheel_smoothness', label: '轮子顺滑度', context: '最在意轮子滚动顺滑。', priority: 'Critical' as const, minutes: null, requiredEnvironment: null, constraint: null },
    { id: 'lightweight', label: '轻便性', context: '希望箱子轻便，适合短途旅行。', priority: 'Medium' as const, minutes: null, requiredEnvironment: null, constraint: null },
  ];
  const command = commandSchema.parse(JSON.parse(JSON.stringify({ action: 'confirm', criteria })));
  assert.equal(command.action, 'confirm');
  if (command.action !== 'confirm') throw new Error('Unexpected command');
  assert.deepEqual(command.criteria, criteria);
  confirm(s, command.criteria);
  assert.equal(s.confirmed, true); assert.equal(s.phase, 'preparing');
  assert.deepEqual(s.criteria.map(c => c.priority), ['Hard constraint', 'Critical', 'Critical', 'Medium']);
  assert.equal(s.criteria[0].constraint?.value, 200);
  const invalid = structuredClone(s); invalid.phase = 'ready'; invalid.confirmed = false;
  assert.throws(() => confirm(invalid, criteria.map(c => c.id === 'durability' ? { ...c, priority: 'Hard constraint' as const } : c)), { code: 'INVALID_CRITERIA' });
  assert.match(errorMessage('INVALID_CRITERIA', 'zh'), /硬性条件/);
  assert.match(errorMessage('INVALID_CRITERIA', 'en'), /hard constraint/);
});
test('vague need: one clarification and a blocking confirmation gate', async () => {
  const s = createDemoSession(scenarios.sufficient.reviews.join('\n\n')); s.need = 'Good comfortable headphones';
  await interpret(s, demoReasoner); assert.equal(s.phase, 'clarify');
  await assert.rejects(step(s, demoReasoner), /Confirm/);
  s.need += '\nSubway and library, two-hour sessions'; s.clarifications++;
  await interpret(s, demoReasoner); assert.equal(s.phase, 'ready'); assert.equal(s.question, null);
});
test('sufficient evidence: directly finalize with verified quotes', async () => {
  const s = await setup('sufficient'); await run(s);
  assert.equal(s.phase, 'complete'); assert.equal(s.brief?.incomplete, false);
  assert.deepEqual(s.log.filter(e => e.kind === 'decision').map(e => e.label), ['FINALIZE']);
  assert.ok(s.evidence.every(e => s.reviews.find(r => r.id === e.reviewId)?.rawText.includes(e.quote)));
  const bad = { ...s.evidence[0], quote: 'A quotation that does not exist in the source.' };
  assert.throws(() => validateEvidence(s, [bad]), /citation/);
});
test('comfort conflict: investigate once, preserve adverse evidence, then result', async () => {
  const s = await setup('conflict'); await run(s);
  assert.equal(s.phase, 'complete'); assert.equal(s.conflicts[0].status, 'explained');
  assert.deepEqual(s.log.filter(e => e.kind === 'decision').map(e => e.label), ['INVESTIGATE_CONFLICT', 'FINALIZE']);
  assert.equal(s.log.filter(e => e.kind === 'tool_called' && e.label === 'investigate_conflict').length, 1);
  assert.ok(s.brief!.risks.length > 0);
});
test('office ANC is not subway evidence: request, skip, stop', async () => {
  const s = await setup('missing'); await run(s); assert.equal(s.phase, 'waiting');
  assert.equal(s.decision?.action, 'REQUEST_EVIDENCE'); assert.equal(s.decision?.targetId, 'anc');
  skipEvidence(s); await run(s); assert.equal(s.phase, 'stopped'); assert.equal(s.brief?.incomplete, true); assert.equal(s.requests, 1);
});
test('normalized repeats and low-information praise cannot satisfy critical coverage', async () => {
  const s = await setup('repetitive'); await run(s);
  assert.equal(s.reviews[0].group, s.reviews[1].group);
  assert.equal(s.assessments.find(a => a.criterionId === 'comfort')?.units, 1);
  assert.equal(s.phase, 'waiting');
  const low = createDemoSession('Great!\n\nArrived today.'); low.need = defaultNeed; low.criteria = initialCriteria(); prepare_reviews(low);
  assert.equal((await demoReasoner.extract(low)).length, 0);
});
test('additional evidence changes result while preserving confirmed criteria and bounded decisions', async () => {
  const s = await setup('missing'); await run(s); const id = s.id; const criteria = structuredClone(s.criteria);
  addEvidence(s, subwayReviews.join('\n\n')); await run(s);
  assert.equal(s.phase, 'complete'); assert.equal(s.id, id); assert.deepEqual(s.criteria, criteria);
  assert.equal(s.version, 2); assert.equal(s.requests, 1); assert.equal(s.iterations, 2);
  assert.equal(s.reviews.length, 6); assert.equal(s.brief?.incomplete, false);
  const bounded = structuredClone(s); bounded.phase = 'deciding'; bounded.iterations = 5;
  await step(bounded, { ...demoReasoner, decide: async () => { throw new Error('Must not ask the model for a sixth decision'); } });
  assert.equal(bounded.decision?.action, 'STOP_INSUFFICIENT'); assert.equal(bounded.iterations, 5);
});
test('Edit Criteria resets analysis budgets and derived state; adding evidence preserves request and decision history', async () => {
  const s = await setup('missing');
  s.reviewText += `\n\n${conflictReview}`;
  await run(s);
  assert.equal(s.phase, 'waiting');
  assert.equal(s.requests, 1);
  assert.equal(s.iterations, 2);
  const history = structuredClone(s.log);
  const decision = structuredClone(s.decision);
  const originalVersion = s.version;
  addEvidence(s, subwayReviews.join('\n\n'));
  assert.equal(s.requests, 1);
  assert.equal(s.iterations, 2);
  assert.deepEqual(s.decision, decision);
  assert.deepEqual(s.log.slice(0, history.length), history);
  assert.equal(s.version, originalVersion + 1);
  await run(s);
  assert.equal(s.phase, 'complete');
  assert.ok(s.confirmed && s.decision && s.brief);
  assert.ok(s.evidence.length && s.conflicts.length && s.assessments.length);
  const versionBeforeEdit = s.version;
  const reviewsBeforeEdit = structuredClone(s.reviews);
  const historyBeforeEdit = structuredClone(s.log);
  editCriteria(s);
  assert.equal(s.requests, 0);
  assert.equal(s.iterations, 0);
  assert.equal(s.decision, null);
  assert.deepEqual(s.evidence, []);
  assert.deepEqual(s.conflicts, []);
  assert.deepEqual(s.assessments, []);
  assert.equal(s.brief, null);
  assert.equal(s.version, versionBeforeEdit + 1);
  assert.equal(s.confirmed, false);
  assert.equal(s.phase, 'ready');
  assert.deepEqual(s.reviews, []);
  assert.deepEqual(s.log.slice(0, historyBeforeEdit.length), historyBeforeEdit);
  await assert.rejects(step(s, demoReasoner), /Confirm/);
  confirm(s, s.criteria);
  await run(s);
  assert.equal(s.phase, 'complete');
  assert.equal(s.iterations, 2);
});
