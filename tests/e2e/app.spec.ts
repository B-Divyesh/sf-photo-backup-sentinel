import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { readFile, readdir, stat } from 'node:fs/promises';

const fixture = (name: string) => path.join(process.cwd(), 'tests', 'fixtures', name);

function reportRecord(id: string, index = 0) {
  return {
    id,
    scannedAt: new Date(Date.UTC(2026, 7, 28, 12, index)).toISOString(),
    sourceLabel: `Phone ${index}`,
    backupLabel: `Drive ${index}`,
    sourceCount: 1,
    backupCount: 1,
    ignoredSourceCount: 0,
    ignoredBackupCount: 0,
    protectedCount: 1,
    missingCount: 0,
    recentMissingCount: 0,
    livePairIssues: 0,
    sampledReadableCount: 1,
    sampledFailedCount: 0,
    items: []
  };
}

async function fixtureSnapshot() {
  const relativeFiles = [
    'source/IMG_001.JPG', 'source/IMG_002.HEIC', 'source/IMG_002.MOV',
    'backup/IMG_002.HEIC', 'backup/copied-photo.JPG'
  ];
  return Promise.all(relativeFiles.map(async relative => {
    const target = fixture(relative);
    const [content, details] = await Promise.all([readFile(target), stat(target)]);
    return { relative, hash: createHash('sha256').update(content).digest('hex'), bytes: details.size, modified: details.mtimeMs };
  }));
}

test('@claim:demo-sandbox keeps sample data isolated, stable, resettable, and disposable', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async report => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('photo-backup-sentinel', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('checks', { keyPath: 'id' });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('checks', 'readwrite');
        transaction.objectStore('checks').put(report);
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }, reportRecord('real-marker'));

  await page.goto('/demo/');
  await expect(page).toHaveTitle('Demo — Photo Backup Sentinel');
  await expect(page.getByText('Demo — sample data, nothing is saved.')).toBeVisible();
  await expect(page.getByRole('heading', { name: /1 item needs attention/i })).toBeVisible();
  await expect(page.locator('.history-entry')).toHaveCount(1);

  await page.reload();
  await expect(page.locator('.history-entry')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.history-entry')).toHaveCount(1);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('.history-entry')).toHaveCount(1);

  const realCount = await page.evaluate(async () => await new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('photo-backup-sentinel');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const count = database.transaction('checks').objectStore('checks').count();
      count.onsuccess = () => { database.close(); resolve(count.result); };
      count.onerror = () => reject(count.error);
    };
  }));
  expect(realCount).toBe(1);

  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
  await expect(page.locator('.history-entry')).toHaveCount(1);
  await expect.poll(() => page.evaluate(async () => (await indexedDB.databases()).map(database => database.name))).not.toContain('demo:photo-backup-sentinel');
});

test('@claim:exact-hash @claim:live-photo @claim:no-account reports renamed matches and incomplete Live Photos without an account', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/demo/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Check your.*photo backup/i);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /1 item needs attention/i })).toBeVisible();
  await expect(page.getByText('Exact hash matches').locator('..').getByText('3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Live Photo issues' }).click();
  await expect(page.getByText('pair incomplete')).toHaveCount(2);
  await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(0);
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter(issue => ['serious', 'critical'].includes(issue.impact || ''))).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('rejects identical directory handles before scanning', async ({ page }) => {
  await page.addInitScript(() => {
    const shared = {
      kind: 'directory',
      name: 'DCIM',
      async *values() {
        yield { kind: 'file', getFile: async () => new File(['same-file'], 'IMG_0001.JPG') };
      },
      async isSameEntry(other: unknown) { return other === shared; },
      async resolve(other: unknown) { return other === shared ? [] : null; }
    };
    window.showDirectoryPicker = async () => shared as unknown as FileSystemDirectoryHandle;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Choose export folder' }).click();
  await page.getByRole('button', { name: 'Choose backup folder' }).click();
  await page.getByRole('button', { name: 'Run backup check' }).click();
  await expect(page.getByRole('alert')).toHaveText(/separate, non-overlapping folders/i);
  await expect(page.locator('#results')).toBeHidden();
});

test('allows separate fallback folders with the same leaf name after explicit confirmation', async ({ page }) => {
  await page.goto('/');
  await page.locator('#source-input').setInputFiles(fixture('same-name/source/DCIM'));
  await page.locator('#backup-input').setInputFiles(fixture('same-name/backup/DCIM'));
  await expect(page.locator('#folder-confirmation')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run backup check' })).toBeDisabled();
  await page.getByLabel('I selected two separate locations.').check();
  await page.getByRole('button', { name: 'Run backup check' }).click();
  await expect(page.getByRole('heading', { name: 'Second copy confirmed.' })).toBeVisible();
});

test('requires confirmation before an ambiguous same-name fallback can run', async ({ page }) => {
  await page.goto('/');
  await page.locator('#source-input').setInputFiles(fixture('source'));
  await page.locator('#backup-input').setInputFiles(fixture('source'));
  await expect(page.locator('#folder-confirmation')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run backup check' })).toBeDisabled();
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

test('@claim:csv-export @claim:json-export @claim:json-import exports rows and imports the report into real history', async ({ page }) => {
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

  await page.goto('/');
  await page.locator('#import-input').setInputFiles(jsonPath!);
  await expect(page.locator('.history-entry')).toHaveCount(1);
  await page.locator('.history-entry').click();
  await expect(page.getByRole('heading', { name: /1 item needs attention/i })).toBeVisible();
});

test('@claim:offline-workflow keeps routes, scanning, and saved checks working offline', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 15_000 });
    await page.waitForFunction(async () => {
      const cache = await caches.open('sentinel-v7');
      const script = document.querySelector<HTMLScriptElement>('script[type="module"]')?.src;
      return Boolean(script && await cache.match(script));
    });

    await page.goto('/privacy/');
    await expect(page).toHaveTitle('Privacy — Photo Backup Sentinel');
    await page.goto('/terms/');
    await expect(page).toHaveTitle('Terms — Photo Backup Sentinel');
    await page.goto('/demo/');
    await expect(page.locator('.history-entry')).toHaveCount(1);

    await context.setOffline(true);
    await page.reload();
    await expect(page).toHaveTitle('Demo — Photo Backup Sentinel');
    await expect(page.locator('.history-entry')).toHaveCount(1);
    await page.locator('#source-input').setInputFiles(fixture('source'));
    await page.locator('#backup-input').setInputFiles(fixture('backup'));
    await page.getByRole('button', { name: 'Run backup check' }).click();
    await expect(page.locator('.history-entry')).toHaveCount(2);
    await page.reload();
    await expect(page.locator('.history-entry')).toHaveCount(2);
    await expect(page.getByRole('status').filter({ hasText: 'Offline mode' })).toBeVisible();

    await page.goto('/privacy/');
    await expect(page.getByRole('heading', { name: 'See how your data is handled' })).toBeVisible();
    await page.goto('/terms/');
    await expect(page.getByRole('heading', { name: 'Read the backup checker terms' })).toBeVisible();
    const missing = await page.goto('/missing-offline-route');
    expect(missing?.status()).toBe(404);
    await expect(page).toHaveTitle('Not found — Photo Backup Sentinel');
    await expect(page.getByRole('heading', { name: 'This page was not found' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('@claim:local-only makes no cross-origin or write request and sets no cookie during sample and real checks', async ({ page, context }) => {
  const requests: { url: string; method: string }[] = [];
  page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
  await page.goto('/demo/');
  await expect(page.getByRole('heading', { name: /1 item needs attention/i })).toBeVisible();
  await page.goto('/');
  await page.locator('#source-input').setInputFiles(fixture('source'));
  await page.locator('#backup-input').setInputFiles(fixture('backup'));
  await page.getByRole('button', { name: 'Run backup check' }).click();
  await expect(page.getByRole('heading', { name: /1 item needs attention/i })).toBeVisible();
  expect(requests.every(request => new URL(request.url).origin === 'http://127.0.0.1:4173' && request.method === 'GET')).toBe(true);
  expect(await context.cookies()).toEqual([]);
});

test('@claim:stored-metadata @claim:read-only-files stores report metadata without media and leaves selected files unchanged', async ({ page }) => {
  const before = await fixtureSnapshot();
  const beforeNames = {
    source: (await readdir(fixture('source'))).sort(),
    backup: (await readdir(fixture('backup'))).sort()
  };
  await page.goto('/');
  await page.locator('#source-input').setInputFiles(fixture('source'));
  await page.locator('#backup-input').setInputFiles(fixture('backup'));
  await page.getByRole('button', { name: 'Run backup check' }).click();
  await expect(page.getByRole('heading', { name: /1 item needs attention/i })).toBeVisible();

  const stored = await page.evaluate(async () => await new Promise<{ count: number; hasBinary: boolean; forbiddenKeys: string[]; firstItemKeys: string[] }>((resolve, reject) => {
    const request = indexedDB.open('photo-backup-sentinel');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const getAll = database.transaction('checks').objectStore('checks').getAll();
      getAll.onerror = () => reject(getAll.error);
      getAll.onsuccess = () => {
        database.close();
        const records = getAll.result as Record<string, unknown>[];
        const forbiddenKeys: string[] = [];
        let hasBinary = false;
        const visit = (value: unknown): void => {
          if (value instanceof Blob || value instanceof ArrayBuffer) { hasBinary = true; return; }
          if (Array.isArray(value)) { value.forEach(visit); return; }
          if (value && typeof value === 'object') {
            for (const [key, child] of Object.entries(value)) {
              if (/exif|location|latitude|longitude|mediaData|content|buffer/i.test(key)) forbiddenKeys.push(key);
              visit(child);
            }
          }
        };
        visit(records);
        const firstItems = records[0]?.items as Record<string, unknown>[];
        resolve({ count: records.length, hasBinary, forbiddenKeys, firstItemKeys: Object.keys(firstItems[0]).sort() });
      };
    };
  }));
  expect(stored.count).toBe(1);
  expect(stored.hasBinary).toBe(false);
  expect(stored.forbiddenKeys).toEqual([]);
  expect(stored.firstItemKeys).toEqual(expect.arrayContaining(['name', 'relativePath', 'bytes', 'modified', 'hash', 'status', 'readState']));

  expect(await fixtureSnapshot()).toEqual(before);
  expect((await readdir(fixture('source'))).sort()).toEqual(beforeNames.source);
  expect((await readdir(fixture('backup'))).sort()).toEqual(beforeNames.backup);
  await page.reload();
  await expect(page.locator('#source-selection')).toHaveText('No folder selected');
  await expect(page.locator('.history-entry')).toHaveCount(1);
});

test('@claim:history-limit @claim:history-persistence keeps three free records across reload', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.locator('.history-entry')).toHaveCount(1);
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

test('@claim:pro-history-limit keeps 30 records when a valid Pro verdict is cached', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:photo-backup-sentinel', 'licensed-test-user');
    localStorage.setItem('sb_license:photo-backup-sentinel:verdict', JSON.stringify({ valid: true, reason: 'ok', checkedAt: Date.now() }));
  });
  await page.goto('/');
  await expect(page.locator('#license-status')).toContainText('up to 30 checks');
  const records = Array.from({ length: 31 }, (_, index) => reportRecord(`pro-${index}`, index));
  await page.locator('#import-input').setInputFiles({
    name: 'sentinel-pro-history.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ format: 'photo-backup-sentinel/v1', reports: records }))
  });
  await expect(page.locator('.history-entry')).toHaveCount(30);
  const storedCount = await page.evaluate(async () => await new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('photo-backup-sentinel');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const count = database.transaction('checks').objectStore('checks').count();
      count.onsuccess = () => { database.close(); resolve(count.result); };
      count.onerror = () => reject(count.error);
    };
  }));
  expect(storedCount).toBe(30);
});

test('@claim:license-restore accepts callback and pasted licenses through Sociobot verification', async ({ page }) => {
  const verifiedTokens: string[] = [];
  await page.route('https://api.sociobot.in/**', async route => {
    verifiedTokens.push(new URL(route.request().url()).searchParams.get('license') || '');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok' }) });
  });
  await page.goto('/?license=callback-token');
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
  await expect(page.locator('#license-status')).toContainText('Pro active');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:photo-backup-sentinel'))).toBe('callback-token');

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#license-token').fill('pasted-token');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.locator('#license-message')).toContainText('License verified');
  expect(verifiedTokens).toEqual(['callback-token', 'pasted-token']);
});

test('@claim:daily-license-check waits 24 hours after a verification response', async ({ page }) => {
  let verificationRequests = 0;
  await page.route('https://api.sociobot.in/**', async route => {
    verificationRequests += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok' }) });
  });
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('sb_license:photo-backup-sentinel', 'daily-token');
    localStorage.setItem('sb_license:photo-backup-sentinel:verdict', JSON.stringify({ valid: true, checkedAt: Date.now() - 86_400_001 }));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await expect.poll(() => verificationRequests).toBe(1);
  await page.reload({ waitUntil: 'networkidle' });
  expect(verificationRequests).toBe(1);
});

test('@claim:price shows the $19 one-time offer and opens Sociobot checkout', async ({ page }) => {
  await page.goto('/terms/');
  await expect(page.getByText('Sentinel Pro costs $19 as a one-time purchase.')).toBeVisible();
  let checkoutRequested = false;
  await page.route('https://api.sociobot.in/api/v1/products/photo-backup-sentinel/checkout', async route => {
    checkoutRequested = true;
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body><h1>Sociobot checkout</h1></body></html>' });
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Buy Sentinel Pro' }).click();
  await expect(page.getByRole('heading', { name: 'Sociobot checkout' })).toBeVisible();
  expect(checkoutRequested).toBe(true);
  expect(page.url()).toBe('https://api.sociobot.in/api/v1/products/photo-backup-sentinel/checkout');
});

test('all routes use the required structure and have no serious axe findings', async ({ page }) => {
  const routes = [
    { path: '/', title: 'Photo Backup Sentinel — Check photo backups' },
    { path: '/demo/', title: 'Demo — Photo Backup Sentinel' },
    { path: '/privacy/', title: 'Privacy — Photo Backup Sentinel' },
    { path: '/terms/', title: 'Terms — Photo Backup Sentinel' },
    { path: '/404.html', title: 'Not found — Photo Backup Sentinel' }
  ];
  for (const route of routes) {
    await page.goto(route.path);
    await expect(page).toHaveTitle(route.title);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(issue => ['serious', 'critical'].includes(issue.impact || '')), route.path).toEqual([]);
  }
});

test('mobile interactive targets are at least 44 by 44 CSS pixels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/demo/', '/privacy/', '/terms/', '/404.html']) {
    await page.goto(route);
    const undersized = await page.locator('a, button, input').evaluateAll(elements => elements.flatMap(element => {
      const html = element as HTMLElement;
      if (html.getAttribute('aria-hidden') === 'true' || html.closest('[hidden]')) return [];
      const style = getComputedStyle(html);
      if (style.display === 'none' || style.visibility === 'hidden') return [];
      const target = html instanceof HTMLInputElement && html.type === 'checkbox' ? html.closest('label') as HTMLElement : html;
      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height || (rect.width >= 44 && rect.height >= 44)) return [];
      return [{ route, label: html.getAttribute('aria-label') || html.textContent?.trim() || html.id, width: rect.width, height: rect.height }];
    }));
    expect(undersized).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});

test('keyboard focus and reduced-motion behavior remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (let index = 0; index < 14; index += 1) {
    await page.keyboard.press('Tab');
    const activeId = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.id || '');
    expect(['source-input', 'backup-input', 'import-input']).not.toContain(activeId);
  }
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  const motion = await page.evaluate(() => ({
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
    heroTransform: getComputedStyle(document.querySelector('.hero-art')!).transform,
    transition: getComputedStyle(document.querySelector('.button')!).transitionDuration
  }));
  expect(motion.scroll).toBe('auto');
  expect(motion.heroTransform).toBe('none');
  expect(Number.parseFloat(motion.transition)).toBeLessThanOrEqual(.001);
});
