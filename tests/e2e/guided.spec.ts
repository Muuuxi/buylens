import { expect, test, type Page } from '@playwright/test';
import { createSession } from '../../src/lib/agent';
import { guidedClarification, guidedNeed, guidedReviews } from '../../src/lib/guided-examples';
import type { Criterion, Session } from '../../src/lib/types';

const criterion: Criterion = { id: 'durability', label: 'Durability', priority: 'Critical', context: 'Short trips', minutes: null, requiredEnvironment: null, constraint: null };
type Sent = { action: string; [key: string]: unknown };

async function mockLive(page: Page, initial: Session | null = null) {
  let session = initial;
  const sent: Sent[] = [];
  await page.route('**/api/config', route => route.fulfill({ json: { live: true, persistence: true } }));
  await page.route('**/api/session', route => {
    const request = route.request();
    if (request.method() === 'GET') return route.fulfill({ json: { session } });
    if (request.method() === 'DELETE') { session = null; return route.fulfill({ json: { ok: true } }); }
    const body = request.postDataJSON() as Sent;
    sent.push(body);
    if (body.action === 'create') {
      if (!String(body.need).trim()) return route.fulfill({ status: 503, json: { code: 'INVALID_INPUT', error: 'Need required.' } });
      session = createSession(String(body.reviewText), 'live');
      session.need = String(body.need); session.product = String(body.product);
    } else if (body.action === 'interpret' && session) {
      session.product = 'Carry-on suitcase'; session.criteria = [criterion]; session.phase = 'ready';
    } else if (body.action === 'clarify' && session) {
      session.need += `\n${String(body.answer)}`; session.criteria = [criterion]; session.phase = 'ready';
    } else if (body.action === 'add' && session) {
      session.reviewText += `\n\n${String(body.text)}`; session.phase = 'waiting';
    }
    return route.fulfill({ json: { session } });
  });
  return sent;
}

function waiting(need: string, product = 'Carry-on suitcase') {
  const session = createSession('', 'live');
  session.product = product; session.need = need; session.phase = 'waiting'; session.confirmed = true;
  session.criteria = [criterion]; session.requests = 1;
  session.decision = { action: 'REQUEST_EVIDENCE', targetId: 'durability', reason: 'More review evidence is needed.' };
  session.assessments = [{ criterionId: 'durability', coverage: 'insufficient', units: 0, confidence: 'low', reason: 'No reviews.' }];
  return session;
}

test('Interpret waits for live configuration before an immediate click can start', async ({ page }) => {
  let finishConfig = () => {};
  let configRequested = false;
  await page.route('**/api/config', route => new Promise<void>(resolve => {
    configRequested = true;
    finishConfig = () => { void route.fulfill({ json: { live: true, persistence: true } }).then(resolve); };
  }));
  await page.goto('/');
  const interpret = page.getByRole('button', { name: 'Interpret my needs' });
  await expect.poll(() => configRequested).toBe(true);
  await expect(interpret).toBeDisabled();
  finishConfig();
  await expect(interpret).toBeEnabled();
});

test('untouched English need is visual only until Interpret starts the live task', async ({ page }) => {
  const sent = await mockLive(page);
  await page.goto('/');
  await expect(page.locator('#need')).toHaveValue('');
  await expect(page.locator('#need')).toHaveAttribute('placeholder', guidedNeed.en);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('buylens-normal-v2')!).need)).toBe('');
  await page.getByRole('button', { name: 'Interpret my needs' }).click();
  await expect(page.getByRole('heading', { name: 'Your buying criteria' })).toBeVisible();
  expect(sent.find(item => item.action === 'create')?.need).toBe(guidedNeed.en);
  expect(sent.some(item => item.action === 'interpret')).toBe(true);
  await expect(page.locator('#need')).toHaveValue(guidedNeed.en);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('buylens-normal-v2')!).mode)).toBe('live');
});

test('focus and custom edit remove the need ghost; no example is submitted or restored on refresh', async ({ page }) => {
  const sent = await mockLive(page);
  await page.goto('/');
  await page.locator('#need').focus();
  await expect(page.locator('#need')).toHaveAttribute('placeholder', '');
  await page.reload();
  await expect(page.locator('#need')).toHaveAttribute('placeholder', '');
  await page.getByRole('button', { name: 'Interpret my needs' }).click();
  await expect(page.locator('.error[role="alert"]')).toContainText('Check your purchase need');
  expect(sent.find(item => item.action === 'create')?.need).toBe('');
  await page.locator('#need').fill('I need an adjustable office chair for long workdays.');
  await page.getByRole('button', { name: 'Interpret my needs' }).click();
  await expect(page.getByRole('heading', { name: 'Your buying criteria' })).toBeVisible();
  expect(sent.filter(item => item.action === 'create').at(-1)?.need).toBe('I need an adjustable office chair for long workdays.');
  expect(JSON.stringify(sent)).not.toContain('smooth wheels');
});

test('Chinese need and clarification ghosts stay out of state until their own action', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('buylens-language', 'zh'));
  const sent = await mockLive(page);
  await page.goto('/');
  await expect(page.locator('#need')).toHaveAttribute('placeholder', guidedNeed.zh);
  await expect(page.locator('#need')).toHaveValue('');
  await page.getByRole('button', { name: '解读我的需求' }).click();
  await expect(page.getByRole('heading', { name: '你的购买标准' })).toBeVisible();
  expect(sent.find(item => item.action === 'create')?.need).toBe(guidedNeed.zh);
});

test('untouched clarification uses generic guidance', async ({ page }) => {
  const session = createSession('', 'live'); session.need = 'I need a desk chair.'; session.product = 'Desk chair'; session.phase = 'clarify'; session.question = 'Which feature matters most?';
  const sent = await mockLive(page, session);
  await page.goto('/');
  await expect(page.locator('#clarify')).toHaveAttribute('placeholder', guidedClarification.en);
  await expect(page.locator('#clarify')).toHaveValue('');
  await page.getByRole('button', { name: 'Update criteria' }).click();
  expect(sent.find(item => item.action === 'clarify')?.answer).toBe(guidedClarification.en);
});

test('focused clarification submits only the user answer', async ({ page }) => {
  const session = createSession('', 'live'); session.need = 'I need a desk chair.'; session.product = 'Desk chair'; session.phase = 'clarify'; session.question = 'Which feature matters most?';
  const sent = await mockLive(page, session);
  await page.goto('/');
  await page.locator('#clarify').focus();
  await expect(page.locator('#clarify')).toHaveAttribute('placeholder', '');
  await expect(page.getByRole('button', { name: 'Update criteria' })).toBeDisabled();
  await page.locator('#clarify').fill('Lumbar support matters most.');
  await page.getByRole('button', { name: 'Update criteria' }).click();
  expect(sent.filter(item => item.action === 'clarify').at(-1)?.answer).toBe('Lumbar support matters most.');
});

test('untouched guided evidence submits prepared synthetic reviews', async ({ page }) => {
  const sent = await mockLive(page, waiting(guidedNeed.en));
  await page.goto('/');
  await page.getByRole('button', { name: '2 Evidence workspace' }).click();
  await expect(page.locator('#additional')).toHaveValue('');
  await expect(page.locator('#additional')).toHaveAttribute('placeholder', guidedReviews.en);
  await expect(page.locator('#guided-review-note')).toContainText('synthetic reviews');
  await page.getByRole('button', { name: 'Add & reanalyze' }).click();
  expect(sent.find(item => item.action === 'add')?.text).toBe(guidedReviews.en);
});

test('focused guided evidence submits only user text', async ({ page }) => {
  const sent = await mockLive(page, waiting(guidedNeed.en));
  await page.goto('/');
  await page.locator('.steps button').nth(1).click();
  await page.locator('#additional').focus();
  await expect(page.locator('#additional')).toHaveAttribute('placeholder', '');
  await expect(page.getByRole('button', { name: 'Add & reanalyze' })).toBeDisabled();
  await page.locator('#additional').fill('My own carry-on review from a weekend trip.');
  await page.getByRole('button', { name: 'Add & reanalyze' }).click();
  expect(sent.filter(item => item.action === 'add').at(-1)?.text).toBe('My own carry-on review from a weekend trip.');
});

test('Chinese review ghost is localized; unrelated products never inherit carry-on reviews', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('buylens-language', 'zh'));
  await mockLive(page, waiting(guidedNeed.zh, '登机箱'));
  await page.goto('/');
  await page.locator('.steps button').nth(1).click();
  await expect(page.locator('#additional')).toHaveAttribute('placeholder', guidedReviews.zh);
  await expect(page.locator('#guided-review-note')).toContainText('预置合成评论');
  await page.getByRole('button', { name: '新购买需求' }).click();
  await page.locator('#need').fill('我需要一把可调节的办公椅。');
  await expect(page.locator('#need')).toHaveValue('我需要一把可调节的办公椅。');
  expect(await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('buylens-normal-v2')!)))).not.toContain('登机箱');
});
