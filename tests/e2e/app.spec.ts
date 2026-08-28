import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

const fixture = (name: string) => path.join(process.cwd(), 'tests', 'fixtures', name);

test('@claim:demo-sandbox opens a seeded, isolated sample check in one visit', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page).toHaveTitle(/Demo — Photo Backup Sentinel/);
  await expect(page.getByText('Demo — sample data.')).toBeVisible();
  await expect(page.getByRole('heading', { name: /1 item needs attention/i })).toBeVisible();
  await expect(page.locator('.history-entry')).toHaveCount(1);
  const names = await page.evaluate(async () => (await indexedDB.databases()).map(database => database.name));
  expect(names).toContain('demo:photo-backup-sentinel');
  expect(names).not.toContain('photo-backup-sentinel');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('.history-entry')).toHaveCount(1);
});

test('@claim:exact-hash @claim:live-photo @claim:read-sample checks folders and reports exact, missing, Live Photo, and sample evidence', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/demo/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Check your.*photo backup/i);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /1 item needs attention/i })).toBeVisible();
  await expect(page.getByText('Exact hash matches').locator('..').getByText('3', { exact: true })).toBeVisible();
  await expect(page.getByText('Samples opened/read').locator('..').getByText('1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Live Photo issues' }).click();
  await expect(page.getByText('pair incomplete')).toHaveCount(2);
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter(issue => ['serious', 'critical'].includes(issue.impact || ''))).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('rejects the same directory as source and backup before scanning', async ({ page }) => {
  await page.goto('/');
  await page.locator('#source-input').setInputFiles(fixture('source'));
  await page.locator('#backup-input').setInputFiles(fixture('source'));
  await page.getByRole('button', { name: 'Run backup check' }).click();
  await expect(page.getByRole('alert')).toHaveText(/separate, non-overlapping folders/i);
  await expect(page.locator('#results')).toBeHidden();
});

test('stops an in-progress check without saving a report', async ({ page }) => {
  await page.addInitScript(() => {
    Blob.prototype.stream = function () {
      return new ReadableStream<Uint8Array<ArrayBuffer>>({
        start(controller) {
          setTimeout(() => controller.enqueue(new Uint8Array(new ArrayBuffer(1024 * 1024))), 120);
          setTimeout(() => controller.close(), 240);
        }
      });
    };
  });
  await page.goto('/');
  await page.locator('#source-input').setInputFiles(fixture('source'));
  await page.locator('#backup-input').setInputFiles(fixture('backup'));
  await page.getByRole('button', { name: 'Run backup check' }).click();
  await expect(page.getByRole('button', { name: 'Stop check' })).toBeVisible();
  await page.getByRole('button', { name: 'Stop check' }).click();
  await expect(page.getByRole('alert')).toHaveText(/Check stopped. No report was saved/i);
  await expect(page.locator('.history-entry')).toHaveCount(0);
});

test('@claim:csv-export @claim:json-export exports each row and the current report', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.getByRole('heading', { name: /1 item needs attention/i })).toBeVisible();
  const csv = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const csvPath = await (await csv).path();
  const csvContent = await readFile(csvPath!, 'utf8');
  expect(csvContent.split('\n')).toHaveLength(5);
  expect(csvContent).toContain('"name","relative_path","bytes"');
  const json = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const jsonPath = await (await json).path();
  const report = JSON.parse(await readFile(jsonPath!, 'utf8')) as { format: string; reports: unknown[] };
  expect(report.format).toBe('photo-backup-sentinel/v1');
  expect(report.reports).toHaveLength(1);
});

test('@claim:offline-reload keeps the installed shell available after a first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 15_000 });
  await page.waitForFunction(async () => {
    const cache = await caches.open('sentinel-v6');
    const script = document.querySelector<HTMLScriptElement>('script[type="module"]')?.src;
    return Boolean(script && await cache.match(script));
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Check your/);
  await expect(page.getByRole('status').filter({ hasText: 'Offline mode' })).toBeVisible();
});

test('@claim:local-only uses no cross-origin or write request while running sample data', async ({ page }) => {
  const requests: { url: string; method: string }[] = [];
  page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
  await page.goto('/demo/');
  await expect(page.getByRole('heading', { name: /1 item needs attention/i })).toBeVisible();
  expect(requests.every(request => new URL(request.url).origin === 'http://127.0.0.1:4173' && request.method === 'GET')).toBe(true);
});

test('@claim:price shows the one-time Pro price', async ({ page }) => {
  await page.goto('/terms/');
  await expect(page.getByText('Sentinel Pro costs $19 as a one-time purchase')).toBeVisible();
});

test('@claim:history-limit @claim:history-persistence keeps three free records across reload', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.getByRole('heading', { name: /1 item needs attention/i })).toBeVisible();
  await page.locator('#source-input').setInputFiles(fixture('source'));
  await page.locator('#backup-input').setInputFiles(fixture('backup'));
  for (let index = 0; index < 4; index += 1) {
    await page.getByRole('button', { name: 'Run backup check' }).click();
    await expect(page.locator('.history-entry')).toHaveCount(Math.min(index + 2, 3));
  }
  await expect(page.locator('.history-entry')).toHaveCount(3);
  await page.reload();
  await expect(page.locator('.history-entry')).toHaveCount(3);
});

test('legal pages, mobile layout, and 404 route have no serious axe findings', async ({ page }) => {
  for (const route of ['/privacy/', '/terms/']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(issue => ['serious', 'critical'].includes(issue.impact || ''))).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const notFoundDocument = await readFile(path.join(process.cwd(), 'dist', '404.html'), 'utf8');
  expect(notFoundDocument).toContain('That page');
  expect(notFoundDocument).toContain('Return to the backup checker');
});

test('keyboard skips hidden file inputs and reaches visible controls', async ({ page }) => {
  await page.goto('/');
  for (let index = 0; index < 14; index += 1) {
    await page.keyboard.press('Tab');
    const activeId = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.id || '');
    expect(['source-input', 'backup-input', 'import-input']).not.toContain(activeId);
  }
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});
