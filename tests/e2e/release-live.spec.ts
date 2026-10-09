import { expect, test, type Page } from '@playwright/test';
import { commandSchema } from '../../src/lib/schemas';
import type { Session } from '../../src/lib/types';

const en = process.env.BUYLENS_EN_URL;
const zh = process.env.BUYLENS_ZH_URL;
const leakage = /Demo-H1|headphones?|\bANC\b|subway/i;

async function saved(page: Page): Promise<Session> {
  const response = await page.request.get(new URL('/api/session', page.url()).toString());
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { session: Session }).session;
}

async function interpret(page: Page, url: string, need: string, language: 'en' | 'zh') {
  await page.addInitScript((locale: string) => localStorage.setItem('buylens-language', locale), language);
  await page.goto(url);
  const config = await (await page.request.get(new URL('/api/config', url).toString())).json();
  expect(config).toEqual({ live: true, persistence: true });
  await page.locator('#need').fill(need);
  const pending = page.waitForResponse(r => r.url().endsWith('/api/session') && r.request().postDataJSON()?.action === 'interpret');
  await page.getByRole('button', { name: language === 'zh' ? '解读我的需求' : 'Interpret my needs' }).click();
  const response = await pending;
  const body = await response.json();
  expect(response.ok(), body.error).toBe(true);
  const s = body.session as Session;
  expect(s.mode).toBe('live'); expect(s.phase).toBe('ready'); expect(s.product.trim()).toBeTruthy();
  expect(s.criteria.length).toBeGreaterThan(0);
  expect(s.run?.some(step => step.type === 'MODEL' && step.name === 'Understand criteria' && step.status === 'COMPLETED')).toBe(true);
  expect(`${s.product} ${JSON.stringify(s.criteria)}`).not.toMatch(leakage);
  return s;
}

async function rejectInvalidThenConfirm(page: Page, criteria: Session['criteria'], language: 'en' | 'zh') {
  const index = criteria.findIndex(c => !c.constraint);
  expect(index).toBeGreaterThanOrEqual(0);
  const priority = page.locator('.criterion-edit select').nth(index);
  expect(await priority.locator('option').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value))).toEqual(['Critical', 'Medium', 'Low', 'Hard constraint']);
  await expect(priority.locator('option[value="Hard constraint"]')).toBeDisabled();
  let invalidPayload: Record<string, unknown> | null = null;
  const corrupt = async (route: import('@playwright/test').Route) => {
    const payload = route.request().postDataJSON();
    if (payload?.action !== 'confirm') return route.continue();
    invalidPayload = { ...payload, criteria: payload.criteria.map((c: Session['criteria'][number], i: number) => i === index ? { ...c, priority: 'Hard constraint' } : c) };
    return route.continue({ postData: JSON.stringify(invalidPayload) });
  };
  await page.route('**/api/session', corrupt);
  const invalidPending = page.waitForResponse(r => r.url().endsWith('/api/session') && r.request().postDataJSON()?.action === 'confirm');
  await page.getByRole('button', { name: language === 'zh' ? '确认并分析评论' : 'Confirm & analyze reviews' }).click();
  const invalid = await invalidPending;
  expect(commandSchema.safeParse(invalidPayload).success).toBe(true);
  expect(invalid.status()).toBe(422);
  expect((await invalid.json()).code).toBe('INVALID_CRITERIA');
  await expect(page.locator('.error[role="alert"]')).toContainText(language === 'zh' ? '请检查购买标准' : 'Review your criteria');
  await expect(page.locator('.error[role="alert"]')).not.toContainText('Review the criteria');
  await page.unroute('**/api/session', corrupt);
  const pending = page.waitForResponse(r => r.url().endsWith('/api/session') && r.request().postDataJSON()?.action === 'confirm');
  await page.getByRole('button', { name: language === 'zh' ? '确认并分析评论' : 'Confirm & analyze reviews' }).click();
  const response = await pending;
  const payload = response.request().postDataJSON();
  const parsed = commandSchema.parse(payload);
  expect(parsed.action).toBe('confirm');
  if (parsed.action !== 'confirm') throw new Error('Unexpected command');
  expect(parsed.criteria).toEqual(criteria);
  const body = await response.json();
  expect(response.ok(), body.error).toBe(true);
  expect(body.session.confirmed).toBe(true);
  expect(body.session.criteria).toEqual(criteria);
  await expect(page.locator('.workspace-product')).toBeVisible();
}

test.describe('production live release matrix', () => {
  test.setTimeout(240000);

  test('English office chair: confirm, request, add evidence, exact citations, permitted brief, refresh', async ({ page }) => {
    test.skip(!en || !zh, 'Set both production URLs for paid live release validation.');
    const need = 'I need an office chair for eight-hour desk days. Lumbar support and adjustability are critical to me.';
    const first = await interpret(page, en!, need, 'en');
    expect(first.product).toMatch(/chair/i);
    await rejectInvalidThenConfirm(page, first.criteria, 'en');
    await expect(page.getByRole('heading', { name: 'Can you add relevant evidence?' })).toBeVisible({ timeout: 90000 });
    const waiting = await saved(page);
    expect(waiting.decision?.action).toBe('REQUEST_EVIDENCE');
    expect(waiting.evidence).toEqual([]); expect(waiting.reviewText).toBe('');
    await page.reload();
    await expect(page.locator('#need')).toHaveValue(need);
    expect((await saved(page)).criteria).toEqual(first.criteria);
    await page.getByRole('button', { name: '2 Evidence workspace' }).click();
    const reviews = [
      'I have used this office chair for eight-hour desk days for seven months. Its adjustable lumbar support stays against my lower back, and I can change the seat height and armrests to fit my desk. My back still feels supported at the end of work.',
      'After ten months of eight-hour workdays, this office chair still gives steady lower-back support. The lumbar pad and seat height adjust easily, and the armrests have held their position through daily use.',
      'I work in this office chair for about eight hours every weekday. Six months in, the adjustable lumbar cushion supports my lower back throughout the day; adjusting the seat and armrests is smooth and the mechanisms still function.',
    ].join('\n\n');
    await page.getByLabel('Additional reviews').fill(reviews);
    await page.getByRole('button', { name: 'Add & reanalyze' }).click();
    await expect(page.getByRole('button', { name: 'Read decision brief' })).toBeVisible({ timeout: 150000 });
    const final = await saved(page);
    expect(final.mode).toBe('live'); expect(final.decision?.action).toBe('FINALIZE');
    expect(final.brief?.incomplete).toBe(false); expect(final.requests).toBe(waiting.requests);
    expect(final.evidence.length).toBeGreaterThan(0);
    for (const evidence of final.evidence) expect(final.reviews.find(r => r.id === evidence.reviewId)?.rawText).toContain(evidence.quote);
    expect(final.run?.some(step => step.type === 'MODEL' && step.name === 'Extract structured evidence' && step.status === 'COMPLETED')).toBe(true);
    expect(final.run?.some(step => step.type === 'MODEL' && step.name.includes('brief') && step.status === 'COMPLETED')).toBe(true);
    expect(`${final.product} ${JSON.stringify(final.criteria)} ${JSON.stringify(final.evidence)}`).not.toMatch(leakage);
    await page.getByRole('button', { name: 'Read decision brief' }).click();
    await expect(page.getByRole('heading', { name: 'Your decision brief.' })).toBeVisible();
  });

  test('Chinese carry-on: exact need, canonical criteria, confirm, request, refresh, localized controller error', async ({ page }) => {
    test.skip(!en || !zh, 'Set both production URLs for paid live release validation.');
    const need = '我想买一个适合短途旅行的轻便登机箱，预算200美元以内，最在意耐用和轮子顺滑。';
    const first = await interpret(page, zh!, need, 'zh');
    expect(first.product).toMatch(/登机箱|行李箱/);
    expect(first.criteria.some(c => c.priority === 'Hard constraint' && c.constraint?.value === 200 && c.constraint.operator === 'lte')).toBe(true);
    expect(first.criteria.filter(c => c.priority === 'Critical').length).toBeGreaterThanOrEqual(2);
    await rejectInvalidThenConfirm(page, first.criteria, 'zh');
    await expect(page.getByRole('heading', { name: '能补充相关证据吗？' })).toBeVisible({ timeout: 90000 });
    const waiting = await saved(page);
    expect(waiting.decision?.action).toBe('REQUEST_EVIDENCE');
    await page.reload();
    await expect(page.locator('#need')).toHaveValue(need);
    const restored = await saved(page);
    expect(restored.id).toBe(waiting.id); expect(restored.criteria).toEqual(first.criteria);
    expect(`${restored.product} ${JSON.stringify(restored.criteria)}`).not.toMatch(leakage);
  });

  test('Chinese air fryer: confirm, request, skip, stop insufficient', async ({ page }) => {
    test.skip(!en || !zh, 'Set both production URLs for paid live release validation.');
    const first = await interpret(page, zh!, '我想买一台适合小公寓、容易清洗的空气炸锅。清洁方便和占地小是最重要的，没有指定预算。', 'zh');
    expect(first.product).toMatch(/空气炸锅/);
    await rejectInvalidThenConfirm(page, first.criteria, 'zh');
    await expect(page.getByRole('heading', { name: '能补充相关证据吗？' })).toBeVisible({ timeout: 90000 });
    await page.getByRole('button', { name: '跳过并保留未知项' }).click();
    await expect(page.getByRole('button', { name: '阅读决策简报' })).toBeVisible({ timeout: 90000 });
    const stopped = await saved(page);
    expect(stopped.decision?.action).toBe('STOP_INSUFFICIENT');
    expect(stopped.brief?.incomplete).toBe(true);
    expect(`${stopped.product} ${JSON.stringify(stopped.criteria)}`).not.toMatch(leakage);
  });
});
