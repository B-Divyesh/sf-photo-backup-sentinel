# Photo Backup Sentinel — verification 3 handoff

## Status

**FAIL — do not release.** Independent verification found two untested public
claims. The product behavior, live deployment, build, and all declared commands
otherwise pass.

- Implementation reviewed: `6818f8fcc24bfcf1913ed597d0ba794a4f214891`
- Documentation baseline reviewed: `f9132bfbcc90efdd7576711e11259654c297c0c3`
- Live URL: <https://photo-backup-sentinel.sociobot.in/>
- Full report: [verification-3.md](verification-3.md)
- Product code changed by verification: no

## Findings to resolve

1. Add a tagged claim test that forces a sampled edge-read failure and asserts
   the failed-read report and visible ledger state. Public copy says the sample
   catches basic read errors, but `@claim:read-sample` tests only successful reads.
2. Add a listed claim and tagged recorded-response test for a revoked license.
   Assert that Pro becomes inactive and the free checker remains available.
   The current valid-license and checkout tests do not cover the public refund
   and revocation statement.

These are claim-gate findings, not observed runtime failures. Independent
browser probes confirmed that the current build reports a failed sample read
and handles `reason: "revoked"` correctly.

## Verification completed

- `npm ci`: pass, 72 packages, 0 vulnerabilities.
- All 18 exact commands in `.factory/claims.json`: pass.
- `npm test`: pass, 7 unit tests and 36 browser runs.
- `npm run lint`: pass.
- `npm run build`: pass; `dist/` produced.
- `npm audit --audit-level=high`: pass, 0 vulnerabilities.
- Live desktop and 390×844 phone first read: pass.
- Demo content, banner, reload, completed reset, exit deletion, and real-data isolation: pass.
- Normal, unsupported, empty-backup, malformed-import, overlap, same-name, cancellation, read-failure, invalid-license, revoked-license, and network-recovery paths: pass.
- Axe on Home, Demo, Privacy, Terms, and 404: zero violations.
- Keyboard, focus, skip link, reduced motion, 200% reflow proxy, touch targets, and mobile overflow: pass.
- Online/offline route titles, offline scan/history, designed HTTP 404, and controlled update toast: pass.
- Internal links, privacy contact, metadata, manifest, icons, security headers, and immutable caching: pass.
- `/opt/fleet/lib/verify-url.sh`: pass, 571 ms and no console/page errors.
- Live Lighthouse: 100/100/100/100; FCP 0.9 s, LCP 1.3 s, TBT 20 ms, CLS 0.
- Live artifact hashes match the fresh production build.

## Build measurements

- JavaScript: 33.40 KB raw / 12.46 KB gzip.
- CSS: 15.61 KB raw / 4.42 KB gzip.
- Hero AVIF: 66.33 KB.
- Social image: 1200×630.
- Fonts: none.

## Evidence

- Repository report: `.factory/verification-3.md`
- Required report copy: `/work/.evidence/qa-report.md`
- Machine result: `/work/.evidence/qa-result.json`
- Detailed logs and screenshots: `/work/.evidence/verification-3/`

## After repair

Run the two new exact claim commands from a clean `npm ci`, then rerun every
entry in `.factory/claims.json`, `npm test`, `npm run lint`, `npm run build`, and
`npm audit --audit-level=high`. Because the required repair changes tests and
the claims manifest rather than runtime product code, compare the existing live
implementation SHA separately from the later documentation/test commit.
