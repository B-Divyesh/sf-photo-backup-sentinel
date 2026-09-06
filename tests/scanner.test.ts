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

  it('stops a scan before a file is certified when its abort signal is raised', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(scanMedia([media('IMG_10.HEIC', 'still')], [media('copy.HEIC', 'still')], 'Phone', 'Drive', () => undefined, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
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

  it('@claim:read-sample reads both edges of a deterministic 10 percent sample', async () => {
    class TrackingFile extends File {
      reads: { start?: number; end?: number }[] = [];

      override slice(start?: number, end?: number, contentType?: string): Blob {
        this.reads.push({ start, end });
        return super.slice(start, end, contentType);
      }
    }

    const makeFiles = () => {
      const source: File[] = [];
      const backup: TrackingFile[] = [];
      for (let index = 0; index < 20; index += 1) {
        const bytes = new Uint8Array(70_000).fill(index);
        const suffix = String(index).padStart(2, '0');
        source.push(new File([bytes], `IMG_${suffix}.JPG`, { lastModified: 1_700_000_000_000 }));
        backup.push(new TrackingFile([bytes], `COPY_${suffix}.JPG`, { lastModified: 1_700_000_000_000 }));
      }
      return { source, backup };
    };

    const firstFiles = makeFiles();
    const first = await scanMedia(firstFiles.source, firstFiles.backup, 'Phone', 'Drive');
    const firstNames = first.items.filter(item => item.readState === 'sampled-readable').map(item => item.name).sort();
    expect(firstNames).toEqual(['IMG_00.JPG', 'IMG_10.JPG']);
    expect(first.sampledReadableCount).toBe(2);
    const reads = firstFiles.backup.flatMap(file => file.reads);
    expect(reads).toHaveLength(4);
    expect(reads.filter(read => read.start === 0 && read.end === 65_536)).toHaveLength(2);
    expect(reads.filter(read => read.start === 4_464 && read.end === 70_000)).toHaveLength(2);

    const secondFiles = makeFiles();
    const second = await scanMedia(secondFiles.source, secondFiles.backup, 'Phone', 'Drive');
    expect(second.items.filter(item => item.readState === 'sampled-readable').map(item => item.name).sort()).toEqual(firstNames);
  });
});
