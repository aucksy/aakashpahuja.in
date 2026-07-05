# Asset shopping list — no mediocre placeholders

Per the brief (§19): _"Do not ship mediocre placeholders. Use clearly-flagged
placeholders and hand back a shopping list."_ Here it is.

**Currently in the build (clearly-flagged placeholders):**

| Placeholder in use | Where | Replace with |
|---|---|---|
| Code-drawn 2D object glyphs (canonical `drawGlyph`) | the hidden world beneath the glass | premium **GLB 3D objects** (below) rendered to a render-target |
| Raw `music.mp3` looped via `AudioBuffer` | audio | a **processed gapless master** + **beat-map JSON** (below) |
| CDN web-fonts (Fontshare + Google) | `index.html` | **self-hosted, subset WOFF2** (below) |
| CSS-radial-gradient glow for light sources | scene-beneath | real HDRI-lit render / matte-painting layers (Milestone 2) |

---

## A · Hidden-world 3D objects  ·  ~8–10 unique, target < 1.5 MB total

Dumbbell, guitar, controller, coffee mug, sneaker, pizza slice, mic, laptop
(+ optional headphones, phone, code-brace cube). Must read as **collectible
designer objects** — strong silhouettes, real depth, premium matte/soft-metal
("Icons8 3D / clay-render" feel). Monochrome in Work, emissive-tinted in Play,
matte candy-clay in Light. Clean centre pivots, **no baked animation** (motion is
code). glTF/GLB, Draco-compressed, KTX2/Basis textures, 2k–8k tris each, < 150 KB each.

- **Icons8 3D** (closest to target aesthetic) — https://icons8.com/3d-fluency
- **Poly Pizza** (CC0) — https://poly.pizza
- **Quaternius** (CC0) — https://quaternius.com
- **Sketchfab** (filter by licence) — https://sketchfab.com
- Fastest consistency: model/tweak all in **Spline** or **Blender** so they share
  one material system. Export via `gltf-transform` + Draco/meshopt + KTX2.

## B · City & environment (Milestone 2)

- **Hero skyline** — `public/assets/city.avif` is the definitive reference (deep
  violet sky, cyan/magenta towers, arched bridge, distant airship). Option A:
  parallaxed 2.5D layers cut from a high-res matte painting. Option B: low-poly 3D
  city (Quaternius / KitBash3D) lit to match. **Match the palette exactly.**
- **Road** — CatmullRom spline mesh, wet-asphalt PBR (~5k tris), tiling
  normal + roughness for rain shimmer.
- **HDRI** — night-city / studio-dark for IBL. Poly Haven, HDRI Haven → compressed env map.
- **PBR textures** — asphalt, glass, metal, concrete. AmbientCG, Poly Haven (1–2K, KTX2, tiling).

## C · The Enter-button hand illustration

Outline→3D morphing hand motif (elegant line-art becoming a colourful volumetric
hand). **No emoji.** Currently a tasteful glow-bloom on hover stands in.

- **Rive** (recommended — interactive state-machine morph, tiny vector) — https://rive.app/community
- Fallback: small **R3F** hand model (~5k tris, rigged fingers) + particles.
- Lottie for a lightweight outline draw-on — https://lottiefiles.com

## D · Chapter media (Milestones 3–7)

- **App screens** ✅ provided (10 in `public/assets/`). Prep: trim to device-safe
  corners, export WebP, arrange into per-app tour sequences.
- **Game key art** — Elden Ring, Black Myth: Wukong, God of War. ⚠ **Licensed IP** —
  use official press-kit / Steam art for a personal non-commercial site with
  credit, or stylise. Parallax-slice each into fg/mid/bg.
- **Fitness props** — dumbbell (reuse) + low-poly elephant / bus / car / tank
  (Quaternius, Poly Pizza) + a tiny character (Quaternius "Ultimate Modular" or a
  Rive 2D character).
- **Guitar** — reuse the guitar GLB; strings = shader waveform. IG reel
  thumbnails as textures (instagram.com/aakashpahuja108).

## E · Audio & fonts

- **Music** ✅ `public/assets/music.mp3`. A runtime beat grid is now computed from
  the PCM at decode (RMS flux + autocorrelation → ~100.9 BPM detected) and drives
  all beat sync. **Still to do (offline, §11):** a curated librosa/Essentia
  **beat-map JSON** (downbeats/bars) if finer musical structure is wanted; pick a
  bar-aligned loop region; equal-power crossfade the seam; bounce a **gapless
  `.wav`/`.m4a`** (MP3 padding breaks true gapless). Optional intro + loop tail.
- **SFX** (optional, tasteful) — soft UI ticks, transition whoosh, fitness thunk.
  Freesound (CC), Zapsplat.
- **Fonts** — Clash Display, Satoshi, Space Grotesk (Fontshare, free) + Instrument
  Serif (Google). **Self-host WOFF2, subset, `font-display:swap`** (currently CDN).

## Tooling that helps

`gltf-transform` + Draco/meshopt · `sharp`/Squoosh (WebP/AVIF/KTX2) ·
librosa/Essentia (beat-map) · detect-gpu (quality tiers) · Theatre.js (author the
camera timeline) · **GitHub MCP** (live contribution constellation, github.com/aucksy).
