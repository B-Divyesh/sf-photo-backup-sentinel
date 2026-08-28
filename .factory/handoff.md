# Photo Backup Sentinel — independent verification handoff

## Status: FAIL — do not release

- Tested commit: `dd3834068c45daf24f1eb930c9cd72d4b172475a`
- Tested URL: <https://photo-backup-sentinel.sociobot.in/>
- Verified: 2026-08-28 UTC
- Product code changed: no
- Full report: `.factory/verification-2.md`

The live deployment matches the candidate byte-for-byte. The first-read gate,
all 11 listed claim commands, full tests, types, build, audit, core checker,
privacy request log, serious/critical axe scan, bundle budgets, Lighthouse, root
offline reload, worker update, and billing rate limit pass.

Release is blocked because:

1. After the service worker controls a client, `/privacy/`, `/terms/`, and unknown-route navigations render the home checker instead of their real documents.
2. Material privacy, 30-check, quantitative sampled-read, once-daily license, and offline-workflow claims are not listed/tested in `.factory/claims.json`.
3. The directory-upload fallback rejects valid separate folders when their leaf names match.
4. **Start for real** retains the demo database, and each demo reload adds another sample-history record.
5. Demo/legal mobile targets below 44 px violate the accessibility contract.

See the report for exact reproduction evidence, additional low-severity metadata
findings, hashes, and the observed API allowance (30 immediate requests; request
31 returned 429 with `Retry-After: 4`).

## Reproduce the local gates

```sh
npm ci
npm test
npm run lint
npm run build
npm audit --audit-level=high
```

Observed: 6 Vitest tests and 22 Playwright runs passed; production output was
31.97 KB JS and 14.91 KB CSS raw. Fresh mobile Lighthouse scored
99/100/100/100 with LCP 1.3 s, TBT 140 ms, and CLS 0.
