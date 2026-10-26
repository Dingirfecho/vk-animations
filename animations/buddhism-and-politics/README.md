# Buddhism & Politics — Vajrakula Motion

Animated essay (≈3 min 43 s, 12 chapters) from Lama Fede Andino's short essay *"Why go there, right? Buddhism & Politics."*
Vanilla HTML/CSS/JS, no build step, GitHub Pages–ready (relative paths; fonts from Google Fonts). Same engine as *Magic as Dharmic Technology*.

## Preview
Open `index.html` (or `python3 -m http.server` in this folder). Space = play/pause, ←/→ = chapter, `f` = fullscreen.
Languages: English, Español, Português — `?lang=en|es|pt`; otherwise the visitor's last choice, then the browser language.
Flags: `?t=90` start at 90 s · `?autoplay=0` · `?loop` · `?speed=1.25` · `?embed` (no transport) · `?render` (paused, no transport) · `?static` (the composed reduced-motion page) · `?i18ncheck` (logs untranslated strings).

## Deploy
Commit the folder as `/animations/buddhism-and-politics/`; embed with
`<iframe src=".../buddhism-and-politics/?embed" allow="fullscreen">`.

## Video render (next step)
`await page.evaluate(ms => vkTimeline.seek(ms), t)` per frame (Playwright @ 1920×1080 / 30 fps, or 1080×1920 for 9:16) → ffmpeg H.264. `vkTimeline.chapters` gives cut points for short loops (e.g. each sutra quotation).

## Chapters
Title · What I was told · Mahāparinibbāna Sutta (eight points gather, hold, disperse) · What I was shown · Kūṭadanta Sutta · First, history (alliances / disputes / wars, past → present) · Suvarṇaprabhāsottama Sūtra (lotus, ripples) · Second, interdependence (a centre pulls away; the threads hold) · Ārya Rājanivādanāma Mahāyāna Sūtra · His Holiness the Dalai Lama · Church & state (two circles held apart) · The question (the circles overlap; credit).

## Text
All copy is the essay verbatim, in order; only the small folio labels (“i · What I was told” …) and the credit line are added.
Translations live in `i18n.js`, keyed by the exact English string. Spanish is neutral Latin American (tú); Portuguese is Brazilian. Sutra names and the wordmark placeholder are deliberately untranslated.
Translations are mine, not a native reviewer's — worth a read-through, especially the five sutra passages, *budólogo*, and *la institución / a instituição do Dalai Lama* for “the office of the Dalai Lama”.

## Open items for review
- **Wordmark**: Lockup D is a clearly marked placeholder on the final frame. Needs the master file.
- **“last week”** (Dalai Lama chapter) is verbatim from the essay and will age; swap the string in `index.html` + `i18n.js` if the piece stays up.
- **Typos kept verbatim**: “the conditions that it arises” (probably *from which it arises*) and the Kutadanta spelling, set here as *Kūṭadanta* (Pāli diacritics added). Say if you want either changed.
- **Sutra quotations** are exactly as supplied in the essay; no citations beyond the sutra titles.
- **Motion defaults** (proposed, not in the Brand Book): 800–2400 ms, cubic-bezier(.22,.61,.36,1), no bounce; gilt for rules, numerals, the closing lens; cinnabar only for the single “wars” dot and the closing dot.
- Previewed with locally bundled copies of the three Google fonts; worth one look in a real browser online.
