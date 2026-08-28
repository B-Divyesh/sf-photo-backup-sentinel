import { describe, expect, it } from 'vitest';
import { findLivePairStems, formatBytes, hashFile, isMedia, scanMedia } from '../src/scanner';

function media(name: string, value: string, modified = Date.now()): File {
  return new File([value], name, { type: 'application/octet-stream', lastModified: modified });
}

describe('media scanner', () => {
  it('recognizes phone photo and video formats without accepting sidecars', () => {
    expect(isMedia('IMG_001.HEIC')).toBe(true);
    expect(isMedia('IMG_001.MOV')).toBe(true);
    expect(isMedia('IMG_001.AAE')).toBe(false);
    expect(formatBytes(1024)).toBe('1.00 KB');
  });

  it('identifies Live Photo stems only when still and motion assets coexist', () => {
    const stems = findLivePairStems([media('IMG_10.HEIC', 'a'), media('IMG_10.MOV', 'b'), media('IMG_11.JPG', 'c')]);
    expect([...stems]).toEqual(['img_10']);
  });

  it('creates stable SHA-256 content fingerprints', async () => {
    expect(await hashFile(new Blob(['sentinel']))).toBe('2b7847b7b705781d7cf21a05e9c1bb37cbf078aea103bc3edcc6aca52ab65453');
  });

  it('matches renamed identical content and flags a broken Live Photo pair', async () => {
    const source = [media('IMG_10.HEIC', 'still'), media('IMG_10.MOV', 'motion'), media('new.jpg', 'unique')];
    const backup = [media('renamed.heic', 'still'), media('old.jpg', 'something else')];
    const report = await scanMedia(source, backup, 'Phone', 'Drive');
    expect(report.protectedCount).toBe(1);
    expect(report.missingCount).toBe(2);
    expect(report.livePairIssues).toBe(1);
    expect(report.items.find(item => item.name === 'IMG_10.HEIC')?.backupName).toBe('renamed.heic');
    expect(report.sampledReadableCount).toBe(1);
  });

  it('explains an empty or unsupported export', async () => {
    await expect(scanMedia([media('edits.AAE', 'sidecar')], [], 'Phone', 'Drive')).rejects.toThrow('no supported photos or videos');
  });
});
