# Journey to the Land Endowed with Splendor — Vajrakula Motion

Animated companion to the Vajrakula Sacred Visualization Manual *Journey to the Land Endowed with Splendor* (Śrīmat, the southern realm of Buddha Ratnasambhava and Mother Māmakī). 21 scenes, about 5 minutes, covering the whole manual: Orientation, Parts I–VI, closing dedication and colophon.
Single self-contained `index.html` (same shape as `utmost-bliss-journey`), no build step, GitHub Pages–ready. Fonts from Google Fonts with local fallbacks.

## Preview
Open `index.html` (or `python3 -m http.server` in this folder).
Space = play/pause, ←/→ = previous/next scene. `?s=8` starts at scene 9. `?lang=en|es|pt`; otherwise the visitor's last choice (shared `vk-lang` key), then the browser language.
`?i18ncheck` logs any string without a translation. With `prefers-reduced-motion` the page becomes a static, fully composed text page.

## Deploy
Commit the folder as `/animations/srimat-journey/`; Pages serves it at `…/animations/srimat-journey/`. The gallery card is in the root `index.html` (piece 3).

## Scenes
Title · Before you begin · Refuge & bodhicitta · Purify the breath · Amber cloud · Golden door · Carried south · Midday sun · Earth becoming gold · Arrival · Wish-granting trees · Eight waters · Soothing away of pride · Horse throne (horses → dais → lotus → canopy) · Ratnasambhava · Māmakī · Body of light (rays in the ten directions) · Ākāśagarbha & Ratnapāṇi · Seeing yourself there (lotus closes) · Return · Dedication & colophon.

## Open items for review
- **Translations** (ES neutral Latin American, PT Brazilian) are mine, not a native reviewer's. Worth a read, especially *seres errantes*, *árboles/árvores que conceden/realizam deseos/desejos*, *Sabiduría/Sabedoria de la/da Ecuanimidad*, and the impersonal closing lines ("Ya se es heredero…" / "Já se é herdeiro…").
- **Devanagari**: only *रत्नसम्भव*, copied from the manual's own title page. No Tibetan; no mantra text added. Śrīmat is shown in Latin transliteration only.
- **Imagery**: no figures. The Buddha, Māmakī and the attendants are light and abstract geometry; the eight horses are eight small gilt arches. Send woodblock/commissioned art if you want it in.
- **Wordmark**: Lockup A is a clearly marked placeholder on the last frame. Needs the master file.
- **Palette**: the gold ground is deliberately a dark mirror with a thin luminous band, so gilt stays a small share of the frame; cinnabar appears only in Māmakī's silks and the final folio dot.
- **Motion defaults** (proposed, not in the Brand Book): 800–2400 ms entrances, cubic-bezier(.22,.61,.36,1), no bounce.
- **Phone**: portrait shows the central part of the scene (throne and presence in full, outer trees cropped). A dedicated 9:16 layout comes with the vertical video render.
- Source for the English captions is the manual's own wording, condensed. Credit and colophon follow the manual ("Composed and arranged by Guru Prajnavajra, from the format taught and transmitted by Sri Suryagridha for Vajrakula"; spellings as in the PDF).

## Video render (next step)
Scenes are timed (`S[i].d`) and navigable with `?s=`; a seekable master timeline would be added for Playwright @ 1920×1080 / 30 fps (and 1080×1920), then ffmpeg H.264.
