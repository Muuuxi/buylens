import { test, expect, type APIRequestContext } from '@playwright/test';
import dataset from '../data/live-headphones-synthetic.json';
import type { Session } from '../../src/lib/types';

const baseUrl = process.env.BUYLENS_BASE_URL ?? 'http://127.0.0.1:3000';
const origin = new URL(baseUrl).origin;

test.describe('REAL live agent — credentials required; never replaced with fixtures', () => {
  test.setTimeout(240000);
  test.beforeEach(async ({ request }) => {
    const config = await (await request.get('/api/config')).json();
    test.skip(!config.live || !config.persistence, 'NOT RUN: OPENAI_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  });
  const reviewText = (ids?: string[]) => dataset.reviews.filter(r => !ids || ids.includes(r.validationId)).map(r => `[rating=${r.rating}] ${r.text}`).join('\n\n');
  const missing = dataset.reviews.filter(r => !['L04', 'L10'].includes(r.validationId)).map(r => r.validationId);
  async function command(request: APIRequestContext, action: string, payload = {}): Promise<Session> {
    const response = await request.post(new URL('/api/session', baseUrl).toString(), { headers: { Origin: origin }, data: { action, ...payload } });
    const result = await response.json();
    expect(response.ok(), result.error ?? `HTTP ${response.status()}`).toBeTruthy();
    return result.session;
  }
  async function start(request: APIRequestContext, reviews: string) {
    await command(request, 'create', { mode: 'live', product: dataset.product, need: dataset.need, reviewText: reviews });
    let s = await command(request, 'interpret');
    if (s.phase === 'clarify') s = await command(request, 'clarify', { answer: 'Three hours continuously in the library; underground train rumble on the daily commute.' });
    expect(s.criteria.find(c => c.id === 'comfort')?.minutes).toBe(180);
    return command(request, 'confirm', { criteria: s.criteria });
  }
  async function run(request: APIRequestContext, session: Session) {
    let s = session;
    for (let i = 0; i < 20 && !['waiting', 'complete', 'stopped'].includes(s.phase); i++) s = await command(request, 'step');
    expect(['waiting', 'complete', 'stopped']).toContain(s.phase);
    expect(s.iterations).toBeLessThanOrEqual(5);
    expect(s.requests).toBeLessThanOrEqual(1);
    for (const e of s.evidence) expect(s.reviews.find(r => r.id === e.reviewId)?.rawText).toContain(e.quote);
    return s;
  }
  test('unseen synthetic data: extraction, conflict, native action call, permitted FINALIZE, Supabase refresh', async ({ page }) => {
    const request = page.request;
    let s = await start(request, reviewText());
    s = await command(request, 'step'); s = await command(request, 'step');
    expect(s.evidence.some(e => e.reviewId === 'R3' && e.polarity === 'challenge' && e.ratingContradiction)).toBeTruthy();
    expect(s.evidence.some(e => ['R4', 'R10'].includes(e.reviewId) && e.criterionId === 'anc' && e.environment === 'subway' && e.relevance === 'direct')).toBeTruthy();
    const officeEvidence = s.evidence.filter(e => e.reviewId === 'R5' && e.criterionId === 'anc');
    expect(officeEvidence.length).toBeGreaterThan(0);
    expect(officeEvidence.every(e => e.environment === 'office' && e.relevance === 'partial')).toBeTruthy();
    expect(s.evidence.filter(e => e.reviewId === 'R6').every(e => e.quality === 'low')).toBeTruthy();
    expect(s.evidence.filter(e => ['R7', 'R8'].includes(e.reviewId)).every(e => e.repetitive && e.quality !== 'high')).toBeTruthy();
    expect(s.conflicts.some(c => c.criterionId === 'comfort')).toBeTruthy();
    s = await command(request, 'step'); expect(s.decision?.action).toBe('INVESTIGATE_CONFLICT');
    expect(s.modelCall?.function.name).toBe('INVESTIGATE_CONFLICT');
    s = await run(request, s);
    expect(s.decision?.action).toBe('FINALIZE'); expect(s.phase).toBe('complete'); expect(s.brief?.incomplete).toBe(false);
    expect(s.run?.some(x => x.type === 'MODEL' && x.status === 'COMPLETED')).toBeTruthy();
    const snapshot = structuredClone(s);
    await page.goto('/'); await expect(page.getByText('Your need is interpreted by the live model; the session is saved with Supabase.', { exact: true })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: '2 Evidence workspace' }).click();
    await expect(page.getByText('Evidence, in your context.', { exact: true })).toBeVisible();
    const restored = (await (await request.get('/api/session')).json()).session as Session;
    for (const field of ['criteria', 'evidence', 'decision', 'log', 'run', 'brief'] as const) expect(restored[field]).toEqual(snapshot[field]);
    await page.locator('details.agent-run summary').click(); await expect(page.locator('details.agent-run')).toContainText('MODEL');
    await page.locator('details.activity summary').click(); await expect(page.locator('details.activity')).toContainText('finalize');
  });
  test('missing subway evidence: request → human skip → STOP_INSUFFICIENT', async ({ request }) => {
    let s = await run(request, await start(request, reviewText(missing)));
    expect(s.decision?.action).toBe('REQUEST_EVIDENCE'); expect(s.decision?.targetId).toBe('anc'); expect(s.brief).toBeNull();
    s = await command(request, 'skip'); s = await run(request, s);
    expect(s.decision?.action).toBe('STOP_INSUFFICIENT'); expect(s.phase).toBe('stopped'); expect(s.brief?.incomplete).toBe(true);
    expect(s.brief?.fits.some(item => item.evidenceIds.some(id => s.evidence.find(e => e.id === id)?.criterionId === 'anc'))).toBe(false);
  });
  test('additional new subway evidence changes outcome without resetting history', async ({ request }) => {
    let s = await run(request, await start(request, reviewText(missing)));
    expect(s.phase).toBe('waiting'); const prior = structuredClone(s);
    s = await command(request, 'add', { text: reviewText(['L04', 'L10']) });
    expect(s.requests).toBe(prior.requests); expect(s.iterations).toBe(prior.iterations); expect(s.decision).toEqual(prior.decision); expect(s.version).toBe(prior.version + 1);
    expect(s.log.slice(0, prior.log.length)).toEqual(prior.log);
    s = await run(request, s); expect(s.phase).toBe('complete'); expect(s.decision?.action).toBe('FINALIZE');
    expect(s.assessments.filter(a => s.criteria.find(c => c.id === a.criterionId)?.priority === 'Critical').every(a => a.coverage === 'adequate')).toBeTruthy();
  });
});
