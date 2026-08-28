# Photo Backup Sentinel — visual thesis

## Direction: cassette-era evidence desk

The product should feel like a careful mixtape archivist's workbench: tactile,
labelled, slightly imperfect, and trustworthy. The cassette is not nostalgia as
decoration; its two reels are a direct metaphor for two readable copies, while
leader tape and check marks explain movement and verification. Screens resemble
photocopied instruction sheets clipped to a charcoal desk, with fluorescent
proof marks reserved for status.

## Palette

The interface is deliberately single-mode: a warm paper surface painted over a
near-black graphite background, like a zine under a desk lamp.

- `ink` `#171713`: body text / dark background
- `paper` `#F3EAD5`: main work surface
- `paper-2` `#E2D5B9`: grouped controls
- `carbon` `#34342D`: secondary text (7.1:1 on paper)
- `signal` `#D9FF57`: primary action and focus (13.8:1 with ink)
- `cyan` `#62D9D2`: verified / paired marker (8.9:1 with ink)
- `warning` `#8A5000`: warning text (5.4:1 on paper)
- `danger` `#A52B32`: failure text (6.2:1 on paper)
- `white` `#FFFDF5`: high-contrast text on ink

Status never relies on color: each mark has a word and a symbol.

## Type and spacing

- Display: `Arial Black`, `Arial Narrow`, sans-serif; condensed, uppercase,
  tightly tracked like a cassette spine label.
- Working text: system sans (`Inter`-like OS stack), selected to avoid a font
  download and keep the offline shell small.
- Numeric evidence uses `ui-monospace` with tabular figures.
- Scale: 14 / 16 / 20 / 28 / clamp(42–76) px. Body is always at least 16 px.
- Spacing follows an 8 px rhythm with 4 px for inline details. Controls are at
  least 44 px tall. Reading measure tops out near 68 characters.

## Layout and interaction grammar

The top-level workflow is a numbered three-step tape path: choose the phone
export, choose the backup, then check. The app progresses into an evidence desk
with a strong verdict, a protection ratio, and a filterable ledger. Stamped
rectangles, clipped corners, registration crosses, rough offset shadows, and
subtle paper grain make the identity specific without obscuring the job.

Primary buttons depress by 2 px. Selected filters invert like label-maker tape.
File-picking inputs are real buttons backed by the File System Access API when
available and directory inputs elsewhere. Keyboard focus is a 3 px signal-green
outline with offset. On 390 px screens the editorial aside disappears and the
workflow becomes one column; verification and export remain fully available.

## Motion policy

Only state changes move: the tape line fills left-to-right during hashing,
results rise 8 px and fade over 220 ms, and buttons depress for 100 ms. Nothing
loops. With `prefers-reduced-motion: reduce`, transforms and smooth scrolling
are removed and progress changes instantly; meaning remains in text and shape.

## Generated asset plan and provenance

One editorial hero illustration shows two cassette reels joined by a photo-film
strip, with a fluorescent verification tab. It establishes the product metaphor
but never implies that the app copies files. The functional UI uses authored CSS
and small inline SVG symbols only.

Prompt sheet:

> Use case: stylized-concept. Asset type: wide PWA hero illustration. Primary
> request: an editorial cassette-era zine collage about proving two copies of
> phone photographs. Scene: top-down archival workbench. Subject: a transparent
> audio cassette with two clearly visible reels, a 35mm photo contact strip
> threading between them, two external-drive shapes, and one fluorescent green
> verification tab. Style: 1980s photocopied punk zine, risograph halftone,
> torn paper edges, tactile ink, no gradients. Composition: wide landscape,
> subject centered-right with calm negative space, clean silhouette. Lighting:
> flat printmaking contrast. Palette: warm cream paper, charcoal black, muted
> cyan, acid chartreuse, tiny brick red. Constraints: no people, no readable
> text, no brand marks, no interface screenshot, no watermark, no logos, no
> malformed cassette, no extra reels.

Generated with the factory Azure image deployment on 2026-08-28. Original to
this product; source PNG and prompt sidecar are retained in `assets/src/`.

