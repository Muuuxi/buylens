import type { Action, Assessment, Brief, Conflict, Criterion, Evidence, Reasoner, Session } from './types';
import { GuardRejection, human, reasoningName, reasoningType, track, trackSync } from './run';

export function createSession(reviewText = '', mode: Session['mode'] = 'live'): Session {
  return { snapshotVersion: 2, productProvided: false, id: crypto.randomUUID(), mode, phase: 'criteria', product: '', need: '', reviewText, criteria: [], confirmed: false, question: null, reviews: [], evidence: [], conflicts: [], assessments: [], log: [], run: [], version: 1, clarifications: 0, requests: 0, iterations: 0, modelRequests: 0, decision: null, brief: null, error: null, pendingTool: null };
}
export function revisePurchase(s: Session, field: 'need' | 'product' | 'reviewText', value: string): Session {
  const previousAnalysis = s.mode === 'demo' || s.criteria.length > 0 || s.confirmed || (s.run?.length ?? 0) > 0;
  const fresh = createSession();
  fresh.product = field === 'need' && previousAnalysis ? '' : s.product;
  fresh.need = field === 'product' && previousAnalysis ? '' : s.need;
  fresh.reviewText = field === 'reviewText' ? value : '';
  fresh[field] = value;
  fresh.productProvided = field === 'product' ? !!value.trim() : field === 'need' && previousAnalysis ? false : s.productProvided;
  fresh.version = previousAnalysis ? s.version + 1 : s.version;
  return fresh;
}
export function editConstraintValue(c: Criterion, value: number): Criterion {
  if (!c.constraint || !Number.isFinite(value) || value < 0) throw new Error('Enter a valid hard-constraint value.');
  const original = String(c.constraint.value).replaceAll('.', '\\.');
  const number = new RegExp(`(?<![\\d.])${original}(?![\\d.])`, 'g');
  return { ...c, label: c.label.replace(number, String(value)), context: c.context.replace(number, String(value)), constraint: { ...c.constraint, value } };
}
export function log(s: Session, kind: Session['log'][number]['kind'], label: string, detail = '') {
  s.log.push({ id: crypto.randomUUID(), kind, label, detail });
}
export function validateInput(s: Session, requireProduct = true) {
  if ((requireProduct && !s.product.trim()) || s.product.length > 200 || !s.need.trim() || s.need.length > 2000) throw new Error('Add a purchase need (up to 2,000 characters) and confirm its product context.');
  const texts = s.reviewText.trim().split(/\n\s*\n/).filter(Boolean);
  if (texts.length > 40 || s.reviewText.length > 20000 || texts.some(t => t.length > 2000)) throw new Error('Use up to 40 reviews separated by a blank line, up to 2,000 characters each and 20,000 total. Reviews may be added after criteria confirmation.');
}
export function prepare_reviews(s: Session) {
  validateInput(s);
  const groups = new Map<string, string>();
  s.reviews = s.reviewText.trim().split(/\n\s*\n/).filter(Boolean).map((text, i) => {
    const ratingMatch = text.match(/^\[rating=([1-5])\]\s*/);
    const rawText = ratingMatch ? text.slice(ratingMatch[0].length) : text;
    const normalized = rawText.toLowerCase().replace(/[\p{P}\p{Z}\s]/gu, '');
    const group = groups.get(normalized) ?? `g${i + 1}`;
    groups.set(normalized, group);
    return { id: `R${i + 1}`, rawText, group, rating: ratingMatch ? Number(ratingMatch[1]) : null };
  });
}
export function validateEvidence(s: Session, items: Omit<Evidence, 'id'>[]) {
  if (items.length > 160) throw new Error('Too many evidence items.');
  s.evidence = items.map((e, i) => {
    const r = s.reviews.find(r => r.id === e.reviewId);
    if (!r || !s.criteria.some(c => c.id === e.criterionId) || !e.quote.trim() || !r.rawText.includes(e.quote)) throw new GuardRejection('An evidence citation did not match the source review. Please retry analysis.');
    // The code enforces the confirmed duration even when a model overstates relevance.
    const criterion = s.criteria.find(c => c.id === e.criterionId)!;
    const relevance = (criterion.minutes !== null && (e.minutes === null || e.minutes < criterion.minutes)) || (criterion.requiredEnvironment && e.environment.toLowerCase() !== criterion.requiredEnvironment.toLowerCase()) || (criterion.constraint && (!e.measurement || e.measurement.unit.toLowerCase() !== criterion.constraint.unit.toLowerCase())) ? 'partial' : e.relevance;
    let polarity = e.polarity;
    if (criterion.constraint && e.measurement) {
      const numbers = e.quote.replaceAll(',', '').match(/\d+(?:\.\d+)?/g) ?? [];
      if (!numbers.some(number => Number(number) === e.measurement!.value)) throw new GuardRejection('A constraint measurement is absent from its source quote.');
      const { operator, value } = criterion.constraint;
      const matches = operator === 'lte' ? e.measurement.value <= value : operator === 'gte' ? e.measurement.value >= value : e.measurement.value === value;
      if (!matches && e.measurement.unit.toLowerCase() === criterion.constraint.unit.toLowerCase()) polarity = 'challenge';
    }
    const duplicate = s.reviews.filter(x => x.group === r.group).length > 1;
    const quality = e.repetitive && !duplicate && e.quality === 'high' ? 'medium' : e.quality;
    return { ...e, polarity, relevance, quality, id: `E${i + 1}`, repetitive: e.repetitive || duplicate };
  });
  s.conflicts = s.criteria.flatMap(c => {
    const related = s.evidence.filter(e => e.criterionId === c.id && e.quality !== 'low' && e.relevance === 'direct');
    return related.some(e => e.polarity === 'support') && related.some(e => e.polarity === 'challenge') ? [{ id: `C-${c.id}`, criterionId: c.id, evidenceIds: related.map(e => e.id), status: 'open' as const, finding: '', findingEvidenceIds: [], investigatedVersion: null }] : [];
  });
  assess(s);
}
export function assess(s: Session) {
  s.assessments = s.criteria.map(c => {
    const relevant = s.evidence.filter(e => e.criterionId === c.id && e.relevance === 'direct' && e.quality !== 'low');
    const units = new Set(relevant.map(e => s.reviews.find(r => r.id === e.reviewId)!.group)).size;
    const conflict = s.conflicts.find(x => x.criterionId === c.id && x.status !== 'explained');
    const enough = units >= 2 && relevant.some(e => e.quality === 'high');
    const coverage: Assessment['coverage'] = !enough ? 'insufficient' : conflict ? 'mixed' : 'adequate';
    const confidence: Assessment['confidence'] = coverage !== 'adequate' ? 'low' : relevant.filter(e => e.quality === 'high').length >= 2 && !relevant.some(e => e.ratingContradiction || e.repetitive) ? 'high' : 'medium';
    return { criterionId: c.id, coverage, units, confidence, reason: coverage === 'insufficient' ? 'Not enough distinct, context-matched usage evidence.' : coverage === 'mixed' ? 'Relevant experiences conflict and remain unexplained.' : 'At least two distinct, relevant usage accounts; personal fit is still not guaranteed.' };
  });
}
export function criticalGaps(s: Session) { return s.assessments.filter(a => a.coverage !== 'adequate' && ['Critical', 'Hard constraint'].includes(s.criteria.find(c => c.id === a.criterionId)?.priority ?? '')); }
export function allowedActions(s: Session): Action[] {
  if (s.iterations >= 5) return ['STOP_INSUFFICIENT'];
  const actions: Action[] = [];
  if (s.conflicts.some(c => c.status === 'open' && c.investigatedVersion !== s.version)) actions.push('INVESTIGATE_CONFLICT');
  if (criticalGaps(s).length) {
    if (s.requests < 1) actions.push('REQUEST_EVIDENCE');
    actions.push('STOP_INSUFFICIENT');
  } else actions.push('FINALIZE');
  return actions;
}
export function templateBrief(s: Session, incomplete: boolean): Brief {
  const item = (e: Evidence) => ({ text: e.quote, evidenceIds: [e.id] });
  return {
    fits: s.evidence.filter(e => e.polarity === 'support' && e.relevance === 'direct' && e.quality !== 'low' && !criticalGaps(s).some(a => a.criterionId === e.criterionId)).slice(0, 4).map(item),
    risks: s.evidence.filter(e => e.polarity === 'challenge' && e.quality !== 'low').map(item),
    beforeBuying: ['Test the product against your confirmed criteria in your actual usage context.', 'Confirm current specifications, hard constraints and the return policy before buying.'],
    incomplete,
  };
}
export function validateBrief(s: Session, b: Brief, incomplete: boolean) {
  for (const item of [...b.fits, ...b.risks]) {
    if (!item.evidenceIds.length || item.evidenceIds.some(id => !s.evidence.some(e => e.id === id))) throw new Error('The brief contains an unverified evidence reference.');
  }
  if (b.incomplete !== incomplete) throw new Error('The brief does not match the evidence sufficiency state.');
  if (b.fits.some(item => item.evidenceIds.some(id => criticalGaps(s).some(a => a.criterionId === s.evidence.find(e => e.id === id)?.criterionId)))) throw new Error('A fit claim relies on an unresolved critical criterion.');
  if (b.fits.some(item => item.evidenceIds.some(id => { const e = s.evidence.find(e => e.id === id)!; return e.polarity !== 'support' || e.relevance !== 'direct' || e.quality === 'low'; }))) throw new Error('A fit claim must use direct, informative supporting evidence.');
  const riskIds = new Set(b.risks.flatMap(item => item.evidenceIds));
  if (s.evidence.some(e => e.polarity === 'challenge' && e.quality !== 'low' && !riskIds.has(e.id))) throw new Error('The brief omitted an adverse usage account. Retry with the risks preserved.');
}
export async function extract_evidence(s: Session, r: Reasoner) {
  if (!s.reviews.length) {
    trackSync(s, 'No supplied review evidence', 'CONTROLLER', () => validateEvidence(s, []), () => 'No reviews supplied; all criteria remain unverified.');
    return;
  }
  const items = await track(s, reasoningName(s, 'Extract structured evidence'), reasoningType(s), () => r.extract(s), value => `${value.length} candidate evidence items`);
  trackSync(s, 'Verify citations and relevance', 'CONTROLLER', () => validateEvidence(s, items), () => `${s.evidence.length} exact source citations accepted`);
}
export async function investigate_conflict(s: Session, r: Reasoner) {
  const conflict = s.conflicts.find(c => c.id === s.decision?.targetId);
  if (!conflict || conflict.status !== 'open' || conflict.investigatedVersion === s.version) throw new Error('This conflict is unavailable or already investigated for this version.');
  const result = await track(s, reasoningName(s, 'Compare conflict contexts'), reasoningType(s), () => r.investigate(s, conflict), value => value.finding);
  trackSync(s, 'Validate conflict finding', 'CONTROLLER', () => {
  if (!result.evidenceIds.length || result.evidenceIds.some(id => !conflict.evidenceIds.includes(id))) throw new GuardRejection('The conflict explanation has invalid evidence references.');
  const cited = s.evidence.filter(e => result.evidenceIds.includes(e.id));
  const observedDifference = cited.filter(e => e.polarity === 'support').some(a => cited.filter(e => e.polarity === 'challenge').some(b =>
    (a.glasses !== null && b.glasses !== null && a.glasses !== b.glasses) ||
    (a.minutes !== null && b.minutes !== null && a.minutes !== b.minutes) ||
    (a.environment !== 'unknown' && b.environment !== 'unknown' && a.environment !== b.environment) ||
    (a.measurement && b.measurement && a.measurement.unit === b.measurement.unit && a.measurement.value !== b.measurement.value) || a.quality !== b.quality));
  if (result.explained && !observedDifference) throw new GuardRejection('The conflict explanation lacks an observed context difference between supporting and challenging evidence.');
  conflict.status = result.explained ? 'explained' : 'unresolved';
  conflict.finding = result.finding; conflict.findingEvidenceIds = result.evidenceIds; conflict.investigatedVersion = s.version;
  assess(s);
  }, () => conflict.status === 'explained' ? 'Observed context difference accepted; adverse evidence retained' : 'Conflict remains unresolved');
}
export async function compose_brief(s: Session, r: Reasoner, incomplete: boolean) {
  const brief = await track(s, reasoningName(s, 'Write structured brief'), reasoningType(s), () => r.compose(s, incomplete), () => incomplete ? 'Incomplete brief proposed' : 'Brief with caveats proposed');
  trackSync(s, 'Validate brief evidence', 'CONTROLLER', () => {
    try { validateBrief(s, brief, incomplete); }
    catch (error) { throw new GuardRejection(error instanceof Error ? error.message : 'Brief rejected'); }
  }, () => 'Verified references and critical coverage; adverse evidence retained');
  s.brief = brief;
}
export async function interpret(s: Session, r: Reasoner) {
  validateInput(s, false);
  const result = await track(s, reasoningName(s, 'Understand criteria'), reasoningType(s), () => r.interpret(s.need, s.clarifications >= 1, s.productProvided === false ? '' : s.product), value => value.question ? 'One clarification requested' : `${value.criteria.filter(c => ['Critical', 'Hard constraint'].includes(c.priority)).length} critical criteria identified`);
  if (result.product) s.product = result.product;
  s.criteria = result.criteria;
  s.question = s.clarifications >= 1 ? null : result.question;
  s.confirmed = false;
  s.phase = s.question ? 'clarify' : 'ready';
  log(s, 'user_action', 'Buying needs interpreted', s.question ?? 'Review and confirm your criteria.');
}
export function confirm(s: Session, criteria: Criterion[]) {
  if (!['ready', 'clarify'].includes(s.phase) || !s.product.trim() || criteria.length < 1 || criteria.length > 8 || !criteria.some(c => ['Critical', 'Hard constraint'].includes(c.priority)) || new Set(criteria.map(c => c.id)).size !== criteria.length || criteria.some(c => !/^[a-z][a-z0-9_]*$/.test(c.id) || !c.context.trim() || c.context.length > 500 || (c.priority === 'Hard constraint' && !c.constraint) || (c.constraint && (!Number.isFinite(c.constraint.value) || c.constraint.value < 0 || !c.constraint.unit.trim())) || (c.minutes !== null && (!Number.isInteger(c.minutes) || c.minutes < 1 || c.minutes > 10080)))) throw new Error('Review the criteria and product context; keep a critical criterion or explicit hard constraint.');
  s.criteria = criteria; s.confirmed = true; s.question = null; s.phase = 'preparing';
  log(s, 'user_action', 'Criteria confirmed', criteria.map(c => `${c.label}: ${c.priority}`).join('; '));
  human(s, 'Confirm criteria', `${criteria.length} buying criteria confirmed`);
}
export function addEvidence(s: Session, text: string) {
  if (s.phase !== 'waiting' || !text.trim()) throw new Error('Add review evidence while the agent is waiting.');
  const next = s.reviewText + '\n\n' + text.trim();
  validateInput({ ...s, reviewText: next });
  s.reviewText = next; s.version++; s.brief = null; s.phase = 'preparing';
  log(s, 'user_action', 'Additional reviews added', 'Reanalyze all reviews using the confirmed criteria.');
  human(s, 'Add review evidence', 'New input version; request and decision history preserved');
}
export function skipEvidence(s: Session) {
  if (s.phase !== 'waiting') throw new Error('No evidence request is pending.');
  s.phase = 'deciding'; log(s, 'user_action', 'Evidence request skipped', 'Keep the missing evidence unknown.');
  human(s, 'Skip additional evidence', 'Critical gaps remain unknown');
}
export function editCriteria(s: Session) {
  s.confirmed = false; s.phase = 'ready'; s.reviews = []; s.evidence = []; s.conflicts = []; s.assessments = []; s.brief = null;
  s.version++; s.requests = 0; s.iterations = 0; s.decision = null; delete s.modelCall;
  log(s, 'user_action', 'Criteria reopened', 'Previous evidence and brief invalidated. Confirm again to analyze.');
  human(s, 'Edit criteria', 'Fresh analysis version; budgets and derived state reset');
}
export async function step(s: Session, r: Reasoner) {
  if (!s.confirmed) throw new Error('Confirm your buying criteria before analysis.');
  s.error = null;
  const call = async (name: string, fn: () => Promise<void> | void) => {
    s.pendingTool = name;
    log(s, 'tool_called', name, `Input version ${s.version}`);
    const names: Record<string, string> = { prepare_reviews: 'Prepare reviews', extract_evidence: 'Extract evidence', investigate_conflict: 'Investigate conflict', compose_brief: 'Compose brief' };
    await track(s, names[name], 'TOOL', fn, () => name === 'prepare_reviews' ? `${s.reviews.length} reviews normalized` : name === 'extract_evidence' ? `${s.evidence.length} evidence items extracted and verified` : name === 'investigate_conflict' ? s.conflicts.find(c => c.id === s.decision?.targetId)?.finding ?? 'Investigation completed' : s.brief?.incomplete ? 'Incomplete brief with unknowns' : 'Decision brief ready');
    log(s, 'tool_result', name, name === 'extract_evidence' ? `${s.evidence.length} cited evidence items` : 'Completed');
    s.pendingTool = null;
  };
  switch (s.phase) {
    case 'preparing': await call('prepare_reviews', () => prepare_reviews(s)); s.phase = 'extracting'; break;
    case 'extracting': await call('extract_evidence', () => extract_evidence(s, r)); s.phase = 'deciding'; break;
    case 'deciding': {
      const allowed = allowedActions(s);
      const atLimit = s.iterations >= 5;
      if (!atLimit) s.iterations++;
      const d = atLimit ? trackSync(s, 'Decision limit', 'CONTROLLER', () => ({ action: 'STOP_INSUFFICIENT' as const, targetId: null, reason: 'Controller stop: the five-decision limit was reached. No further autonomous analysis will run.' }), value => value.reason) : await track(s, reasoningName(s, s.iterations === 1 ? 'Choose next action' : 'Re-evaluate state'), reasoningType(s), () => r.decide(s, allowed), value => `${value.action}: ${value.reason}`);
      trackSync(s, 'Controller validation', 'CONTROLLER', () => {
        if (!allowed.includes(d.action)) throw new GuardRejection('The model chose an action that is not allowed by the current evidence.');
        if (d.action === 'INVESTIGATE_CONFLICT' && !s.conflicts.some(c => c.id === d.targetId && c.status === 'open' && c.investigatedVersion !== s.version)) throw new GuardRejection('The investigation target is invalid or already investigated.');
        if (d.action === 'REQUEST_EVIDENCE' && !criticalGaps(s).some(a => a.criterionId === d.targetId)) throw new GuardRejection('The evidence request does not target a critical gap.');
      }, () => `${d.action} allowed by current evidence and limits`);
      s.decision = d; log(s, 'decision', d.action, d.reason);
      if (d.action === 'INVESTIGATE_CONFLICT') s.phase = 'investigating';
      else if (d.action === 'REQUEST_EVIDENCE') { s.requests++; s.phase = 'waiting'; }
      else s.phase = 'composing';
      break;
    }
    case 'investigating': await call('investigate_conflict', () => investigate_conflict(s, r)); s.phase = 'deciding'; break;
    case 'composing': {
      const incomplete = s.decision?.action === 'STOP_INSUFFICIENT' || criticalGaps(s).length > 0;
      await call('compose_brief', () => compose_brief(s, r, incomplete));
      s.phase = incomplete ? 'stopped' : 'complete'; break;
    }
    default: throw new Error('This task is waiting for a user action or has already finished.');
  }
}
