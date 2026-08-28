# Photo Backup Sentinel — build handoff

## Shipped

- A production Vite + vanilla TypeScript PWA with a product-specific
  cassette-era zine interface at desktop and 390 px layouts.
- Recursive local folder selection through the File System Access API, with a
  directory-input fallback.
- Streaming SHA-256 comparison of supported photo/video media. Matching is by
  content, so renamed copies are recognized; only backup files with relevant
  byte sizes are hashed.
- Live Photo detection for same-stem still + MOV pairs, missing/recent filters,
  exact-copy evidence, and a deterministic 10% first/last-block read sample.
- Clear separation between byte-identical hash proof, sampled read proof, and
  codec playback (which the product does not claim to verify).
- IndexedDB check history (3 checks free, 30 with Pro), full current-report
  JSON/CSV export, and JSON history import.
- A $19 one-time Sentinel Pro offer using only the Sociobot checkout and daily
  license verification contract, including URL token capture, cached offline
  access, invalid-license reconciliation, and paste-to-restore. All safety
  checks and exports remain free.
- Versioned service-worker precaching of the complete interactive shell,
  network fallback, update notification, install manifest, 192/512/maskable
  icons, and a styled offline fallback.
- Static `/privacy/` and `/terms/` routes; no analytics, third-party fonts,
  runtime CDNs, or photo uploads.
- Original generated hero art plus authored icon, prompt sidecar, and full
  provenance/art direction in `.factory/design.md`.

## Verification

Run from a clean checkout:

```sh
npm install
npm test
npm run build
```

Results on 2026-08-28:

- `npm test`: 5 Vitest unit tests and 6 Playwright tests passed.
- Playwright covers the real folder-to-verdict path, renamed content match,
  missing Live Photo motion half, local history, desktop, 390×844 mobile,
  privacy/terms routes, axe, console errors, and explicit offline reload.
- Axe: zero serious or critical violations in the completed-result state.
- `/opt/fleet/lib/verify-url.sh`: title present, `lang=en`, one `h1`, `main`
  present, zero images without alt text, zero unlabeled buttons, zero console or
  page errors. Measured local production load: 543 ms.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.5 s, total blocking time 0 ms, CLS 0.
- Production build: 29.62 KB JS (11.33 KB gzip), 14.37 KB CSS (4.19 KB gzip).
  The complete shell is also inlined into the cached document for reliable
  cold-offline reload. Hero: 66 KB AVIF / 199 KB WebP. No webfonts.
- `npm audit`: zero vulnerabilities.
- `npm run build` reproducibly writes `dist/index.html`, `dist/privacy/`, and
  `dist/terms/` with `dist/` as the deployment root.

## Known limits

- Browser/OS permissions require users to export iOS media first and mount
  external drives or NAS shares as folders. Direct iPhone library access is not
  available to a static PWA.
- Live Photo pairing uses the common same-basename still + MOV convention. An
  export tool that renames the two halves independently cannot be inferred
  safely without reading private metadata.
- “Recent” uses the filesystem modified time exposed by the browser; an export
  tool may replace the original capture time with its copy time.
- The read sample detects local read failures, not HEIC/MOV decoding or full
  playback compatibility. Users are explicitly told to perform periodic real
  restores and not delete originals based only on this report.
- The factory must register the `photo-backup-sentinel` paid product and return
  URL in the Sociobot billing engine before checkout can complete in production.

## Suggested next steps

Pilot with varied Apple/Google export structures and large mounted drives;
measure repeated-check completion and repaired gaps. If browsers expose a
portable streaming file-hash primitive in future, benchmark it against the
current audited pure-JS streaming implementation.
