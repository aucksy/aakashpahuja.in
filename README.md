# Aakash Pahuja — Portfolio Experience

A two-personality, music-driven, WebGL portfolio. Built to the master spec in
`../Design system/# Memorable Portfolio Experience Design/Claude Code Handoff/DESIGN_SPEC.md`.

> **Status: Milestone 1 — the Landing / Overture (SC-01).** The city, scroll
> journey and chapters (SC-02 → SC-09) are not built yet. See the roadmap below.

## What Milestone 1 delivers

- **The signature liquid-glass ripple** — a real GLSL fragment shader (ported
  from the canonical prototype), not a DOM filter. Same-colour optical
  refraction, a condensation-wipe clarity mask that follows the cursor/finger and
  slowly re-frosts, chromatic aberration, specular glint and vignette.
- **8+ hidden designer objects** drifting beneath the glass with soft physics —
  per-object idle float, inverse-square pointer repulsion, spring-return with
  overshoot (never a snap).
- **One button, two dials.** A single _Enter with Music_ action ringed by a live,
  volume-reactive waveform; a **volume/intensity** slider (0 = enter quietly ≈
  Work feel, up = full musical Play); a **Dark/Light** world toggle.
- **The burst-dance loader (§21: "the burst IS the loader").** Press Enter and the
  objects gather and **dance to the live beat** (bass drives the big objects,
  treble the small, a bass onset pops them + throws sparks) while a **0→100
  counter** fills over one musical phrase and the frost lifts. At 100 they **burst**
  — scale-pop and scatter past the frame — and you're inside (the hero payoff).
- **Two complete design systems**, not an inversion: **Neon Nightfall** (dark)
  and **Golden Daybreak** (light), cross-grading on a ~1.2 s golden-hour sweep.
- **Real Web Audio** — the track decodes once into an `AudioBuffer`, loops a
  single `BufferSource` (never `<audio loop>`), and drives an `AnalyserNode` FFT
  (fftSize 2048) with bass/mid/treble bands + bass-onset beat detection. Starts
  only from the Enter gesture; fades in; persistent mute.
- **Accessibility & resilience** — `prefers-reduced-motion`, a no-WebGL static
  fallback, a crawlable parallel DOM behind the canvas, focus rings, skip link,
  first-visit sound hint. DPR capped, 3D code-split and streamed after the shell.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (or the port it prints)
npm run build      # typecheck + production bundle → dist/
npm run preview    # serve the production build
```

Move the cursor to wipe the frosted glass; drag the volume dial to grow the
waveform; toggle Dark/Light to watch the world cross-grade; press **Enter with
music** to start the track, clear the glass and ignite the objects to colour.

> The experience is rAF-driven WebGL — it needs a **foreground, visible** browser
> tab (browsers pause `requestAnimationFrame` and canvas sizing in hidden/
> backgrounded tabs, so automated/headless captures show a blank canvas).

## Architecture

```
src/
  App.tsx                    capability probe (WebGL / reduced-motion / quality) + theme
  main.tsx, index.css        entry + design tokens (§06/§07/§08)
  store/useExperience.ts     Zustand: theme · volume · entered · audio · quality · localStorage
  theme/palettes.ts          the two worlds (parsed RGB) + lerpPalette() cross-grade
  audio/AudioEngine.ts       gapless AudioBuffer loop + AnalyserNode FFT bands + onset
  lib/
    glyphs.ts                canonical drawGlyph / drawWeighty (the designer objects)
    objects.ts               hidden-object defs + soft-physics step
    color.ts, env.ts         colour maths + capability/quality helpers
  scenes/Landing/
    rippleShader.ts          the ported GLSL vertex + fragment shader
    SceneBeneath.ts          offscreen painter → CanvasTexture (the world beneath)
    RippleGlass.tsx          R3F fullscreen quad + shader + pointer + postprocessing
    WaveRing.tsx             the volume/audio-reactive waveform ring
    EnterControls.tsx        the HUD: button, dials, hero payoff, mute
    Landing.tsx              composes the scene (lazy-loads the 3D)
  components/
    ParallelDOM.tsx          crawlable résumé/content behind the canvas
    NoWebGLFallback.tsx      beautiful static fallback
```

The canonical prototypes in `Experience Blueprint.dc.html` are the source of
truth for the ripple shader and the object physics — they were **ported, not
reinvented**. The scene-beneath uses a 2D-canvas → `CanvasTexture` technique
(faithful to the reference); swapping in real GLB 3D objects + a render-target is
a clean later upgrade (see `ASSETS_TODO.md`).

## Milestone roadmap

| # | Scene | Status |
|---|---|---|
| **1** | **Landing / Overture (SC-01)** | ✅ |
| **1.5** | **Burst dance + count-in + 0→100 loader + burst (SC-02A)** | ✅ |
| **2** | **Descent into the City + Hero (SC-03)** | ✅ |
| **3** | **My Apps — phone tours w/ real screens (SC-04)** | ✅ |
| **4** | **Fitness — 9,775 kg lifting saga (SC-05)** | ✅ |
| **5** | **Guitar & Singing — audio-reactive strings (SC-06)** | ✅ |
| **6** | **Gaming — three worlds (SC-07)** | ✅ *(stylised art placeholders)* |
| **7** | **GitHub — contribution constellation (SC-08)** | ✅ *(sample data)* |
| **8** | **Arrival / Contact (SC-09)** | ✅ |

**Two worlds, two real environments** (`src/journey/WorldBackdrop.tsx`): the dark
"Neon Nightfall" city (`world-city.mp4`) and the light "Golden Daybreak" beach
(`world-beach.mp4`) crossfade behind the journey, with a GPU chroma-keyed avatar
(`src/journey/AvatarIntro.tsx`) walking in as the tour guide. The glass overlay
dissolves into the world at T1. The Hero is type-driven (no video monolith).

**⚑ THE PERFECT LANDING IS LOCKED:** git tag `perfect-landing` (commit `ce03346`).
`git checkout perfect-landing` restores it; `git diff perfect-landing -- src/scenes/Landing`
must stay EMPTY for overture-feel files unless explicitly re-approved.

Remaining polish, in rough priority:
- Compress the world videos (`world-city.mp4` ~13MB, `world-beach.mp4` ~12MB,
  `avatar-walk.mp4` ~6MB) → WebM / lower bitrate.
- Light-world daybreak treatment for the 3D city (palette exists, needs tuning).
- Pinned scroll set-pieces, Work ⇄ Play morph everywhere (T2), live GitHub +
  Hevy data, licensed game key-art.

## Assets

Provided assets live in `public/assets/`. The premium + open-source **shopping
list** for everything still to source (GLB objects, HDRIs, road PBR, the Rive
morphing hand, self-hosted fonts, the processed gapless-audio master + beat-map)
is in **`ASSETS_TODO.md`**.
