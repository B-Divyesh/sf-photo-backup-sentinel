# Photo Backup Sentinel

Check your photo backup before deleting originals. It is for phone owners who copy camera exports to an external drive or mounted NAS.

Try the finished sample at `/demo/`. It opens a seeded check in the `demo:photo-backup-sentinel` IndexedDB database, separate from real history. Use **Reset demo** to start the sample again or **Start for real** to discard the demo context.

## What it does

- Matches identical photo and video bytes, including renamed copies.
- Reports incomplete still-plus-MOV Live Photo pairs.
- Opens and reads a deterministic sample of matched backup files.
- Exports the current report as CSV or Sentinel JSON.
- Keeps the latest three free checks locally and retains them after refresh.
- Works offline after a successful first load.

Media stays in the browser during the sample check. The demo makes no cross-origin or write request. The checker does not copy files or replace a restore test.

Sentinel Pro is a $19 one-time purchase for a 30-check local timeline. The safety check and exports are free.

## Run locally

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open the local URL and choose separate source and backup folders. The app rejects the same or overlapping folders because one location cannot be certified as a second copy.

## Verify and build

```sh
npm test
npm run lint
npm run build
npm audit --audit-level=high
```

`dist/` is the static deployment root. Playwright is pinned to 1.58.2; the Chromium binary must be available through `PLAYWRIGHT_BROWSERS_PATH` or installed with `npx playwright install chromium`.

Every visitor-facing product claim is listed in [.factory/claims.json](.factory/claims.json), with its sandbox command. The demo contract is documented in [.factory/demo.md](.factory/demo.md).

## Privacy and terms

Read [/privacy/](privacy/index.html) and [/terms/](terms/index.html). No third-party fonts, runtime CDN scripts, analytics SDKs, or embedded payment provider are used. Sentinel Pro uses the Sociobot hosted checkout and verification endpoint.

## License

MIT — see [LICENSE](LICENSE).
