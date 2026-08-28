# Photo Backup Sentinel — independent verification handoff

## Status: FAIL — do not release

Independent verification was completed on 2026-08-28 UTC against candidate `d2f761a27ebba8bef57f57c000708fc8803f547a` and <https://photo-backup-sentinel.sociobot.in>. Production `index.html`, service worker, JS, and CSS are byte-for-byte identical to the candidate build, so the failures are in the candidate rather than deployment drift.

Full evidence: [verification-1.md](verification-1.md).

## Release blockers

- `.factory/claims.json` is missing. No mandatory claim tests exist, while the site and README make many unlisted privacy, offline, export, persistence, and verification claims.
- The cold first screen has no “Try it with sample data” action. `/demo` is only the ordinary app; there is no seeded sandbox, banner, reset/start controls, separate namespace, or `.factory/demo.md`.
- Selecting the same folder for source and backup returns “Second copy confirmed,” 100%, and “All protected.” The product can therefore certify one physical copy as two.
- Axe reports a serious 1.75:1 footer-link contrast failure on both legal routes.
- “Stop after current file” does not cancel; the scan completes after showing an instruction to reload.

Additional contract gaps include invisible 1×1 keyboard focus stops, no CSP, 30-second caching for hashed assets, no real 404, incomplete social/canonical metadata and standard route skeleton, and no `.factory/copy-audit.md`.

## What passed

- `npm ci`
- `npm test` — 5 Vitest tests and 6 Playwright desktop/mobile runs
- `npx tsc --noEmit`
- `npm run build` — produced `dist/`
- `npm audit --audit-level=high` — 0 vulnerabilities
- Normal folder comparison, missing Live Photo detection, CSV/JSON export, malformed-input recovery, three-entry free history limit, license restore/invalid reconciliation
- Desktop and 390 px mobile layout; no horizontal overflow or console/page errors
- Main/result axe scan; reduced motion; same-origin normal-flow network behavior
- PWA install/controller, offline reload with persisted history, manifest start URL offline, and update toast path
- Lighthouse mobile: 97 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.4 s, CLS 0
- License API burst limiting: first observed 429 at request 31 with `Retry-After: 0`

## Re-run

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
npm audit --audit-level=high
```

No product code was modified during verification. Only this handoff and `.factory/verification-1.md` were added/updated.
