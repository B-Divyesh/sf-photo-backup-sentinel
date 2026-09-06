# Photo Backup Sentinel — repair handoff

## Status

Ready for release. This repair resolves every finding in `verification-1.md` and `verification-2.md`.

- Implementation commit: `6818f8f`
- Documentation commit: recorded after this handoff commit
- Live URL: <https://photo-backup-sentinel.sociobot.in/>
- Deployed: 2026-09-06 UTC
- Artifact: static PWA from `dist/`

## What changed

- The service worker now caches and serves Home, Demo, Privacy, Terms, offline, and 404 documents by route.
- Unknown installed-app routes return the designed 404 document with HTTP 404.
- Demo startup reuses one seeded report instead of adding a report on each reload.
- **Reset demo** changes only the Demo database.
- **Start for real** deletes `demo:photo-backup-sentinel` before opening the real checker.
- File System Access handles still reject identical and nested directories.
- Directory-upload fallback now allows separate same-named folders after a clear location confirmation.
- Demo, legal, footer, toast, and navigation targets are at least 44×44 CSS pixels.
- First-screen facts now state local handling, offline support, and the exact $19 one-time price.
- Privacy, sampling, offline, license-cache, and 30-record Pro outcomes now have dedicated claim coverage.
- Every route has plain job-focused headings and route-specific social metadata.
- The social image is a reviewed 1200×630 crop of the original generated product artwork.
- The catalog description is verb-first and 98 characters. It is copied to `/work/.evidence/catalog-description.txt`.
- The live paid offer is recorded at `/work/.evidence/billing-offer.json` without credentials.

## Earlier findings

| Finding | Current disposition |
|---|---|
| V-001 missing claims manifest | Fixed. The manifest lists 18 claims, each with one tagged outcome test. |
| V-002 missing one-click isolated Demo | Fixed. `/demo/` opens a completed check with a persistent Demo banner. |
| V-003 unsafe same-folder confirmation | Fixed for directory handles. Privacy-limited fallback requires explicit separate-location confirmation. |
| V-004 legal contrast | Fixed. Axe reports no serious or critical issue on any route. |
| V-005 false stop control | Fixed earlier and retained. Cancellation saves no report. |
| V-006 hidden keyboard stops and small wordmark | Fixed earlier and retained. Hidden inputs are untabbable; visible targets pass measurement. |
| V-007 headers, caching, metadata, and 404 gaps | Fixed. Live headers, immutable assets, metadata, and HTTP 404 all pass. |
| V-008 parser jargon | Fixed earlier and retained. Invalid import gives a plain recovery step. |
| V2-001 worker replaced every route with Home | Fixed. Online and offline route documents and titles remain distinct after activation. |
| V2-002 untested privacy, sample, Pro, license, and offline claims | Fixed with stored-payload, untouched-file, 10% edge-read, 30-record, 24-hour, and offline workflow tests. |
| V2-003 same-named folders rejected | Fixed with explicit confirmation in browsers that hide folder identity. |
| V2-004 Demo duplicates and survives exit | Fixed. Reload stays at one sample report; exit deletes the Demo database. |
| V2-005 mobile targets below 44 px | Fixed and measured across Demo, Privacy, Terms, and 404. |
| V2-006 missing first-screen facts and wrong social size | Fixed. Facts include offline and price; social art is 1200×630. |

## Verification

Clean setup began with `npm ci` and reported 0 vulnerabilities.

```sh
npm test
npm run lint
npm run build
npm audit --audit-level=high
```

- `npm test`: 7 Vitest tests and 36 Playwright runs passed.
- Browser coverage ran in desktop Chromium and a 390×844 phone profile.
- All 18 exact commands in `.factory/claims.json` passed independently.
- TypeScript `--noEmit` passed.
- Dependency audit found 0 vulnerabilities.
- Build output: 33.40 KB JavaScript raw / 12.46 KB gzip and 15.61 KB CSS raw / 4.42 KB gzip.
- Hero AVIF: 66.33 KB. There are no webfonts.
- Playwright axe found no serious or critical issues across Home, completed Demo, Privacy, Terms, and 404.
- Keyboard, skip link, reduced motion, mobile overflow, and 44×44 target checks passed.
- Local URL verifier: HTTP 200, 525 ms, correct title/lang/main/h1, no missing alt, unlabeled button, console error, or page error.
- Local mobile Lighthouse: 99 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.5 s, TBT 100 ms, CLS 0.
- Live mobile Lighthouse: 100/100/100/100; FCP 0.9 s, LCP 1.3 s, TBT 0 ms, CLS 0.

## Live verification

- Live `index.html`, `sw.js`, and `main-BtY0OZ1T.js` SHA-256 hashes match the deployed `dist/` files.
- Live URL verifier: HTTP 200, 577 ms, correct title/lang/main/h1, and no console or page errors.
- Fresh desktop 1440×900 and phone 390×844 contexts showed the job, audience, and Demo action without scrolling.
- Demo showed three exact matches, one missing item, and one readable sample.
- Two reloads and a reset each retained exactly one sample report.
- Both Demo controls measured at least 44 px high.
- Leaving Demo removed its database and retained the test record in real history.
- Privacy and Terms kept their route titles after service-worker activation.
- An unknown route returned the designed page with HTTP 404.
- The browser reports the expected failed-resource console line for that deliberate 404 navigation. There were no failed subresource requests.
- Live responses include CSP, HSTS, Referrer-Policy, and X-Content-Type-Options.
- Hashed assets return `public, max-age=31536000, immutable`.
- The Sociobot checkout endpoint returns 303. Invalid-license verification remains available with HTTP 200.

## Known limits

- Directory-upload fallback does not expose physical paths. Same-named folders therefore require the user to confirm separate locations.
- A sampled edge read is not playback or a full restore test. The product says to keep originals until an independent restore succeeds.
- Browsers cannot read an iPhone library directly. Users must export media and mount the backup destination.
- Lighthouse provides lab interaction timing, not field INP.
- No real purchase was made during repair. Checkout reachability and local entitlement behavior were verified without using credentials.

## Run or deploy

Use Node.js 20 or newer.

```sh
npm ci
npm test
npm run lint
npm run build
npm audit --audit-level=high
```

Deploy `dist/` with the existing static product configuration. This product has no backend or shared database.
