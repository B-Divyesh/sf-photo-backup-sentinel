# Photo Backup Sentinel — repair handoff

## Status: ready for static deployment

This repair addresses every release-blocking finding from independent report `verification-1.md` against candidate `d2f761a27ebba8bef57f57c000708fc8803f547a`.

## Repairs

- Added `.factory/claims.json` with 11 visitor-facing claims and one exact `@claim:` Playwright test tag for each.
- Added `/demo/` as a seeded, one-click check with renamed exact copies and an incomplete Live Photo pair. The persistent demo banner has **Reset demo** and **Start for real** controls. Demo reports use `demo:photo-backup-sentinel`; real reports remain in `photo-backup-sentinel`. See `.factory/demo.md`.
- Rejects identical and nested source/backup handles with `isSameEntry`/`resolve`. The directory-upload fallback refuses equal folder roots instead of certifying an unsafe second copy.
- Implemented cancellation through `AbortController` and the hashing/read loops. A stopped check ends with a clear message and saves no report.
- Reworked legal routes with skip links, landmarks, consistent navigation/footer build id, and high-contrast footer links. Hidden file inputs are removed from keyboard navigation; the visible picker buttons remain the operable controls.
- Added static response configuration: CSP, referrer/content-type headers, immutable hashed-asset caching, and an authored `404.html` with Azure Static Web Apps 404 override.
- Added canonical/Open Graph/Twitter metadata, SVG favicon, Apple touch icon, demo sitemap entry, and a CSP-compatible external asset build. The versioned `sentinel-v6` worker precaches all routes/assets and now serves the cached shell first for dependable offline reload.
- Added copy audit and clearer malformed-import guidance without parser jargon.

## Verification performed on 2026-08-28 UTC

```sh
npm ci
npm test
npm run lint
npm run build
npm audit --audit-level=high
```

- `npm test`: 6 Vitest scanner tests and 22 Playwright tests passed (desktop Chromium plus 390×844 mobile).
- `npm run lint`: TypeScript `--noEmit` passed.
- `npm run build`: passed and produced `dist/` with root `index.html`, `demo/`, privacy, terms, `404.html`, service worker, and static deployment policy.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- Claims manifest check confirmed 11 claim IDs and exactly one matching test tag each.
- Browser regressions cover same-folder rejection, actual cancellation/no saved report, seeded demo isolation/reset, exact renamed match, incomplete Live Photo pair, sampled read, CSV/JSON content, history limit/persistence, offline reload, local-only request policy, legal axe checks, 390px overflow, keyboard tab order, and skip link.
- `@axe-core/playwright`: zero serious/critical findings on completed demo result and both legal routes, on desktop and mobile projects.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ .factory/evidence`: 200, 548 ms load, title/lang/one h1/main present, zero missing alt text, zero unlabeled buttons, and zero console/page errors.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.4 s and CLS 0. Desktop run scored 100/100/100/100 with LCP 0.3 s and CLS 0.
- Built assets: JavaScript 31.97 KB raw / 12.13 KB gzip; CSS 14.91 KB raw / 4.27 KB gzip; no webfonts. Both remain below static-product budgets.

## Known limits

- Browser folder permissions do not expose absolute paths for directory-upload fallback. Equal roots are deliberately rejected; the File System Access path additionally detects nested directory handles.
- A sampled read detects readable byte ranges, not media codec playback or a full restore. Keep originals until an independent restore succeeds.
- Vite preview does not emulate Static Web Apps response headers or 404 behavior. The production deployment was checked separately below.

## Deploy

Static artifact: `dist/`. Push the committed `main` branch; the factory static deployment configuration consumes `dist/` and `staticwebapp.config.json`.

Deployment was completed with `/opt/fleet/lib/deploy-static.sh photo-backup-sentinel /work/repo/dist` at 2026-08-28 10:33 UTC. The existing Central US Static Web App was reused and uploaded successfully.

- `https://photo-backup-sentinel.sociobot.in/`: HTTP 200; deployed bundle `main-aetCVBkR.js` matches the repair build.
- Live response includes the configured CSP, `Referrer-Policy`, and `X-Content-Type-Options`.
- `https://photo-backup-sentinel.sociobot.in/demo/`: HTTP 200.
- An unknown live route returned HTTP 404 and the authored recovery page.
- Live `/opt/fleet/lib/verify-url.sh` check: HTTP 200, 609 ms load, zero console/page errors, one `h1`, `main`, `lang=en`, no missing image alt text, and no unlabeled buttons.
