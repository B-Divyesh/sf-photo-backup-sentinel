import './styles.css';
import { formatBytes, scanMedia, type ScanItem, type ScanProgress, type ScanReport } from './scanner';
import { clearReports, getReports, importReports, saveReport, setStorageNamespace } from './storage';
import { cachedProState, captureLicenseFromUrl, checkoutUrl, getStoredLicense, storeLicense, verifyLicense } from './license';

declare global {
  interface Window { showDirectoryPicker?: (options?: { mode?: 'read' }) => Promise<FileSystemDirectoryHandle> }
}

type Filter = 'all' | 'missing' | 'recent' | 'live' | 'sampled';

const app = document.querySelector<HTMLDivElement>('#app')!;
let sourceFiles: File[] = [];
let backupFiles: File[] = [];
let sourceLabel = '';
let backupLabel = '';
let sourceHandle: FileSystemDirectoryHandle | null = null;
let backupHandle: FileSystemDirectoryHandle | null = null;
let currentReport: ScanReport | null = null;
let reportHistory: ScanReport[] = [];
let activeFilter: Filter = 'all';
let isPro = false;
let activeScan: AbortController | null = null;
const demoMode = location.pathname === '/demo/' || location.pathname === '/demo' || new URLSearchParams(location.search).has('demo');

setStorageNamespace(demoMode ? 'demo' : 'real');

captureLicenseFromUrl();
isPro = cachedProState();

app.innerHTML = `
  <div class="network-strip" id="network-strip" role="status" hidden>Offline mode — scanning and saved checks still work locally.</div>
  <header class="site-header">
    <a class="wordmark" href="/" aria-label="PB/S REC 02 — Photo Backup Sentinel home"><span>PB/S</span><small>REC 02</small></a>
    <nav aria-label="Main navigation">
      <a href="#checker">Run a check</a>
      <a href="#how">How it works</a>
      <a href="#license">Sentinel Pro</a>
    </nav>
  </header>
  ${demoMode ? `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data.</strong> Nothing is saved to your real history. <button class="text-button" id="reset-demo" type="button">Reset demo</button><a href="/">Start for real</a></aside>` : ''}
  <main id="main" tabindex="-1">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow"><span>Local proof system</span> // no uploads</p>
        <h1 id="hero-title">Check your<br><em>photo backup.</em></h1>
        <p class="hero-lede">For phone owners who copy photos to a drive or NAS, find missing files before deleting the originals.</p>
        <div class="hero-actions"><a class="button button-primary" href="/demo/">Try it with sample data <span aria-hidden="true">↓</span></a><a class="hero-link" href="#checker">Check my backup</a></div>
        <p class="microcopy">Sample data opens a finished check. Local only. Free safety checks.</p>
      </div>
      <figure class="hero-art">
        <picture><source srcset="/assets/sentinel-hero.avif" type="image/avif" /><img src="/assets/sentinel-hero.webp" width="1152" height="768" alt="Zine collage of a two-reel cassette, a photo strip, and two backup drives" fetchpriority="high" decoding="async" /></picture>
        <figcaption>Reel A: phone export // Reel B: backup destination</figcaption>
      </figure>
    </section>

    <section class="checker-section" id="checker" aria-labelledby="checker-title">
      <div class="section-kicker">Side A / evidence desk</div>
      <div class="section-heading">
        <div><h2 id="checker-title">Run a local check</h2><p>Select an exported phone folder and a backup folder. Nothing is copied, changed, or uploaded.</p></div>
        <div class="privacy-stamp" aria-label="Privacy: local only">Local<br>only</div>
      </div>

      <div class="tape-path" aria-label="Three-step backup check">
        <section class="picker-step" aria-labelledby="source-title">
          <span class="step-number">01</span>
          <h3 id="source-title">Phone export</h3>
          <p>The folder copied from your iPhone or Android device.</p>
          <button class="button button-dark" id="choose-source" type="button">Choose export folder</button>
          <input class="visually-hidden" id="source-input" type="file" webkitdirectory multiple tabindex="-1" aria-hidden="true" />
          <p class="selection" id="source-selection">No folder selected</p>
        </section>
        <div class="path-arrow" aria-hidden="true">→</div>
        <section class="picker-step" aria-labelledby="backup-title">
          <span class="step-number">02</span>
          <h3 id="backup-title">Second copy</h3>
          <p>Your external drive, mounted NAS, or another local folder.</p>
          <button class="button button-dark" id="choose-backup" type="button">Choose backup folder</button>
          <input class="visually-hidden" id="backup-input" type="file" webkitdirectory multiple tabindex="-1" aria-hidden="true" />
          <p class="selection" id="backup-selection">No folder selected</p>
        </section>
        <div class="path-arrow" aria-hidden="true">→</div>
        <section class="picker-step picker-check" aria-labelledby="check-title">
          <span class="step-number">03</span>
          <h3 id="check-title">Verify</h3>
          <p>Compare SHA-256 content and open a deterministic 10% sample.</p>
          <button class="button button-signal" id="run-check" type="button" disabled>Run backup check</button>
          <p class="selection">Read-only. Existing files stay untouched.</p>
        </section>
      </div>

      <div class="progress-panel" id="progress-panel" hidden aria-live="polite">
        <div class="progress-meta"><strong id="progress-label">Preparing check…</strong><span id="progress-count">0 / 0</span></div>
        <progress id="scan-progress" max="100" value="0">0%</progress>
        <button class="text-button" id="cancel-check" type="button">Stop check</button>
      </div>
      <div class="message" id="error-message" role="alert" tabindex="-1" hidden></div>
    </section>

    <section class="results-section" id="results" aria-labelledby="results-title" hidden>
      <div class="section-kicker">Side B / proof sheet</div>
      <div id="result-summary"></div>
      <div class="results-toolbar">
        <div class="filters" role="group" aria-label="Filter check results">
          <button type="button" data-filter="all" aria-pressed="true">All</button>
          <button type="button" data-filter="missing" aria-pressed="false">Missing</button>
          <button type="button" data-filter="recent" aria-pressed="false">Recent gaps</button>
          <button type="button" data-filter="live" aria-pressed="false">Live Photo issues</button>
          <button type="button" data-filter="sampled" aria-pressed="false">Read samples</button>
        </div>
        <div class="export-actions">
          <button class="text-button" id="export-json" type="button">Export JSON</button>
          <button class="text-button" id="export-csv" type="button">Export CSV</button>
        </div>
      </div>
      <div class="result-ledger" id="result-ledger"></div>
      <p class="result-empty" id="result-empty" hidden>No items match this filter.</p>
    </section>

    <section class="how-section" id="how" aria-labelledby="how-title">
      <div class="section-kicker inverted">Liner notes / know the proof</div>
      <h2 id="how-title">A copy is not proof of a backup.</h2>
      <div class="proof-grid">
        <article><span class="proof-mark">#</span><h3>Exact hash match</h3><p>Sentinel reads each relevant file and compares its SHA-256 fingerprint. Matching fingerprints mean the bytes are identical, even if the filename changed.</p></article>
        <article><span class="proof-mark">◐</span><h3>Live Photo pairing</h3><p>A Live Photo is usually a still image plus a MOV with the same base name. Both halves must have exact matches before the pair is protected.</p></article>
        <article><span class="proof-mark">▶</span><h3>Sampled open/read</h3><p>Sentinel opens the first and last blocks of a deterministic 10% sample. This catches basic read errors. It is not a codec playback test.</p></article>
      </div>
      <p class="honesty-note"><strong>Honest limit:</strong> browsers cannot read an iPhone directly or guarantee every HEIC/MOV codec will play on every future device. Export first, then use this byte-level proof alongside periodic restore tests.</p>
    </section>

    <section class="history-section" aria-labelledby="history-title">
      <div class="section-heading">
        <div><span class="section-kicker">Check log</span><h2 id="history-title">Evidence saved on this device</h2><p>Only filenames, hashes, sizes, and check outcomes are stored. Media bytes are never saved.</p></div>
        <div class="export-actions"><button class="text-button" id="import-data" type="button">Import history</button><input class="visually-hidden" id="import-input" type="file" accept="application/json" tabindex="-1" aria-hidden="true" /></div>
      </div>
      <div id="history-list" class="history-list"></div>
    </section>

    <section class="license-section" id="license" aria-labelledby="license-title">
      <div class="license-copy">
        <span class="section-kicker inverted">Keep the tape rolling</span>
        <h2 id="license-title">Sentinel Pro</h2>
        <p class="price">$19 <span>one time</span></p>
        <p>Every backup check is free. Pro keeps a 30-check evidence timeline instead of the latest three, useful when several drives or family phones share this desk.</p>
        <p class="license-status" id="license-status">Free edition — three checks are kept locally.</p>
      </div>
      <div class="license-actions">
        <a class="button button-signal" href="${checkoutUrl}">Buy Sentinel Pro</a>
        <form id="license-form">
          <label for="license-token">Have a license? Paste it here</label>
          <div class="inline-form"><input id="license-token" name="license" autocomplete="off" spellcheck="false" value="${escapeHtml(getStoredLicense())}" /><button class="button button-paper" type="submit">Verify license</button></div>
          <p id="license-message" role="status"></p>
        </form>
        <p class="merchant-note">Secure checkout by Sociobot/Dodo, merchant of record. Refunds are handled there and revoke the license.</p>
      </div>
    </section>
  </main>
  <footer>
    <div class="wordmark footer-mark"><span>PB/S</span><small>REC 02</small></div>
    <p>Proof for people who keep their own photos. Built local-first; no analytics or media uploads.</p>
    <nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="#how">Method</a></nav>
    <p class="generated-note">Hero artwork was generated for this product with the factory image model. Build 1.0.1.</p>
  </footer>
  <div class="update-toast" id="update-toast" role="status" hidden>App update ready. <button type="button" id="reload-app">Reload</button></div>
`;

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
}

async function filesFromDirectory(handle: FileSystemDirectoryHandle): Promise<File[]> {
  const files: File[] = [];
  async function walk(directory: FileSystemDirectoryHandle): Promise<void> {
    const entries = directory as FileSystemDirectoryHandle & {
      values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>
    };
    for await (const entry of entries.values()) {
      if (entry.kind === 'file') files.push(await entry.getFile());
      else await walk(entry);
    }
  }
  await walk(handle);
  return files;
}

function folderName(files: File[], fallback: string): string {
  const path = (files[0] as File & { webkitRelativePath?: string } | undefined)?.webkitRelativePath;
  return path?.split('/')[0] || fallback;
}

function updatePicker(kind: 'source' | 'backup', files: File[], label: string, handle: FileSystemDirectoryHandle | null = null): void {
  if (kind === 'source') { sourceFiles = files; sourceLabel = label; sourceHandle = handle; }
  else { backupFiles = files; backupLabel = label; backupHandle = handle; }
  const mediaCount = files.filter(file => /\.(jpe?g|heic|heif|png|webp|gif|dng|tiff?|mov|mp4|m4v|avi|3gp)$/i.test(file.name)).length;
  const output = document.querySelector(`#${kind}-selection`)!;
  output.textContent = `${label} — ${mediaCount.toLocaleString()} media file${mediaCount === 1 ? '' : 's'}`;
  output.classList.add('selected');
  (document.querySelector('#run-check') as HTMLButtonElement).disabled = !(sourceFiles.length && backupFiles.length);
  hideError();
}

async function chooseDirectory(kind: 'source' | 'backup'): Promise<void> {
  if (!window.showDirectoryPicker) {
    (document.querySelector(`#${kind}-input`) as HTMLInputElement).click();
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: 'read' });
    const files = await filesFromDirectory(handle);
    updatePicker(kind, files, handle.name, handle);
  } catch (error) {
    if ((error as DOMException).name !== 'AbortError') showError(`That folder could not be opened. ${(error as Error).message}`);
  }
}

function sampleFile(name: string, content: string, modified: number): File {
  return new File([content], name, { type: 'application/octet-stream', lastModified: modified });
}

async function loadSampleDemo(): Promise<void> {
  const modified = new Date('2026-08-21T12:00:00Z').getTime();
  updatePicker('source', [
    sampleFile('IMG_8172.HEIC', 'harbour-sunrise-still', modified),
    sampleFile('IMG_8172.MOV', 'harbour-sunrise-motion', modified),
    sampleFile('IMG_8173.HEIC', 'family-garden-still', modified),
    sampleFile('IMG_8173.MOV', 'family-garden-motion', modified)
  ], 'Sample phone export');
  updatePicker('backup', [
    sampleFile('Archive_8172.HEIC', 'harbour-sunrise-still', modified),
    sampleFile('Archive_8172.MOV', 'harbour-sunrise-motion', modified),
    sampleFile('Archive_8173.MOV', 'family-garden-motion', modified)
  ], 'Sample external drive');
  await runCheck();
}

async function foldersOverlap(): Promise<boolean> {
  if (!sourceFiles.length || !backupFiles.length) return false;
  if (sourceHandle && backupHandle) {
    if (await sourceHandle.isSameEntry(backupHandle)) return true;
    const backupInsideSource = await sourceHandle.resolve(backupHandle);
    const sourceInsideBackup = await backupHandle.resolve(sourceHandle);
    return backupInsideSource !== null || sourceInsideBackup !== null;
  }
  // Directory-upload fallback intentionally refuses equal roots. Browser
  // privacy rules do not expose absolute paths there, so accepting one named
  // root twice would be an unsafe certification rather than an honest check.
  return sourceLabel.trim().toLocaleLowerCase() === backupLabel.trim().toLocaleLowerCase();
}

function showError(message: string): void {
  const element = document.querySelector<HTMLDivElement>('#error-message')!;
  element.textContent = message;
  element.hidden = false;
  element.focus();
}

function hideError(): void { document.querySelector<HTMLDivElement>('#error-message')!.hidden = true; }

function updateProgress(progress: ScanProgress): void {
  const percent = progress.total ? Math.round(progress.done / progress.total * 100) : 0;
  document.querySelector('#progress-label')!.textContent = progress.message;
  document.querySelector('#progress-count')!.textContent = `${progress.done} / ${progress.total}`;
  const bar = document.querySelector<HTMLProgressElement>('#scan-progress')!;
  bar.value = percent;
  bar.textContent = `${percent}%`;
}

function renderSummary(report: ScanReport): void {
  const clean = report.missingCount === 0 && report.sampledFailedCount === 0;
  const verdict = clean ? 'Second copy confirmed.' : `${report.missingCount} item${report.missingCount === 1 ? ' needs' : 's need'} attention.`;
  const ratio = report.sourceCount ? Math.round(report.protectedCount / report.sourceCount * 100) : 0;
  document.querySelector('#result-summary')!.innerHTML = `
    <div class="verdict ${clean ? 'verdict-clean' : 'verdict-alert'}">
      <div><span class="verdict-label">${clean ? '✓ Protection check passed' : '! Protection gaps found'}</span><h2 id="results-title">${escapeHtml(verdict)}</h2><p>Checked ${report.sourceCount.toLocaleString()} source assets against ${report.backupCount.toLocaleString()} backup assets on ${new Date(report.scannedAt).toLocaleString()}.</p></div>
      <div class="ratio" aria-label="${ratio} percent protected"><strong>${ratio}%</strong><span>exact copies</span></div>
    </div>
    <dl class="evidence-stats">
      <div><dt>Exact hash matches</dt><dd>${report.protectedCount}</dd></div>
      <div><dt>Missing exact copies</dt><dd>${report.missingCount}</dd></div>
      <div><dt>Recent gaps</dt><dd>${report.recentMissingCount}</dd></div>
      <div><dt>Live Photo pair issues</dt><dd>${report.livePairIssues}</dd></div>
      <div><dt>Samples opened/read</dt><dd>${report.sampledReadableCount}</dd></div>
    </dl>`;
}

function itemMatchesFilter(item: ScanItem): boolean {
  if (activeFilter === 'missing') return item.status === 'missing';
  if (activeFilter === 'recent') return item.status === 'missing' && item.recent;
  if (activeFilter === 'live') return Boolean(item.liveRole && !item.livePairComplete);
  if (activeFilter === 'sampled') return item.readState !== 'not-sampled';
  return true;
}

function renderLedger(): void {
  if (!currentReport) return;
  const items = currentReport.items.filter(itemMatchesFilter);
  const ledger = document.querySelector('#result-ledger')!;
  document.querySelector<HTMLParagraphElement>('#result-empty')!.hidden = items.length > 0;
  ledger.innerHTML = items.map(item => {
    const readLabel = item.readState === 'sampled-readable' ? 'Sample opened/read' : item.readState === 'read-failed' ? 'Sample read failed' : 'Not in read sample';
    const liveLabel = item.liveRole ? `Live ${item.liveRole} · ${item.livePairComplete ? 'pair protected' : 'pair incomplete'}` : '';
    return `<article class="ledger-row ${item.status}" tabindex="0">
      <div class="status-icon" aria-hidden="true">${item.status === 'protected' ? '✓' : '!'}</div>
      <div class="file-main"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.relativePath)} · ${formatBytes(item.bytes)}${item.recent ? ' · Recent' : ''}</p><code title="SHA-256">SHA-256 ${item.hash.slice(0, 16)}…</code></div>
      <div class="file-proof"><strong>${item.status === 'protected' ? 'Exact match' : 'No exact copy'}</strong><span>${item.backupName ? `↳ ${escapeHtml(item.backupName)}` : 'Copy this asset to the backup, then check again.'}</span>${liveLabel ? `<span>${escapeHtml(liveLabel)}</span>` : ''}<span>${readLabel}</span></div>
    </article>`;
  }).join('');
}

function renderReport(report: ScanReport): void {
  currentReport = report;
  renderSummary(report);
  renderLedger();
  const section = document.querySelector<HTMLElement>('#results')!;
  section.hidden = false;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderHistory(): void {
  const list = document.querySelector('#history-list')!;
  if (!reportHistory.length) {
    list.innerHTML = '<div class="empty-tape"><span aria-hidden="true">○ — ○</span><strong>No checks recorded yet.</strong><p>Choose two folders above to make your first proof sheet.</p></div>';
    return;
  }
  list.innerHTML = reportHistory.map(report => `<button class="history-entry" type="button" data-report-id="${escapeHtml(report.id)}">
    <span><strong>${new Date(report.scannedAt).toLocaleDateString()}</strong><small>${new Date(report.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></span>
    <span>${escapeHtml(report.sourceLabel)} → ${escapeHtml(report.backupLabel)}</span>
    <span class="history-score ${report.missingCount ? 'has-gaps' : ''}">${report.missingCount ? `${report.missingCount} missing` : 'All protected'}</span>
  </button>`).join('');
}

async function refreshHistory(): Promise<void> {
  reportHistory = await getReports();
  renderHistory();
}

function download(name: string, type: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function reportCsv(report: ScanReport): string {
  const cell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [
    ['name', 'relative_path', 'bytes', 'modified', 'status', 'sha256', 'backup_path', 'live_role', 'live_pair_complete', 'read_sample'].map(cell).join(','),
    ...report.items.map(item => [item.name, item.relativePath, item.bytes, new Date(item.modified).toISOString(), item.status, item.hash, item.backupName, item.liveRole, item.livePairComplete, item.readState].map(cell).join(','))
  ].join('\n');
}

async function runCheck(): Promise<void> {
  const button = document.querySelector<HTMLButtonElement>('#run-check')!;
  const panel = document.querySelector<HTMLElement>('#progress-panel')!;
  hideError();
  if (await foldersOverlap()) {
    showError('Choose two separate, non-overlapping folders. Sentinel cannot certify one folder as both the phone export and its second copy.');
    return;
  }
  button.disabled = true;
  button.textContent = 'Checking…';
  panel.hidden = false;
  activeScan = new AbortController();
  try {
    const report = await scanMedia(sourceFiles, backupFiles, sourceLabel, backupLabel, updateProgress, activeScan.signal);
    await saveReport(report, isPro ? 30 : 3);
    await refreshHistory();
    renderReport(report);
  } catch (error) {
    if ((error as DOMException).name === 'AbortError') showError('Check stopped. No report was saved. Choose the folders and run the check again when you are ready.');
    else showError((error as Error).message || 'The check stopped unexpectedly. Choose the folders again and retry.');
  } finally {
    activeScan = null;
    button.disabled = false;
    button.textContent = 'Run backup check';
    panel.hidden = true;
  }
}

function updateLicenseUi(message?: string): void {
  document.querySelector('#license-status')!.textContent = isPro ? 'Sentinel Pro active — up to 30 checks are kept locally.' : 'Free edition — three checks are kept locally.';
  document.querySelector('#license-message')!.textContent = message || '';
  document.body.classList.toggle('is-pro', isPro);
}

async function checkLicense(force = false): Promise<void> {
  if (!getStoredLicense()) return;
  try {
    const result = await verifyLicense(force);
    isPro = result.valid;
    updateLicenseUi(result.valid ? 'License verified. Pro history is active.' : `License no longer active (${result.reason}). Free checks still work.`);
  } catch {
    updateLicenseUi('Could not reach the license service. Your cached access is unchanged.');
  }
}

document.querySelector('#choose-source')!.addEventListener('click', () => chooseDirectory('source'));
document.querySelector('#choose-backup')!.addEventListener('click', () => chooseDirectory('backup'));
for (const kind of ['source', 'backup'] as const) {
  document.querySelector<HTMLInputElement>(`#${kind}-input`)!.addEventListener('change', event => {
    const files = [...((event.target as HTMLInputElement).files || [])];
    if (files.length) updatePicker(kind, files, folderName(files, kind === 'source' ? 'Phone export' : 'Backup'));
  });
}
document.querySelector('#run-check')!.addEventListener('click', runCheck);
document.querySelector('#cancel-check')!.addEventListener('click', () => activeScan?.abort());
document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter as Filter;
  document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  renderLedger();
}));
document.querySelector('#export-json')!.addEventListener('click', () => currentReport && download(`sentinel-check-${currentReport.scannedAt.slice(0, 10)}.json`, 'application/json', JSON.stringify({ format: 'photo-backup-sentinel/v1', reports: [currentReport] }, null, 2)));
document.querySelector('#export-csv')!.addEventListener('click', () => currentReport && download(`sentinel-check-${currentReport.scannedAt.slice(0, 10)}.csv`, 'text/csv', reportCsv(currentReport)));
document.querySelector('#import-data')!.addEventListener('click', () => (document.querySelector('#import-input') as HTMLInputElement).click());
document.querySelector<HTMLInputElement>('#import-input')!.addEventListener('change', async event => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text()) as { format?: string; reports?: ScanReport[] };
    if (data.format !== 'photo-backup-sentinel/v1' || !Array.isArray(data.reports)) throw new Error('Not a Sentinel history export.');
    await importReports(data.reports, isPro ? 30 : 3);
    await refreshHistory();
  } catch { showError('History was not imported. Choose a Sentinel JSON export, then try again.'); }
});
document.querySelector('#history-list')!.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-report-id]');
  const report = reportHistory.find(item => item.id === button?.dataset.reportId);
  if (report) renderReport(report);
});
document.querySelector<HTMLFormElement>('#license-form')!.addEventListener('submit', async event => {
  event.preventDefault();
  const token = (document.querySelector('#license-token') as HTMLInputElement).value.trim();
  if (!token) { updateLicenseUi('Paste the license from your purchase email.'); return; }
  storeLicense(token);
  updateLicenseUi('Verifying…');
  await checkLicense(true);
});

function updateNetworkStatus(): void {
  document.querySelector<HTMLElement>('#network-strip')!.hidden = navigator.onLine;
}
addEventListener('online', updateNetworkStatus);
addEventListener('offline', updateNetworkStatus);
updateNetworkStatus();
updateLicenseUi();
refreshHistory().catch(() => showError('Saved check history is unavailable in this browser. You can still run a check and export its report.'));
checkLicense();

if (demoMode) {
  document.querySelector('#reset-demo')?.addEventListener('click', async () => {
    await clearReports();
    await refreshHistory();
    await loadSampleDemo();
  });
  loadSampleDemo().catch(() => showError('The sample check could not start. Reset the demo and try again.'));
}

if ('serviceWorker' in navigator) {
  addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) document.querySelector<HTMLElement>('#update-toast')!.hidden = false;
        });
      });
    } catch { /* The app remains usable without installation support. */ }
  });
}
document.querySelector('#reload-app')!.addEventListener('click', () => location.reload());
