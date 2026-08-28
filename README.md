# Photo Backup Sentinel

Photo Backup Sentinel is a local-first PWA for iPhone and Android owners who
copy camera exports to an external drive or mounted NAS. It answers a narrow,
important question: does every exported photo, video, and both halves of each
Live Photo have an identical second copy that the browser can read?

Live product: <https://photo-backup-sentinel.sociobot.in>

## What it does

- Recursively reads a user-selected phone export and backup directory.
- Streams SHA-256 fingerprints, so renamed identical files still match and
  large videos are not loaded fully into memory.
- Detects paired still + MOV Live Photos and reports incomplete pairs.
- Re-opens the first and last blocks of a deterministic 10% sample of matches.
- Prioritizes missing media modified in the last 90 days.
- Keeps the latest three checks in IndexedDB (30 with a one-time Pro license).
- Exports current evidence as JSON or CSV and imports Sentinel JSON history.
- Works offline after the first successful load.

It does **not** copy media, connect directly to a phone, upload files, parse or
store EXIF/location data, replace a photo library, or guarantee codec playback.
A sampled read is deliberately labelled separately from an exact hash match.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open the shown local URL, choose two folders, and run the check. Chromium-based
browsers provide the best directory-picker experience; other current browsers
use the directory-upload fallback.

## Test and build

```sh
npm test          # Vitest + Playwright desktop/mobile/offline/axe checks
npm run build     # exact deploy command; output is ./dist
npm run preview   # preview the production build
```

Playwright is pinned to 1.58.2. Its Chromium binary must be available via the
usual Playwright installation or `PLAYWRIGHT_BROWSERS_PATH`.

The static deployment root is `dist/`, with `dist/index.html` at its root.
`privacy/index.html` and `terms/index.html` are independent static routes.

## Privacy and payments

All media processing happens in the browser. Only report metadata is stored in
IndexedDB. There are no analytics, third-party fonts, runtime CDNs, or media
APIs. Sentinel Pro uses the Sociobot hosted checkout and daily license verify
endpoint; no payment provider is embedded here and no product ID is hardcoded.
The complete safety check and data exports remain free.

See [the visual thesis](.factory/design.md) and [the handoff](.factory/handoff.md)
for design provenance, validation results, and known limits.

## License

MIT — see [LICENSE](LICENSE).
