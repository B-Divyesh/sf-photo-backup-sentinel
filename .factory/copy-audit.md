# Landing copy audit — 2026-09-06

The initial real-mode landing page was rendered in Chromium. Visible sentences were split at sentence boundaries and counted as words.

| Sentence | Words | Result |
|---|---:|---|
| Check your photo backup. | 4 | Pass |
| For phone owners who copy photos to a drive or NAS, find missing files before deleting the originals. | 18 | Pass |
| Opens a finished sample check. | 5 | Pass |
| Your photos stay on this device. | 6 | Pass |
| Works offline after the first visit. | 6 | Pass |
| Free checks. | 2 | Pass |
| Pro costs $19 once. | 4 | Pass |
| Select an exported phone folder and a backup folder. | 9 | Pass |
| Nothing is copied, changed, or uploaded. | 6 | Pass |
| The folder copied from your iPhone or Android device. | 9 | Pass |
| Your external drive, mounted NAS, or another local folder. | 9 | Pass |
| Compare SHA-256 content and open a deterministic 10% sample. | 9 | Pass |
| Read-only. | 1 | Pass |
| Existing files stay untouched. | 4 | Pass |
| Sentinel reads each relevant file and compares its SHA-256 fingerprint. | 10 | Pass |
| Matching fingerprints mean the bytes are identical, even if the filename changed. | 12 | Pass |
| A Live Photo is usually a still image plus a MOV with the same base name. | 16 | Pass |
| Both halves must have exact matches before the pair is protected. | 11 | Pass |
| Sentinel opens the first and last blocks of a deterministic 10% sample. | 12 | Pass |
| This catches basic read errors. | 5 | Pass |
| It is not a codec playback test. | 7 | Pass |
| Honest limit: browsers cannot read an iPhone directly or guarantee every HEIC/MOV codec will play on every future device. | 20 | Pass |
| Export first, then use this byte-level proof alongside periodic restore tests. | 11 | Pass |
| Records contain file names, paths, sizes, dates, hashes, and outcomes. | 10 | Pass |
| Media bytes, EXIF fields, and location fields are never saved. | 10 | Pass |
| No checks recorded yet. | 4 | Pass |
| Choose two folders above to save your first check. | 9 | Pass |
| Every backup check is free. | 5 | Pass |
| Pro keeps 30 checks instead of the latest three. | 9 | Pass |
| Free edition — three checks are kept locally. | 7 | Pass |
| Have a license? | 3 | Pass |
| Paste it here. | 3 | Pass |
| Secure checkout by Sociobot/Dodo, merchant of record. | 8 | Pass |
| Refunds are handled there and revoke the license. | 8 | Pass |
| Check backups for photos you keep yourself. | 7 | Pass |
| No analytics or media uploads. | 5 | Pass |
| Hero artwork was generated for this product with the factory image model. | 12 | Pass |
| Build 1.0.2. | 4 | Pass |

Conditional landing states also pass:

| Sentence | Words | Result |
|---|---:|---|
| These folders share a name, and this browser hides their locations. | 11 | Pass |
| I selected two separate locations. | 5 | Pass |
| Offline mode — scanning and saved checks still work locally. | 9 | Pass |

No sentence exceeds 22 words. No banned marketing word appears.

The first screen states the job, names phone owners who use a drive or NAS, and presents **Try it with sample data** first.

## Terminology

| Concept | Product word |
|---|---|
| Original selected folder | Phone export |
| Independent selected folder | Backup or second copy |
| Completed comparison | Backup check |
| Stored comparison result | Check history |
| Isolated sample environment | Demo |
| Paid 30-record history | Sentinel Pro |
