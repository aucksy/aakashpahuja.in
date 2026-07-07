import { useEffect, lazy, Suspense } from 'react';
import { useExperience } from '@/store/useExperience';
import { audio } from '@/audio/AudioEngine';
import EnterControls from './EnterControls';
import NoWebGLFallback from '@/components/NoWebGLFallback';
import Journey from '@/journey/Journey';
import WorldBackdrop from '@/journey/WorldBackdrop';
import AvatarIntro from '@/journey/AvatarIntro';

// The 3D stack (three + r3f + postprocessing) is code-split and streamed in
// after the initial shell paints — keeps first-load JS lean (§21).
const RippleGlass = lazy(() => import('./RippleGlass'));

/** Void gradient shown for the split-second before the glass shader streams in. */
function GlassLoader() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background:
          'radial-gradient(1200px 820px at 12% -8%, rgba(96,80,210,0.30), transparent 60%), radial-gradient(1000px 720px at 104% 6%, rgba(38,132,168,0.22), transparent 55%), linear-gradient(#05060b,#04050a)',
      }}
    />
  );
}

/**
 * The whole experience: a persistent fixed WebGL world (overture ripple → burst
 * dance → neon city) with the overture HUD over it, and the scrolling Journey
 * (Hero → Apps → Fitness → Guitar → Gaming → GitHub → Contact) that unlocks once
 * the visitor is inside. One continuous world — never a page load (§01).
 */
export default function Landing() {
  const hasWebGL = useExperience((s) => s.hasWebGL);
  const phase = useExperience((s) => s.phase);

  // Warm the track bytes so the Enter gesture has near-zero latency (§11, §21).
  useEffect(() => {
    void audio.preload();
  }, []);

  // Leave the tab/app (switch tabs, minimise, lock the phone, background it on
  // mobile) → pause the music so it never plays into the background; return →
  // resume exactly where it left off. Pausing is gated to the world so the
  // sacred overture / beat-locked count-in is never touched; resume only
  // un-pauses what the background handler paused.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (useExperience.getState().phase === 'world') audio.pauseForBackground();
      } else {
        audio.resumeFromBackground();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  if (!hasWebGL) return <NoWebGLFallback />;

  return (
    <>
      {/* z:0 — the cinematic world video (city / beach) behind everything */}
      <WorldBackdrop />
      {/* z:1 — the glass canvas; dissolves at world to reveal the video */}
      <Suspense fallback={<GlassLoader />}>
        <RippleGlass />
      </Suspense>
      <EnterControls />
      {/* The journey (Lenis + all its chapters + their canvas loops) is NOT
          mounted until we're in the world — so nothing competes with the
          overture / dance / beat-sync for frame budget. The landing runs alone,
          exactly as it did before the journey existed. */}
      {phase === 'world' && <Journey />}
      {/* the avatar walk-in → corner presence (world only, self-gated) */}
      <AvatarIntro />
    </>
  );
}
