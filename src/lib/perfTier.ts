// Measured-GPU tier for the landing's fill-bound layers (§ user: the landing
// stayed sluggish on office-class iGPUs even after the pixel-budget cap —
// device heuristics (RAM/cores) can't see a weak GPU, so we measure REAL
// frame times during the OVERTURE (idle, pre-music) and step down until the
// machine holds ~50fps). Universal by construction: nothing is keyed to a
// resolution or device — a gaming rig settles at `full`, an office Dell
// steps to `lite`, and everything between finds its own level.
//
// The tier is FROZEN the moment the visitor enters — the sacred gather /
// count-in never sees a buffer realloc — and persisted so repeat visits
// start already-tuned.
//
//   full — everything as designed
//   trim — glass buffer ×0.72 dpr (≈ half the shaded pixels); look unchanged
//   lite — + post chain off (bloom/grain/vignette) and the world scrim's
//          backdrop blur off; the frost hides the resolution, DOM stays sharp

export type GlassTier = 'full' | 'trim' | 'lite';

const KEY = 'aakash.glassTier.v1';
const ORDER: GlassTier[] = ['full', 'trim', 'lite'];

let tier: GlassTier = (() => {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'trim' || t === 'lite' ? t : 'full';
  } catch {
    return 'full';
  }
})();

function persist(): void {
  try {
    localStorage.setItem(KEY, tier);
  } catch {
    /* private mode — tier lives for this session only */
  }
}

export function glassTier(): GlassTier {
  return tier;
}

/** One step down (full → trim → lite), persisted. Returns the new tier. */
export function degradeTier(): GlassTier {
  tier = ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(tier) + 1)];
  persist();
  return tier;
}

/** Straight to the floor — for software WebGL (corporate machines with GPU
 *  acceleration disabled by policy), where no resolution can save the post
 *  chain and burning two probe windows would waste the overture. */
export function forceLite(): GlassTier {
  tier = 'lite';
  persist();
  return tier;
}

/** Extra dpr multiplier applied on top of the pixel-budget fit. */
export function tierDprScale(t: GlassTier = tier): number {
  return t === 'full' ? 1 : t === 'trim' ? 0.72 : 0.6;
}

/** Whether the post chain (bloom/grain/vignette) should run at all. */
export function tierPost(t: GlassTier = tier): boolean {
  return t !== 'lite';
}
