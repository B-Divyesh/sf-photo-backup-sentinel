const SLUG = 'photo-backup-sentinel';
const API_BASE = 'https://api.sociobot.in/api/v1';
const TOKEN_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${TOKEN_KEY}:verdict`;

interface CachedVerdict { valid: boolean; checkedAt: number; reason?: string }

export function captureLicenseFromUrl(): void {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(VERDICT_KEY);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function getStoredLicense(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function storeLicense(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function cachedProState(): boolean {
  const token = getStoredLicense();
  if (!token) return false;
  try {
    return (JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}') as CachedVerdict).valid === true;
  } catch {
    return false;
  }
}

export async function verifyLicense(force = false): Promise<{ valid: boolean; reason: string }> {
  const token = getStoredLicense();
  if (!token) return { valid: false, reason: 'missing' };
  const cached = (() => {
    try { return JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}') as CachedVerdict; }
    catch { return {} as CachedVerdict; }
  })();
  if (!force && cached.checkedAt && Date.now() - cached.checkedAt < 86_400_000) {
    return { valid: Boolean(cached.valid), reason: cached.reason || 'cached' };
  }
  const response = await fetch(`${API_BASE}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error('License service is temporarily unavailable.');
  const verdict = await response.json() as { valid: boolean; reason: string };
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: verdict.valid, reason: verdict.reason, checkedAt: Date.now() }));
  return verdict;
}

export const checkoutUrl = `${API_BASE}/products/${SLUG}/checkout`;
