import { sha256 } from '@noble/hashes/sha2.js';

export const MEDIA_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'heic', 'heif', 'png', 'webp', 'gif', 'dng', 'tif', 'tiff',
  'mov', 'mp4', 'm4v', 'avi', '3gp'
]);

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'heic', 'heif', 'png', 'webp', 'gif', 'dng', 'tif', 'tiff']);

export type ReadState = 'sampled-readable' | 'not-sampled' | 'read-failed';

export interface ScanItem {
  id: string;
  name: string;
  relativePath: string;
  bytes: number;
  modified: number;
  recent: boolean;
  kind: 'photo' | 'video';
  hash: string;
  status: 'protected' | 'missing';
  backupName?: string;
  readState: ReadState;
  liveRole?: 'still' | 'motion';
  livePairComplete?: boolean;
}

export interface ScanReport {
  id: string;
  scannedAt: string;
  sourceLabel: string;
  backupLabel: string;
  sourceCount: number;
  backupCount: number;
  ignoredSourceCount: number;
  ignoredBackupCount: number;
  protectedCount: number;
  missingCount: number;
  recentMissingCount: number;
  livePairIssues: number;
  sampledReadableCount: number;
  sampledFailedCount: number;
  items: ScanItem[];
}

export interface ScanProgress {
  stage: 'indexing' | 'hashing-source' | 'hashing-backup' | 'sampling' | 'done';
  done: number;
  total: number;
  message: string;
}

export function scanAborted(): DOMException {
  return new DOMException('The backup check was stopped. No report was saved.', 'AbortError');
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw scanAborted();
}

function extension(name: string): string {
  const part = name.split('.').pop();
  return part && part !== name ? part.toLowerCase() : '';
}

function stem(name: string): string {
  return name.replace(/\.[^.]+$/, '').toLocaleLowerCase();
}

export function isMedia(name: string): boolean {
  return MEDIA_EXTENSIONS.has(extension(name));
}

export function getRelativePath(file: File): string {
  return (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
}

export function findLivePairStems(files: Pick<File, 'name'>[]): Set<string> {
  const byStem = new Map<string, Set<string>>();
  for (const file of files) {
    const ext = extension(file.name);
    if (!MEDIA_EXTENSIONS.has(ext)) continue;
    const key = stem(file.name);
    if (!byStem.has(key)) byStem.set(key, new Set());
    byStem.get(key)!.add(ext);
  }
  return new Set([...byStem.entries()]
    .filter(([, extensions]) => extensions.has('mov') && [...extensions].some(ext => IMAGE_EXTENSIONS.has(ext)))
    .map(([key]) => key));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[index]}`;
}

export async function hashFile(file: Blob, signal?: AbortSignal): Promise<string> {
  const hasher = sha256.create();
  const reader = file.stream().getReader();
  try {
    while (true) {
      throwIfAborted(signal);
      const { done, value } = await reader.read();
      if (done) break;
      throwIfAborted(signal);
      hasher.update(value);
    }
  } finally {
    if (signal?.aborted) await reader.cancel();
  }
  return [...hasher.digest()].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function readEdges(file: File, signal?: AbortSignal): Promise<boolean> {
  try {
    throwIfAborted(signal);
    const edge = 64 * 1024;
    await file.slice(0, Math.min(edge, file.size)).arrayBuffer();
    throwIfAborted(signal);
    if (file.size > edge) await file.slice(Math.max(0, file.size - edge), file.size).arrayBuffer();
    throwIfAborted(signal);
    return true;
  } catch {
    throwIfAborted(signal);
    return false;
  }
}

export async function scanMedia(
  sourceFiles: File[],
  backupFiles: File[],
  sourceLabel: string,
  backupLabel: string,
  onProgress: (progress: ScanProgress) => void = () => undefined,
  signal?: AbortSignal
): Promise<ScanReport> {
  throwIfAborted(signal);
  const source = sourceFiles.filter(file => isMedia(file.name));
  const backup = backupFiles.filter(file => isMedia(file.name));
  if (!source.length) throw new Error('The phone export contains no supported photos or videos. Choose the folder that contains the exported media.');

  onProgress({ stage: 'indexing', done: 0, total: source.length + backup.length, message: 'Indexing media by size and type…' });
  const sourceSizes = new Set(source.map(file => file.size));
  const relevantBackup = backup.filter(file => sourceSizes.has(file.size));
  const backupHashes = new Map<string, File[]>();

  for (let index = 0; index < relevantBackup.length; index += 1) {
    throwIfAborted(signal);
    const file = relevantBackup[index];
    onProgress({ stage: 'hashing-backup', done: index, total: relevantBackup.length, message: `Hashing backup ${index + 1} of ${relevantBackup.length}: ${file.name}` });
    const hash = await hashFile(file, signal);
    const matches = backupHashes.get(hash) || [];
    matches.push(file);
    backupHashes.set(hash, matches);
  }

  const liveStems = findLivePairStems(source);
  const results: ScanItem[] = [];
  const matchedFiles = new Map<string, File>();
  const recentBoundary = Date.now() - 90 * 24 * 60 * 60 * 1000;

  for (let index = 0; index < source.length; index += 1) {
    throwIfAborted(signal);
    const file = source[index];
    onProgress({ stage: 'hashing-source', done: index, total: source.length, message: `Checking export ${index + 1} of ${source.length}: ${file.name}` });
    const hash = await hashFile(file, signal);
    const match = backupHashes.get(hash)?.[0];
    const fileStem = stem(file.name);
    const ext = extension(file.name);
    const id = `${hash.slice(0, 12)}-${index}`;
    if (match) matchedFiles.set(id, match);
    results.push({
      id,
      name: file.name,
      relativePath: getRelativePath(file),
      bytes: file.size,
      modified: file.lastModified,
      recent: file.lastModified >= recentBoundary,
      kind: IMAGE_EXTENSIONS.has(ext) ? 'photo' : 'video',
      hash,
      status: match ? 'protected' : 'missing',
      backupName: match ? getRelativePath(match) : undefined,
      readState: 'not-sampled',
      liveRole: liveStems.has(fileStem) ? (ext === 'mov' ? 'motion' : 'still') : undefined
    });
  }

  const protectedItems = results.filter(item => item.status === 'protected');
  const sampleCount = Math.min(12, Math.max(0, Math.ceil(protectedItems.length * 0.1)));
  const sampleIds = new Set<string>();
  for (let index = 0; index < sampleCount; index += 1) {
    const position = Math.min(protectedItems.length - 1, Math.floor(index * protectedItems.length / sampleCount));
    if (position >= 0) sampleIds.add(protectedItems[position].id);
  }

  let sampled = 0;
  for (const item of results) {
    throwIfAborted(signal);
    if (!sampleIds.has(item.id)) continue;
    sampled += 1;
    onProgress({ stage: 'sampling', done: sampled - 1, total: sampleIds.size, message: `Opening sample ${sampled} of ${sampleIds.size}: ${item.name}` });
    const readable = await readEdges(matchedFiles.get(item.id)!, signal);
    item.readState = readable ? 'sampled-readable' : 'read-failed';
  }

  throwIfAborted(signal);

  for (const item of results) {
    if (!item.liveRole) continue;
    const pair = results.find(candidate => candidate.id !== item.id && stem(candidate.name) === stem(item.name) && candidate.liveRole && candidate.liveRole !== item.liveRole);
    item.livePairComplete = item.status === 'protected' && pair?.status === 'protected';
  }

  const liveIssueStems = new Set(results.filter(item => item.liveRole && !item.livePairComplete).map(item => stem(item.name)));
  const report: ScanReport = {
    id: `check-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    scannedAt: new Date().toISOString(),
    sourceLabel,
    backupLabel,
    sourceCount: source.length,
    backupCount: backup.length,
    ignoredSourceCount: sourceFiles.length - source.length,
    ignoredBackupCount: backupFiles.length - backup.length,
    protectedCount: results.filter(item => item.status === 'protected').length,
    missingCount: results.filter(item => item.status === 'missing').length,
    recentMissingCount: results.filter(item => item.status === 'missing' && item.recent).length,
    livePairIssues: liveIssueStems.size,
    sampledReadableCount: results.filter(item => item.readState === 'sampled-readable').length,
    sampledFailedCount: results.filter(item => item.readState === 'read-failed').length,
    items: results.sort((a, b) => Number(b.status === 'missing') - Number(a.status === 'missing') || b.modified - a.modified)
  };
  onProgress({ stage: 'done', done: source.length + relevantBackup.length, total: source.length + relevantBackup.length, message: 'Check complete.' });
  return report;
}
