# Magic as Dharmic Technology — Vajrakula Motion

Animated companion to Vajrabudha's talk *"Magic is a Dharmic Technology for Liberation"* (48 slides → ~4 min, 10 chapters).
Vanilla HTML/CSS/JS, no build step, GitHub Pages–ready (relative paths; fonts from Google Fonts).

## Preview
Open `index.html` (or `python3 -m http.server` in this folder). Space = play/pause, ←/→ = chapter, `f` = fullscreen.
Languages: English, Español, Português — `?lang=en|es|pt`; otherwise the visitor's last choice, then the browser language. Switcher (top right) keeps your place in the timeline.
Flags: `?t=90` start at 90 s · `?autoplay=0` · `?loop` · `?speed=1.25` · `?embed` (no transport) · `?render` (paused, no transport) · `?static` (the composed reduced-motion page).

## Deploy
Commit the folder as `/animations/magic-dharmic-technology/`; enable GitHub Pages; embed with
`<iframe src=".../magic-dharmic-technology/?embed" allow="fullscreen">`.

## Video render (next step)
One master timeline, fully seekable: `await page.evaluate(ms => vkTimeline.seek(ms), t)` per frame
(Playwright @ 1920×1080 / 30 fps, or 1080×1920 for 9:16) → ffmpeg H.264. `vkTimeline.chapters` gives cut points for short loops.

## Chapters
Title · Invocation · Thesis · Working definition (grows in four revisions) · Causes & conditions (web re-arranges around one intervention) ·
Shop-owner / relative ↔ ultimate · Three streams (Atanatiya, Cundi, four enlightened activities) · Two objections · Ganapati · Dedication.

## Translations
All on-screen text lives in `i18n.js`, keyed by the exact English source string; `index.html` stays English. Sanskrit/mantras, sutra names and the wordmark placeholder are deliberately untranslated.
Spanish is neutral Latin American (infinitives for the ritual steps); Portuguese is Brazilian. `?i18ncheck` logs any string without a translation.
Translations are mine, not a native reviewer's — worth a read-through, especially the Buddhist terms (e.g. *vacuidad/vacuidade*, *Triple Gema / Três Joias*, the four activities).

## Open items for review
- **Wordmark**: Lockup D is a clearly marked placeholder on the final frame. Needs the master file.
- **Mantras**: Latin transliteration only, exactly as on the slides. No Devanagari/Tibetan added — send the exact text and it slots in beside the Latin.
- **Not covered** (condensed): the long Atanatiya/Cundi quotations, scrying/exorcism passages, full sutra text, altar/offering prep.
- **Motion defaults** (proposed, not in the Brand Book): 800–2400 ms, cubic-bezier(.22,.61,.36,1), no bounce; gilt only for rules, numerals, flame, mantra flash; cinnabar dot appears last.
- Credit reads "Vajrabudha" (spelling on the slides).
