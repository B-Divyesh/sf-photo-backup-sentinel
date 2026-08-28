# Independent product verification — Photo Backup Sentinel

## Verdict: FAIL — do not release

- Candidate: `d2f761a27ebba8bef57f57c000708fc8803f547a`
- Live URL: <https://photo-backup-sentinel.sociobot.in>
- Verified: 2026-08-28 UTC
- Contract: supplied researched brief, factory work order, and attached claims, demo, accessibility, performance, plain-words, PWA, paid-unlock, design, and site-structure requirements
- Product code changed during verification: no

The deployment is healthy and byte-for-byte matches the candidate, but the candidate fails mandatory release gates. It has no claims manifest or sample-data sandbox, and it can certify one folder as both copies of a backup.

## Release-blocking findings

### V-001 — Critical — mandatory claims manifest is absent

`.factory/claims.json` does not exist at the candidate commit. The required first command therefore produced:

```text
$ sed -n '1,240p' .factory/claims.json
sed: can't read .factory/claims.json: No such file or directory
```

No claim test list exists to execute. This is an automatic FAIL under the supplied contract. It also leaves every visitor-facing claim unlisted and without its required `@claim:<id>` sandbox test. Examples include:

- “Your photos never leave this device” and “no uploads”
- exact SHA-256 matching, Live Photo pairing, and the deterministic 10% sample
- JSON/CSV export and import
- three-check/30-check persistence
- offline operation after first load
- no analytics or media uploads

The existing tests contain no `@claim:` tags.

### V-002 — Critical — first-read and demo-sandbox gates fail

Cold live first read at 1440×900:

- What it does: compares a phone export with a backup and identifies missing photos and Live Photo halves.
- For whom: the first screen says “your phone,” but does not plainly name iPhone/Android owners or people who copy to a drive/NAS. That context appears only below the first screen.
- What to click first: “Check my backup.”

There is no “Try it with sample data” action, no one-click populated result, and no three-line privacy/offline/price facts. `/demo` returns the ordinary landing document with status 200. It has no demo banner, Reset demo, Start for real, sample media, or separate storage namespace. `.factory/demo.md` is absent. The app always opens IndexedDB database `photo-backup-sentinel`, so no demo isolation exists.

### V-003 — Critical — the same folder is accepted as both copies

Reproduction on the live deployment:

1. Set both hidden directory inputs to `tests/fixtures/source`.
2. Run the check.

Observed:

```text
Phone export: source — 3 media files
Second copy: source — 3 media files
Verdict: Second copy confirmed.
Ratio: 100% exact copies
History: source → source / All protected
```

The product does not compare directory handles or otherwise reject identical/overlapping roots. This can tell a user they have a second usable copy when only one physical folder exists, defeating the safety job in the brief.

### V-004 — High — legal routes have serious axe contrast failures

`@axe-core/playwright` against live 390×844 pages found one serious `color-contrast` violation on each of `/privacy/` and `/terms/`. The footer link uses `#304800` on `#171713`, measured at 1.75:1 instead of the required 4.5:1. The main landing and completed-result states had zero serious/critical axe findings.

### V-005 — High — “Stop after current file” does not stop a check

The control only displays:

> For file integrity, Sentinel finishes the current read before stopping. Reload the page to stop this check now.

It never changes scanner state or cancels work. In a 32 MiB matched-file check, invoking the control still ended with “Second copy confirmed.” The button label promises an operation it does not perform; long photo/video scans have no in-app cancellation or graceful recovery path.

## Other findings

### V-006 — Medium — keyboard focus enters invisible controls

Keyboard order reaches each 1×1 px `.visually-hidden` file input after its visible picker button. The computed 3 px focus outline exists but cannot be seen on a 1×1 clipped control. The header wordmark is also 38 px high, below the 44 px touch-target requirement. There was no keyboard trap, and visible controls otherwise showed the designed signal-green focus ring.

### V-007 — Medium — response policy, routing, metadata, and caching contract gaps

- Live responses have HSTS, `Referrer-Policy`, and `X-Content-Type-Options`, but no Content-Security-Policy.
- Hashed JS/CSS and images use `cache-control: public, must-revalidate, max-age=30`, not long-lived immutable caching.
- An unknown path returns the landing page with HTTP 200; there is no designed 404/status behavior.
- The landing page lacks canonical, Open Graph, Twitter-card, SVG favicon, and apple-touch metadata.
- Legal routes lack the standard skip link/header/footer structure, and all footers lack a version/build identifier.
- `.factory/copy-audit.md` is absent.

Lighthouse also reported the experimental `label-content-name-mismatch` audit for the header wordmark, although the scored accessibility category remained 100.

### V-008 — Low — malformed-import feedback exposes parser jargon

Importing `{bad` produces “History was not imported. Expected property name or '}' in JSON at position 1 (line 1 column 2).” It identifies the failure but does not give a plain next step and exposes parser-specific language.

## Clean-clone quality gates

| Gate | Result | Evidence |
|---|---:|---|
| Candidate identity | Pass | clean `main`; `git rev-parse HEAD` = `d2f761a27ebba8bef57f57c000708fc8803f547a` |
| Claims gate | **Fail** | `.factory/claims.json` missing; no claim commands available |
| Install | Pass | `npm ci`; 72 packages, 0 vulnerabilities |
| Unit/integration/E2E | Pass | `npm test`; 5 Vitest + 6 Playwright runs passed |
| Types | Pass | `npx tsc --noEmit` |
| Lint | N/A | no lint script/config exists |
| Production build | Pass | `npm run build`; `dist/` produced |
| Dependency audit | Pass | `npm audit --audit-level=high`; 0 vulnerabilities |

Production bundle sizes:

- JS: 29.64 KB raw / 11.22 KB gzip
- CSS: 14.37 KB raw / 4.19 KB gzip
- Hero: 66.33 KB AVIF / 199.30 KB WebP fallback
- Fonts: none

These are within the supplied static-product budgets.

## Deployment identity

Freshly built candidate artifacts exactly match production:

| Artifact | Candidate/live SHA-256 |
|---|---|
| `index.html` | `b9cfaf77d7cd99d25d36b0f0104eba0d5fb5352bbabe5afff258d1841359e42b` |
| `sw.js` | `dd3646168b48d001ec4cc5bc8a1c9945aefdec172b12d583b65afbd889217fb9` |
| `main-QECXQEya.js` | `3cafc10d76afee67f89d0cf68c530513f04f8495755d87ee3687056ef2860cd3` |
| `main-D5h7PQ32.css` | `1b7c0adffd9bfba6cc2351eebca13f9d87219c15637aa14f1c8cd4cb17114819` |

The live deployment therefore is the tested candidate; this is not a deployment-only failure.

## Functional evidence

Normal representative case (`tests/fixtures/source` vs `tests/fixtures/backup`):

- 3 source media, 2 backup media
- 2 exact matches, 1 missing item, 1 recent gap
- 1 incomplete Live Photo pair and 1 sampled readable match
- CSV download contained the header plus one row per source item (4 lines)
- JSON download used `photo-backup-sentinel/v1` with one report
- history survived online reload and offline reload

Boundary and recovery cases:

- Unsupported-only source: clear “no supported photos or videos” alert; choosing a valid source afterward recovered and completed.
- Backup with zero supported media: completed safely with 3/3 items missing and zero samples.
- Malformed history JSON: rejected without page/console failure.
- Four free checks: history counts progressed 1, 2, 3, 3 as promised.
- Same-folder selection: unsafe false confirmation, detailed in V-003.
- 32 MiB check cancellation: did not cancel, detailed in V-005.
- Invalid license URL: token stored under `sb_license:photo-backup-sentinel`, removed from the address bar, verification called the Sociobot endpoint, and invalid result kept free mode.
- Checkout endpoint: returned 303 to the hosted Dodo checkout through the Sociobot API; no provider is embedded in the app.
- Sign-in: not present; Entra requirement is not applicable.

## Browser, accessibility, privacy, and PWA evidence

- Desktop 1440×900 and mobile 390×844 completed the core workflow with no console errors, page errors, failed requests, or horizontal overflow.
- `/opt/fleet/lib/verify-url.sh` passed: HTTPS 200, 734 ms load, title/lang/one h1/main present, no missing image alt, no unlabeled buttons, no console/page errors.
- Reduced motion passed: media query matched, smooth scroll became `auto`, hero transform became `none`, and transition duration became 0.01 ms.
- Initial and full fixture-based workflow requests were same-origin only. No analytics, CDN, font, or media-upload requests were observed.
- Main/result axe: zero serious/critical. Legal axe: fails as V-004.
- Manifest, 192/512/maskable icons, active service-worker controller, and cache `sentinel-v4` were present.
- Offline reload passed both `/` and manifest start URL `/?source=pwa-v1`; the offline banner appeared and IndexedDB history remained available.
- A controlled QA-only worker-version change exercised the real update path; “App update ready. Reload” appeared with no errors.

## Performance

Fresh live Lighthouse mobile run:

- Performance 97
- Accessibility 100
- Best Practices 100
- SEO 100
- FCP 1.2 s, LCP 1.4 s, TBT 190 ms, CLS 0, Speed Index 1.2 s

LCP and CLS meet the contract. Lighthouse reported Max Potential FID 210 ms; this is a lab proxy, not measured INP.

## API rate limiting

The only product-used server endpoint is Sociobot license verification. A rapid sequential burst against the invalid-license verify URL returned 200 for the first 30 measured requests and first returned 429 on request 31. A follow-up 429 response included:

```text
retry-after: 0
x-ratelimit-after: 0
```

The required 429 and `Retry-After` behavior is present. Token-bucket refill produced occasional later 200 responses during the continuing burst.

## Required release fixes

1. Reject identical and overlapping source/backup directory selections before scanning.
2. Add the one-click isolated sample-data demo, `/demo`, persistent demo controls, separate namespace, and `.factory/demo.md`.
3. Add `.factory/claims.json`, one observable tagged test per claim, and remove or cover every unlisted claim.
4. Fix legal-page contrast and invisible keyboard stops; rerun axe on every route/state.
5. Implement real cancellation or rename/remove the false stop control.
6. Add CSP, immutable asset caching, real 404 behavior, required metadata/site skeleton, and the copy audit.
