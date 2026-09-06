import type { ScanReport } from './scanner';

const DB_NAME = 'photo-backup-sentinel';
const STORE = 'checks';
let namespace = 'real';

export function setStorageNamespace(nextNamespace: 'real' | 'demo'): void {
  namespace = nextNamespace;
}

export function currentStorageName(): string {
  return namespace === 'demo' ? `demo:${DB_NAME}` : DB_NAME;
}

export function deleteDemoStorage(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(`demo:${DB_NAME}`);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other Demo tabs, then try again.'));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(currentStorageName(), 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearReports(): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function saveReport(report: ScanReport, historyLimit: number): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(report);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  const reports = await getReports();
  for (const stale of reports.slice(historyLimit)) await deleteReport(stale.id);
  database.close();
}

export async function getReports(): Promise<ScanReport[]> {
  const database = await openDatabase();
  const reports = await new Promise<ScanReport[]>((resolve, reject) => {
    const request = database.transaction(STORE).objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as ScanReport[]);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return reports.sort((a, b) => b.scannedAt.localeCompare(a.scannedAt));
}

export async function deleteReport(id: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function importReports(reports: ScanReport[], historyLimit: number): Promise<void> {
  for (const report of reports.slice(0, historyLimit)) await saveReport(report, historyLimit);
}
