# A Flag Without a Flag — Vajrakula Motion

Animated companion (≈15 min 37 s, 26 chapters) to Dr. Federico Andino's paper *"Bandera sin bandera: One Piece, Sun Wukong y la rebelión juvenil en Nepal"*, for the CARI South Asia working group, 18 Nov 2026.
Vanilla HTML/CSS/JS, no build step, GitHub Pages–ready (relative paths; fonts from Google Fonts). Same engine as the other vk-animations pieces; the scenes are driven by a declarative score (`data-at` / `data-a` attributes in `index.html`).

## Preview
Open `index.html` (or `python3 -m http.server` in the repo root). Space = play/pause, ←/→ = chapter, `f` = fullscreen.
Languages: English, Español, Português — `?lang=en|es|pt`; otherwise the visitor's last choice, then the browser language.
Flags: `?t=90` · `?autoplay=0` · `?loop` · `?speed=1.25` · `?embed` · `?render` · `?static` (composed reduced-motion page) · `?i18ncheck`.

## Deploy
Commit the folder as `/animations/flag-without-a-flag/`; embed with
`<iframe src=".../flag-without-a-flag/?embed" allow="fullscreen">`. The root `index.html` has the gallery card (no. 6).

## Video render (next step)
Not rendered. `vkTimeline.seek(ms)` per frame (Playwright @ 1920×1080 / 30 fps, or 1080×1920) → ffmpeg H.264. `vkTimeline.chapters` gives cut points for short loops.

## Content
All copy follows the deck (`Bandera_sin_bandera_CARIv4.pptx`, 27 slides). Photos are the deck's own, shown in brand treatment (desaturated, lapis wash, gilt corner ticks). The blank flag, mountain, circlet and flame are drawn as abstract marks; no pirate emblem is drawn.
Translations live in `i18n.js`, keyed by the exact English string. ES is neutral Latin American; PT is Brazilian. Citations, proper names and the Spanish-language map/news captures are left as they are. Translations are mine, not a native reviewer's.

## Open items for review
- **Wordmark**: Lockup A is a marked placeholder on the final frame; needs the master file.
- **Brazil runoff** (25 Oct 2026): updated to say Lula won (confirmed in EFE/Emol and other press); the deck itself should be updated to match.
- **Photo credits/sources** to complete. The map image and one news capture have Spanish text baked in.
- **Length**: ~15:37 follows reading time; say if you want a tighter cut.
- **Motion defaults** (proposed, not in the Brand Book): 800–2400 ms, cubic-bezier(.22,.61,.36,1), no bounce; gilt and cinnabar only as late punctuation.
- Previewed with local copies of the Google fonts; worth one look in a real browser online.
