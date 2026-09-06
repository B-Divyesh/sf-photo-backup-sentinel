# Verify photo backups before deleting originals — verification 3

## Verdict: FAIL — do not release

- Findings: **2** (0 critical, 2 high, 0 medium, 0 low)
- Untested public claims: **2**
- Implementation reviewed: `6818f8fcc24bfcf1913ed597d0ba794a4f214891`
- Documentation baseline reviewed: `f9132bfbcc90efdd7576711e11259654c297c0c3`
- Live URL: <https://photo-backup-sentinel.sociobot.in/>
- Verified: 2026-09-06 UTC
- Product code changed during verification: no

The implementation and live deployment work end to end. The build, full test
suite, all 18 declared claim commands, accessibility checks, offline workflow,
and deployment comparison pass. Acceptance still fails because two statements
in public copy have no complete tagged claim test. The supplied claims contract
makes either gap a release blocker.

## First screen before scrolling

- Job: check a phone-photo backup and find missing files before deleting the originals.
- Audience: phone owners who copy photos to a drive or NAS.
- First action: **Try it with sample data**. It says that a finished sample check will open.

These points were visible at initial scroll position zero in fresh 1440×900
desktop and 390×844 phone contexts. The page uses one job-focused `h1` and the
three facts cover local handling, offline use, and the $19 one-time price.

## Findings

### V3-001 — High — sampled-read failure detection is not in a complete claim test

Public method copy says, “This catches basic read errors.” The ledger also
reports “Sample read failed.” The `read-sample` manifest entry and tagged unit
test prove deterministic 10% selection and successful first/last 64 KiB reads.
They never make an edge read fail or assert `read-failed`,
`sampledFailedCount`, the unsafe verdict, or the visible recovery evidence.

An independent live check forced the sampled edge read to reject. The product
correctly showed **Sample read failed** and zero successful samples, so this is
not a current runtime defect. It is an untested public safety claim and could
regress while every declared command remains green.

Required disposition: add a listed claim for failed sampled reads, or expand
`read-sample`, and make its tagged command force a read failure and assert the
report plus visible result.

### V3-002 — High — refund/revocation handling is public but absent from the claim suite

The Pro copy says, “Refunds are handled there and revoke the license.” Terms
also say Sociobot/Dodo handles checkout, receipts, taxes, and refunds as
merchant of record. The `price` test proves the $19 offer and checkout URL.
The `license-restore` test returns only `valid: true`. No declared claim or
tagged test supplies `reason: "revoked"`, proves Pro becomes locked, or proves
the free checker remains available.

An independent browser check supplied a recorded revoked response. The current
app correctly returned to the three-check free edition and said free checks
still work. The live checkout also returned HTTP 303 to the hosted Dodo page.
The behavior works, but the public revocation promise is not protected by the
required claim gate.

Required disposition: list the revoked-license outcome and test it with a
recorded `valid: false, reason: "revoked"` response. The test should assert the
free fallback and removal of the 30-check entitlement.

## Declared claim commands

The documented prerequisite `npm ci` completed first with 72 packages and zero
vulnerabilities. Every exact command from `.factory/claims.json` then ran from
the clean checkout. Browser commands ran in desktop Chromium and the 390×844
phone project.

| Claim | Result | Observed proof |
|---|---:|---|
| `demo-sandbox` | Pass | isolated database, stable reload, reset action, exit deletion, real marker preserved |
| `exact-hash` | Pass | three seeded renamed byte matches |
| `live-photo` | Pass | incomplete still/MOV pair shown |
| `no-account` | Pass | completed sample without credentials or sign-in |
| `read-sample` | Pass | deterministic 2/20 sample; both 64 KiB edges read |
| `csv-export` | Pass | header and four source rows |
| `json-export` | Pass | `photo-backup-sentinel/v1` and one report |
| `json-import` | Pass | Demo export restored into real history |
| `offline-workflow` | Pass | routes, scan, saved history, legal pages, and 404 offline |
| `local-only` | Pass | same-origin GET requests only; no cookie |
| `stored-metadata` | Pass | metadata only; no binary, EXIF, location, or folder handle |
| `read-only-files` | Pass | fixture names, sizes, times, and SHA-256 values unchanged |
| `history-limit` | Pass | latest three free checks retained |
| `history-persistence` | Pass | same records after reload |
| `pro-history-limit` | Pass | 30 visible and stored records from 31 imports |
| `license-restore` | Pass | callback and pasted valid tokens stored and verified |
| `daily-license-check` | Pass | one verification after stale cache; none on next reload |
| `price` | Pass | exact $19 one-time offer and Sociobot checkout navigation |

Result: **18 passed, 0 failed**. V3-001 and V3-002 are additional public-claim
coverage gaps, so the untested-claim count is 2.

## Live user paths

The one-click sample opened a populated result with four source assets, three
backup assets, three exact matches, one missing item, one incomplete Live Photo
pair, and one readable sample. The Demo banner stayed present. Two reloads kept
one report. A completed reset replaced the report with one fresh sample report.
Starting for real deleted `demo:photo-backup-sentinel`, retained the synthetic
real-history marker, and showed no Demo record in real history.

Normal, invalid, boundary, and recovery checks passed:

- The real fixture produced two exact matches, one missing item, one Live Photo issue, and one readable sample.
- An unsupported source produced a plain recovery step; choosing the valid source then completed a check.
- A backup with no supported media safely reported all three source assets missing.
- Malformed JSON was rejected with a plain next step and did not change history.
- Identical directory handles were rejected before scanning.
- Same-named fallback folders required confirmation; separate same-named folders then completed.
- **Stop check** aborted a delayed scan, saved no report, and left results hidden.
- A simulated sample read failure was reported in the ledger.
- Invalid live license verification returned the free edition. A network failure retained cached access. A recorded revoked response removed Pro and kept free checks.

Fixture hashes before and after the browser checks were identical.

## Accessibility, mobile, and privacy

- Axe returned zero violations of any impact on Home, completed Demo, Privacy, Terms, and 404 at 390×844.
- Each route has `lang`, one `h1`, `main`, header/navigation/footer landmarks, route metadata, alt text, and a working skip link.
- Keyboard traversal had no trap and skipped the hidden file inputs. Visible focus uses the 3 px signal-green outline.
- Interactive targets measured at least 44×44 CSS pixels on the tested mobile routes. There was no horizontal overflow.
- A half-width desktop viewport used as the 200% zoom reflow check kept all main text and headings with no horizontal overflow.
- Reduced motion changed smooth scrolling to `auto`, removed hero transforms, and reduced transitions to 0.01 ms.
- Errors use `role="alert"`; network, update, and license messages use status regions. No dialog is present.
- The privacy page explains local storage, export-before-clear, license requests, and provides `privacy@sociobot.in` for privacy questions.
- Complete sample and real checks made no cross-origin or write request and set no cookie. The only cross-origin runtime request exercised was explicit license verification to `api.sociobot.in`.

## PWA, routes, links, and HTTP behavior

- Worker `sentinel-v7` controlled a fresh client.
- After going offline, Demo reloaded, ran a fixture check, retained two history records after reload, and showed the offline notice.
- Privacy and Terms kept their correct documents and titles online and offline.
- An unknown offline route returned the designed page with HTTP 404.
- A controlled in-memory worker-version change displayed **App update ready. Reload**.
- All internal links and hash targets resolved. Privacy/support `mailto:` links are explicit.
- The checkout endpoint returned HTTP 303 to hosted Dodo checkout.
- Unknown live paths return the designed document with HTTP 404; the expected 404 resource message is not treated as a defect.
- HTML and worker responses use short revalidation. Hashed assets use one-year immutable caching.
- Live responses include CSP, HSTS, Referrer-Policy, and `X-Content-Type-Options`.
- Manifest name, standalone display, versioned start URL, theme colors, 192/512 icons, and a 512 maskable icon are present.
- The social image is 1200×630. Hero AVIF is 66.33 KB. No webfont is shipped.

This is a static local-first PWA. It has no product backend, tenant boundary,
server persistence, restart state, or shared database to test. Billing is the
external Sociobot flow. No AI feature would improve the core local hash and
read-verification job.

## Earlier findings

| Earlier finding | Current disposition |
|---|---|
| V-001 missing claims manifest | Original defect fixed: 18 entries and commands exist. Two new coverage gaps are V3-001 and V3-002. |
| V-002 missing first read and Demo | Fixed: job, audience, action, populated Demo, banner, reset, and exit pass live. |
| V-003 same folder certified | Fixed: identical/overlapping handles are rejected; ambiguous fallback needs confirmation. |
| V-004 legal contrast | Fixed: axe reports zero violations on both legal routes. |
| V-005 stop control did not stop | Fixed: cancellation saves no report and gives a recovery step. |
| V-006 invisible keyboard stops and small wordmark | Fixed: hidden inputs are untabbable; focus and target size pass. |
| V-007 headers, caching, metadata, and 404 | Fixed: live response policy, metadata, immutable assets, and HTTP 404 pass. |
| V-008 parser jargon | Fixed: malformed import gives a plain next step and preserves history. |
| V2-001 worker replaced route documents | Fixed: online/offline route documents and titles remain distinct. |
| V2-002 missing privacy, sample, Pro, license, and offline tests | The specifically listed V2 gaps are fixed. V3-001 and V3-002 identify two narrower public claims still uncovered. |
| V2-003 same-named folders rejected | Fixed: explicit confirmation permits distinct same-named folders. |
| V2-004 Demo duplicates and survives exit | Fixed: reload stays at one report; reset replaces it; exit deletes Demo storage. |
| V2-005 mobile targets below 44 px | Fixed on Demo, Privacy, Terms, and 404. |
| V2-006 first-screen facts and social size | Fixed: local/offline/price facts are present; social image is 1200×630. |

## Build, deployment, and performance

| Gate | Result |
|---|---:|
| `npm ci` | Pass — 72 packages, 0 vulnerabilities |
| `npm test` | Pass — 7 unit tests and 36 browser runs |
| `npm run lint` | Pass |
| `npm run build` | Pass — `dist/` produced |
| `npm audit --audit-level=high` | Pass — 0 vulnerabilities |
| `/opt/fleet/lib/verify-url.sh` | Pass — 571 ms, no console/page errors |
| Live Lighthouse mobile | 100 Performance / 100 Accessibility / 100 Best Practices / 100 SEO |

Lighthouse measured FCP 0.9 s, LCP 1.3 s, TBT 20 ms, CLS 0, and Speed Index
0.9 s. The production build contains 33.40 KB JavaScript raw / 12.46 KB gzip
and 15.61 KB CSS raw / 4.42 KB gzip.

Freshly built `index.html`, Demo, Privacy, Terms, `sw.js`, the hashed JavaScript,
and the hashed CSS match the live bytes exactly. The later documentation commit
changes only `.factory/handoff.md`, so `6818f8f` is the implementation candidate.

## Evidence

Detailed command logs, screenshots, browser observations, Lighthouse JSON, and
hash comparisons are in `/work/.evidence/verification-3/`. The required report
copy is `/work/.evidence/qa-report.md` and the machine verdict is
`/work/.evidence/qa-result.json`.
