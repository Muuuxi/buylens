import { test, expect, type Page } from '@playwright/test';

const state = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('buylens-demo-v1')!));

test('language toggle preserves analysis, exact citations, Markdown and refresh/evaluation locale', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load demo', exact: true }).click();
  await page.getByRole('button', { name: 'Interpret my needs' }).click();
  await page.getByRole('button', { name: 'Confirm & analyze reviews' }).click();
  await expect(page.getByRole('button', { name: 'Read decision brief' })).toBeVisible();
  const snapshot = await state(page);
  await page.getByRole('button', { name: '切换到中文' }).click();
  await expect(page.getByRole('heading', { name: '结合你的场景，看证据。' })).toBeVisible();
  expect(await state(page)).toEqual(snapshot);
  await page.locator('details.agent-run summary').click();
  await expect(page.locator('details.agent-run')).toContainText('调查冲突');
  await page.getByRole('button', { name: 'R5' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: '精确引文' })).toBeVisible();
  const quote = await dialog.locator('.exact-quote').innerText();
  expect(snapshot.reviews.find((review: { id: string }) => review.id === 'R5').rawText).toContain(quote);
  expect(snapshot.evidence.some((e: { quote: string }) => e.quote === quote)).toBe(true);
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '阅读决策简报' }).click();
  await expect(page.getByRole('heading', { name: '符合你的需求' })).toBeVisible();
  await page.getByRole('button', { name: '查看 Markdown 简报' }).click();
  await expect(page.getByLabel('Markdown 简报', { exact: true })).toContainText('# BuyLens 购买决策简报');
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await expect(page.getByRole('heading', { name: 'Your decision brief.' })).toBeVisible();
  await expect(page.getByLabel('Markdown brief', { exact: true })).toContainText('# BuyLens Purchase Decision Brief');
  expect(await state(page)).toEqual(snapshot);
  await page.getByRole('button', { name: '切换到中文' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: '你最关心什么？' })).toBeVisible();
  await page.getByRole('link', { name: '作品集评估' }).click();
  await expect(page.getByRole('heading', { name: '作品集评估' })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(8);
  await expect(page.getByText(/实时版本已于 2026-10-06 验证/)).toBeVisible();
  await page.screenshot({ path: 'artifacts/screenshots/bilingual-evaluation.png', fullPage: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: '作品集评估' })).toBeVisible();
  expect(await page.locator('html').getAttribute('lang')).toBe('zh-CN');
});

async function chineseMissing(page: Page) {
  await page.addInitScript(() => localStorage.setItem('buylens-language', 'zh'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '你最关心什么？' })).toBeVisible();
  await page.getByRole('button', { name: '加载演示', exact: true }).click();
  await page.getByRole('button', { name: '演示控件' }).click();
  await page.getByLabel('选择演示路径').selectOption('missing');
  await page.getByRole('button', { name: '演示控件' }).click();
  await page.getByRole('button', { name: '解读我的需求' }).click();
  await page.getByLabel('长时间佩戴舒适度优先级').selectOption('Critical');
  expect((await state(page)).criteria[0].priority).toBe('Critical');
  await page.getByRole('button', { name: '确认并分析评论' }).click();
  await expect(page.getByRole('heading', { name: '能补充相关证据吗？' })).toBeVisible();
}

test('Chinese mobile request/skip/stop flow keeps native values and fits the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await chineseMissing(page);
  await expect(page.locator('.agent-panel')).toContainText('Agent 选择：请求补充证据');
  await page.screenshot({ path: 'artifacts/screenshots/bilingual-mobile-workspace.png', fullPage: true });
  await page.getByRole('button', { name: '跳过并保留未知项' }).click();
  await page.getByRole('button', { name: '阅读决策简报' }).click();
  await expect(page.getByText('关键证据缺失', { exact: true })).toBeVisible();
  expect((await state(page)).decision.action).toBe('STOP_INSUFFICIENT');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await expect(page.getByRole('heading', { name: 'Your decision brief.' })).toBeVisible();
});

test('Chinese evidence addition retains decision history across a language switch', async ({ page }) => {
  await chineseMissing(page);
  const waiting = await state(page);
  await page.getByRole('button', { name: 'Switch to English' }).click();
  expect(await state(page)).toEqual(waiting);
  await page.getByRole('button', { name: '切换到中文' }).click();
  await page.getByRole('button', { name: '载入合成地铁评论' }).click();
  await page.getByRole('button', { name: '添加并重新分析' }).click();
  await expect(page.getByRole('button', { name: '阅读决策简报' })).toBeVisible();
  const finished = await state(page);
  expect(finished.decision.action).toBe('FINALIZE');
  expect(finished.version).toBe(waiting.version + 1);
  expect(finished.requests).toBe(waiting.requests);
  expect(finished.log.slice(0, waiting.log.length)).toEqual(waiting.log);
  await page.getByRole('button', { name: '阅读决策简报' }).click();
  await expect(page.getByText('已完成，仍有适用限制', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/screenshots/bilingual-brief.png', fullPage: true });
});

test('Chinese priority labels keep canonical option values and invalid criteria get a Chinese error', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('buylens-language', 'zh'));
  await page.goto('/');
  await page.getByRole('button', { name: '加载演示', exact: true }).click();
  await page.getByRole('button', { name: '解读我的需求' }).click();
  const select = page.locator('.criterion-edit select').first();
  expect(await select.locator('option').evaluateAll(options => options.map(option => ({ value: (option as HTMLOptionElement).value, disabled: (option as HTMLOptionElement).disabled })))).toEqual([
    { value: 'Critical', disabled: false }, { value: 'Medium', disabled: false }, { value: 'Low', disabled: false }, { value: 'Hard constraint', disabled: true },
  ]);
  await page.locator('.criterion-edit input').first().fill('');
  await page.getByRole('button', { name: '确认并分析评论' }).click();
  await expect(page.locator('.error[role="alert"]')).toContainText('请检查购买标准');
  await expect(page.locator('.error[role="alert"]')).not.toContainText('Review the criteria');
});
