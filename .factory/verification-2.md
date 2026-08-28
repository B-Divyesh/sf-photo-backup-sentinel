# Independent product verification 2 — Photo Backup Sentinel

## Verdict: FAIL — do not release

- Candidate: `dd3834068c45daf24f1eb930c9cd72d4b172475a`
- Branch: `main`
- Live URL: <https://photo-backup-sentinel.sociobot.in/>
- Verified: 2026-08-28 UTC
- Contract: supplied researched brief, factory work order, and attached acceptance skills
- Product code changed during verification: no

The repaired candidate is deployed byte-for-byte, all 11 listed claim tests pass,
and the core checker works. It still fails release acceptance. The installed PWA
serves the home document for every navigation, so Privacy, Terms, and 404 routes
stop working as soon as the service worker controls the client. The claims
manifest also omits several material promises in the live product.

## First-read gate: PASS

Cold live load at 1440×900, with no prior storage or service worker:

- What it does: checks a phone-photo backup and finds missing files before the originals are deleted.
- For whom: phone owners who copy photos to a drive or NAS.
- What to click first: **Try it with sample data**.

The action is visible above the fold and opens `/demo/` in one click. The first
demo state already contains a completed, realistic check with one missing item.
This satisfies the explicit first-read failure gate. The smaller first-screen
facts requirement has a separate finding below.

## Claims gate

`.factory/claims.json` exists and contains 11 entries. Before installing, the
required first invocation of every command could not load `@playwright/test`, as
expected in a clean clone with no `node_modules`. After the documented `npm ci`,
every exact manifest command passed on both desktop Chromium and the 390 px
mobile project:

| Claim | Result | Observable assertion |
|---|---:|---|
| `demo-sandbox` | Pass | seeded result, demo IndexedDB namespace, reset |
| `exact-hash` | Pass | renamed identical bytes matched |
| `live-photo` | Pass | incomplete still/MOV pair reported |
| `read-sample` | Pass | sampled-readable evidence shown |
| `csv-export` | Pass | header plus four source rows |
| `json-export` | Pass | `photo-backup-sentinel/v1`, one report |
| `offline-reload` | Pass | cached root shell reloaded offline |
| `local-only` | Pass | demo flow made same-origin GET requests only |
| `history-limit` | Pass | fourth run retained exactly three records |
| `history-persistence` | Pass | records remained after reload |
| `price` | Pass | Terms states `$19` and one-time purchase |

Result after installation: **11 passed, 0 failed**. This does not cure the
unlisted-claim defect below; the claims contract requires both passing listed
tests and complete coverage of visitor-facing promises.

## Release-blocking findings

### V2-001 — High — the installed service worker breaks real routes

The worker handles every navigation with `caches.match('/')`. On both desktop
and 390 px mobile, fresh evidence was:

1. Open `/` and wait for `navigator.serviceWorker.controller`.
2. Navigate to `/privacy/`.
3. The URL remains `/privacy/`, but title is `Photo Backup Sentinel — prove your second copy`, the h1 is `Check your photo backup`, and the home checker is rendered.
4. Navigate to `/terms/`; the same home document appears.

Direct network loads of those routes return their correct legal documents, so
this is a service-worker routing defect, not a deployment failure. It also
changes an offline `/demo/` reload from `Demo — Photo Backup Sentinel` to the
home title. A controlled unknown route is likewise replaced by the home shell
once the worker controls the client instead of preserving the authored 404.

This violates real-route, legal-page, back/address-bar, offline, and page-title
requirements. It is particularly visible to installed/returning users.

### V2-002 — Critical — material live claims are absent from `claims.json`

The required page/README cross-check found material promises with no dedicated
claim entry and no observable sandbox test:

- “Only filenames, hashes, sizes, and check outcomes are stored. Media bytes are never saved.” No test inspects the IndexedDB payload.
- “Pro keeps a 30-check evidence timeline.” The manifest tests only the free three-record limit and the price.
- “Sentinel opens the first and last blocks of a deterministic 10% sample.” The listed test sees one sampled item but does not assert 10%, deterministic selection, or both file edges.
- “The token is sent ... no more than once per day.” No claim or cache-frequency test exists.
- “Offline mode — scanning and saved checks still work locally.” The listed offline test only reloads the shell and checks its heading; it does not scan or verify saved history offline.
- The privacy page also promises that media/EXIF/location fields are not stored and that files are not changed or copied; neither promise has the required storage/file-observation test.

The claims contract explicitly makes any unlisted claim a failed review. These
are privacy, paid-feature, quantitative, and offline claims a visitor could rely
on, not incidental prose.

### V2-003 — Medium — fallback rejects valid separate folders with the same name

When the File System Access API is unavailable, overlap detection compares only
the two leaf folder labels. Two distinct, non-overlapping folders named
`assets` were selected from `/work/repo/assets` and
`/work/repo/public/assets`. Each contained one supported media file. The app
refused to scan and said the folders overlap.

This affects browsers that use `webkitdirectory`, and common backup layouts
often retain names such as `DCIM` on both source and destination. Rejecting an
unsafe same-folder choice is correct, but equal leaf names do not establish
that the locations overlap.

### V2-004 — Medium — demo lifecycle does not discard sample state

The Demo contract says leaving demo mode discards demo data. Fresh `/demo/`
created only `demo:photo-backup-sentinel`; clicking **Start for real** left that
database present and created `photo-backup-sentinel` alongside it.

The demo also creates a new report on every load. A live offline reload changed
the demo history count from one to two. Reset returns it to one, but ordinary
refresh/reload accumulates duplicate sample checks up to the free limit.

### V2-005 — Medium — several mobile touch targets are below 44 px

At 390×844, the demo banner measured **Reset demo** at 93×39 px and **Start for
real** at 103×32 px. Legal-page inline and footer links measured 20 px high.
These violate the attached 44×44 px target requirement. Hidden, untabbable file
inputs were excluded from this finding.

### V2-006 — Low — first-screen facts and social image miss the site contract

The first screen answers the explicit cold-read questions, but its three short
facts are “Sample data opens a finished check. Local only. Free safety checks.”
It does not give the required offline fact or the paid product's exact one-time
price. The Open Graph/Twitter image is also 1152×768 rather than the required
1200×630 social asset; non-home documents do not provide equivalent social
metadata.

## Clean-clone quality gates

| Gate | Result | Evidence |
|---|---:|---|
| Candidate identity | Pass | `git rev-parse HEAD` = requested SHA |
| Install | Pass | `npm ci`; 72 packages, 0 vulnerabilities |
| Full test command | Pass | 6 Vitest tests + 22 Playwright runs |
| Type/lint | Pass | `npm run lint` (`tsc --noEmit`) |
| Production build | Pass | `npm run build`; `dist/` produced |
| Dependency audit | Pass | `npm audit --audit-level=high`; 0 vulnerabilities |

Production assets are within budget:

- JavaScript: 31.97 KB raw / 12.13 KB gzip (budget 200 KB)
- CSS: 14.91 KB raw / 4.27 KB gzip (budget 50 KB)
- Mobile AVIF hero: 66.33 KB (budget 300 KB)
- WebP fallback: 199.30 KB
- Fonts: none

## Deployment identity and response policy

The freshly built candidate and live deployment matched exactly:

| Artifact | SHA-256 |
|---|---|
| `index.html` | `7c7044a5d43b7723057d819f471f0a6f0be66ea4616d7de57ba8b663a4b47ff9` |
| `demo/index.html` | `d6a6fd822420950f1e24c6f1679324e95b156786277532ce0db2eb3cbc1d66c8` |
| `privacy/index.html` | `3f435394a06fdf4b8c453f94fc1868d879251eec949c42de68408e5e6a6e164b` |
| `terms/index.html` | `4cdfd5f9abec681063b74c0d518fca54f1eeb48c49433d1c910895338eea6a6e` |
| `sw.js` | `320bfe2aaa60df5d1b408069f354207cadca28b50e3073d2a4703a2e9dd5b54b` |
| `main-aetCVBkR.js` | `fb8b50aaa2ebf2f33d43640f7dad58c236a8125e9ea05396c1cc70b92fe62dc6` |
| `main-B1mJsH_i.css` | `db1635cc504d49929668113352d0f3de7afc07d0d859712c9ca3249d3e5f6055` |

Live responses include HSTS, CSP, `Referrer-Policy`, and
`X-Content-Type-Options`. Hashed JS/CSS return
`Cache-Control: public, max-age=31536000, immutable`; HTML and the worker use a
30-second revalidation policy. A network request to an unknown route returns
the authored 404 with HTTP 404. The installed-worker defect is separate and is
described in V2-001.

## Functional and recovery evidence

Normal fixture run:

- 3 source media and 2 backup media
- 2 exact matches, 1 missing item, 1 recent gap
- 1 incomplete Live Photo pair and 1 sampled readable match
- CSV contained header plus 3 data rows
- JSON used `photo-backup-sentinel/v1`
- valid JSON exported from Demo imported into a clean real-history namespace

Boundary and recovery runs:

- Same folder selected twice: rejected; selecting a separate backup recovered and completed.
- Unsupported-only source: clear error; selecting a valid source recovered and completed.
- Backup with no supported media: completed safely with all 3 source items missing.
- Malformed JSON import: rejected with a plain next step and no data loss.
- Cancellation during a delayed read: stopped, saved no history, and left results hidden.
- Invalid URL license: token stored under the documented key, removed from the URL, verified only with `api.sociobot.in`, and free mode remained available.
- All crawled internal links returned 200; checkout returned 303 to the hosted Sociobot/Dodo flow.

No sign-in exists, so the Entra authority requirement is not applicable. This
static PWA has no product backend or concurrency/persistence server boundary.
An AI feature would not improve the local hash-verification job, so the
AI-leverage check is not applicable.

## Privacy, accessibility, browser, and PWA evidence

- Complete live Demo flow made same-origin GET requests only. There were no analytics, CDN, font, or media-upload requests.
- The only expected cross-origin browser request was an explicit license verification to `https://api.sociobot.in`.
- Desktop 1440×900 and mobile 390×844 had no console errors, page errors, failed requests, or horizontal overflow in the exercised states.
- `/opt/fleet/lib/verify-url.sh` returned HTTPS 200, title/lang/one h1/main, no missing alt text, no unlabeled buttons, and no console/page errors.
- Axe found zero serious/critical issues on the completed Demo, Privacy, and Terms states on mobile; the repository suite covers both browser projects.
- Keyboard traversal skipped the hidden file/import inputs, had no trap, and showed the designed 3 px focus outline on visible controls.
- Reduced motion matched, changed smooth scrolling to `auto`, removed hero transforms, and reduced transitions to 0.01 ms.
- Manifest and 192/512/maskable icons are valid; live worker cache is `sentinel-v6`.
- A controlled update using the exact built worker plus a version-only change showed **App update ready**, replaced `sentinel-v6` with the new cache, and reloaded without errors.
- Live root/demo functionality reloads offline, but route/title/history defects are covered in V2-001 and V2-004.

## Performance

Fresh live Lighthouse mobile:

- Performance 99
- Accessibility 100
- Best Practices 100
- SEO 100
- FCP 1.0 s, LCP 1.3 s, TBT 140 ms, CLS 0, Speed Index 1.0 s

The available lab run does not report field INP. Bundle, LCP, and CLS budgets
pass; the interaction proxy remains below 200 ms.

## API allowance

The product-used Sociobot license endpoint was tested with a rapid sequential
burst from one client. Requests 1–30 returned 200. Request 31 and subsequent
requests returned 429 with `Retry-After: 4` (and `x-ratelimit-after: 4`). The
observed allowance is therefore 30 immediate requests per client before the
token bucket requires a four-second wait. The required 429 and `Retry-After`
behavior is present.

## Required release fixes

1. Make navigation caching route-aware: serve/cache the requested legal, Demo, and 404 documents instead of always returning `/`.
2. Add claim entries and observable tests for every privacy, 30-check, 10%/edge-read, once-daily verification, and offline workflow promise, or narrow the copy.
3. Replace equal-leaf-name fallback rejection with a safe confirmation/identity strategy that allows distinct folders such as source and backup `DCIM`.
4. Delete/reset the demo namespace when leaving Demo and avoid duplicate seeded reports on reload.
5. Raise all mobile interactive targets to at least 44×44 px.
6. Add the required offline/price first-screen facts and a real 1200×630 social image.
