// A tiny module-level signal for the fast-changing burst-loader values. The R3F
// frame writes here every tick; the loading counter reads it in its own rAF and
// updates textContent directly — so the 0→100 count never triggers a React
// re-render (which at 60fps would be churn). Phase transitions still go through
// the Zustand store (they're coarse and drive AnimatePresence).

/** How long the icons get before the music is ALLOWED to begin: a fast
 *  rearrange (~0.55s) followed by a DEAD-STILL hold (~0.95s) — the held breath.
 *  Audio playback is scheduled to start no earlier than Enter + this, so the
 *  track's first beat always lands on a finished, motionless formation and the
 *  first bounce is unmistakably ON beat 1. */
export const GATHER_SECONDS = 1.5;

export const loadSignal = {
  progress: 0, // 0..1 loading
  burst: 0, // 0..1 burst blow-out amount
  overall: 0, // live audio energy (for the ring)
  avatarProgress: 0, // 0..1 avatar walk-in — the loader waits for the final pose
};

export function resetLoadSignal(): void {
  loadSignal.progress = 0;
  loadSignal.burst = 0;
  loadSignal.overall = 0;
  loadSignal.avatarProgress = 0;
}
