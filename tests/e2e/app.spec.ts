import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';

const fixture = (name: string) => path.join(process.cwd(), 'tests', 'fixtures', name);

test('checks folders end to end and reports exact and missing assets', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Two copies\.\s*Prove it\./);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);

  await page.locator('#source-input').setInputFiles(fixture('source'));
  await page.locator('#backup-input').setInputFiles(fixture('backup'));
  await page.getByRole('button', { name: 'Run backup check' }).click();
  await expect(page.getByRole('heading', { name: /1 item needs attention/i })).toBeVisible();
  await expect(page.getByText('Exact hash matches').locator('..').getByText('2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Live Photo issues' }).click();
  await expect(page.getByText('pair incomplete')).toHaveCount(2);
  await expect(page.locator('.history-entry')).toHaveCount(1);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter(issue => ['serious', 'critical'].includes(issue.impact || ''))).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('keeps the installed shell available offline', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 15_000 });
  await page.waitForFunction(async () => {
    const cache = await caches.open('sentinel-v4');
    const script = document.querySelector<HTMLScriptElement>('script[type="module"]')?.src;
    if (!script) return false;
    const response = await cache.match(script);
    return Boolean(response && (await response.clone().arrayBuffer()).byteLength > 1_000);
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Two copies.');
  await expect(page.getByRole('status').filter({ hasText: 'Offline mode' })).toBeVisible();
});

test('legal pages are reachable and explicit', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page).toHaveTitle(/Privacy/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Privacy/);
  await page.goto('/terms/');
  await expect(page.getByText('$19')).toBeVisible();
});
