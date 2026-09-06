# Photo Backup Sentinel

Check a phone-photo backup before deleting originals. It is for iPhone and Android owners who copy exports to a drive or NAS.

Open `/demo/` for a finished sample check. Demo records use a separate IndexedDB database and never enter real history.

**Reset demo** replaces the sample record. **Start for real** deletes the Demo database before opening the real checker.

## What it does

- Matches identical photo and video bytes, including renamed copies.
- Reports incomplete still-plus-MOV Live Photo pairs.
- Reads both edges of a deterministic 10% sample of matched backup files.
- Exports CSV and Sentinel JSON. A Sentinel JSON export can be imported later.
- Keeps three free checks after refresh. A valid Pro license raises the limit to 30.
- Works offline after one successful online visit, including scanning and saved history.

The checker reads selected files without changing or copying them. Stored reports contain metadata, hashes, and outcomes, never media bytes or EXIF/location fields.

The Demo makes no cross-origin or write request and sets no cookie. The free workflow needs no account.

## Sentinel Pro

Sentinel Pro costs $19 once. It raises local history from three checks to 30.

Buying opens the Sociobot hosted checkout. The app accepts returned or pasted licenses and verifies them through the Sociobot API.

After a verification response, the app waits at least 24 hours before checking again. The safety check and exports remain free.

## Run locally

Use Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open the shown URL. Choose a phone export and a separate backup folder.

## Verify and build

```sh
npm test
npm run lint
npm run build
npm audit --audit-level=high
```

Each public claim and its exact command are listed in [`.factory/claims.json`](.factory/claims.json). The Demo contract is in [`.factory/demo.md`](.factory/demo.md).

`npm run build` creates the static site in `dist/`. Deploy that directory with the product’s existing static deployment configuration.

## Limits

Browsers cannot read an iPhone library directly. Export the media first and mount the backup drive or NAS.

A sampled read is not a playback or full restore test. Keep originals until an independent restore succeeds.

## Privacy and terms

Read the [privacy notice](privacy/index.html) and [terms](terms/index.html). No third-party font, analytics script, or payment provider runs inside the app.

## License

MIT — see [LICENSE](LICENSE).
