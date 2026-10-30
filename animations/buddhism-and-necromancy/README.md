# Buddhism and Necromancy — Vajrakula Motion

Animated companion (≈5 min 39 s, 18 chapters) to the talk *"Does the Buddha raise the dead? Buddhism and Necromancy"* (deck v5.2, 59 slides).
It follows the talk's seven movements: the paradox, who we are talking to, serving the dead, the charnel ground, using the dead, ethics and guardrails, the close.
Vanilla HTML/CSS/JS, no build step, GitHub Pages–ready (relative paths; fonts from Google Fonts). Same engine as *Buddhism & Politics*.

## Preview
Open `index.html` (or `python3 -m http.server` in this folder). Space = play/pause, ←/→ = chapter, `f` = fullscreen.
Languages: English, Español, Português — `?lang=en|es|pt`; otherwise the visitor's last choice, then the browser language.
Flags: `?t=90` start at 90 s · `?autoplay=0` · `?loop` · `?speed=1.25` · `?embed` (no transport) · `?render` (paused, no transport) · `?static` (the composed reduced-motion page) · `?i18ncheck` (logs untranslated strings).

## Deploy
Commit the folder as `/animations/buddhism-and-necromancy/`; embed with
`<iframe src=".../buddhism-and-necromancy/?embed" allow="fullscreen">`.

## Video render (next step)
`await page.evaluate(ms => vkTimeline.seek(ms), t)` per frame (Playwright @ 1920×1080 / 30 fps, or 1080×1920 for 9:16) → ffmpeg H.264. `vkTimeline.chapters` gives cut points for short loops (e.g. the three kinds, Chöd inverted, the published/transmitted page, the closing line).

## Chapters
Title · A note on care · The paradox · Three kinds of necromancy + the opening vote · Who are we talking to? · The dead are there · Serving the dead (preta debt, two feeding rites) · The Bardo Thödol (a page published, a page transmitted) · What the living owe (five verbs) · The charnel ground · Chöd (using → offering) · The vetāla, a story not a manual · Thailand, spirit-children and amulets · Beings, not tools · What would you ask first? (lineage, consent, benefit, accountability) · Back to the vote · With a vow · A Buddha leaves no one behind.

## Text
All copy is taken from the slides, in the talk's order; folio labels follow the deck's section numbers. Small adaptations so it stands alone without a speaker: the opening vote is a still question ("Hold your vote…"), and the red-flag activity is reduced to its scenario + the four questions.
Translations live in `i18n.js`, keyed by the exact English string. Spanish is neutral Latin American (tú); Portuguese is Brazilian. Citations, Pāli/Sanskrit/Tibetan terms and rite names (Ullambana, Chöd) are deliberately untranslated.
Translations are mine, not a native reviewer's — worth a read-through, especially *Boca Llameante / Boca Flamejante* (Flaming Mouth), *hallazgo honesto / constatação honesta* (honest finding), *artes bajas / baixas* (low arts), *poder operativo / operante* (working power).

## What is deliberately absent
Following the deck's own ground rules ("it won't teach a method, give mantras, visualizations or procedures, or imitate a rite"): no mantra, no Tibetan or Devanagari text, no practice instructions, no ritual imagery, no images of lineage figures or corpses. Chöd and the feeding rites are shown only by their *direction* (taking in / giving out; offering, invitation, release). The Bardo Thödol is a published page beside a page left blank in a gilt frame, the Brand Book's own gesture for what the printed page leaves to transmission.

## Open items for review
- **Wordmark**: Lockup A is a clearly marked placeholder on the final frame (it carries Tibetan and Devanāgarī, so I did not retype it). Needs the master file.
- **Items the deck itself marks VERIFY** and that appear on screen: the fourteenth-century dating of the Bardo Thödol and the 1927 English title; the Brahmajāla "low arts" wording; *Abhidharmakośa* ch. 3 for the antarābhava debate. The Taishō numbers (T. 1313, T. 1318) are omitted for now.
- **Citations on screen** are the deck's short forms (Teiser 1988, Gouin 2010, Cuevas 2003, …); full references stay in the deck's bibliography slides.
- **Motion defaults** (proposed, not in the Brand Book): 800–2400 ms, cubic-bezier(.22,.61,.36,1), no bounce. Gilt for rules, numerals, orbiting points, the frame of the blank page and the single largest circle; cinnabar only for the closing dot. Candle flicker on the title flame, drifting smoke, a slow stream (chapter 5), rings that turn (chapter 3), and the pīṭha ring (chapter 10).
- **Length**: at 5:39 it is longer than the sibling pieces because the talk has seven movements; easy to cut to a ≈4 min version by dropping *The dead are there*, *What the living owe*, *Thailand* and *Beings, not tools* if you want a tighter cut.
- Previewed with fallback serif fonts (Cormorant/Spectral were not installable offline), so wrapping is a conservative estimate; worth one look online.
