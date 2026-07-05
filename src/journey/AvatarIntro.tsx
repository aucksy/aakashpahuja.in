import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useExperience } from '@/store/useExperience';
import { loadSignal } from '@/scenes/Landing/loadSignal';

/**
 * The avatar walk-in (§ user spec v2). The moment Enter is hit (phase =
 * loading), Aakash fades in at the BOTTOM-RIGHT corner — behind the Dark/Light
 * toggle — walking toward the visitor while the count-in dance and the 0→100
 * loader run. The loader is gated on `loadSignal.avatarProgress`, so the burst
 * fires only after the walk resolves into the folded-hands pose. The frozen
 * pose then stays in the corner for the whole journey; the toggle above it
 * remains fully usable (avatar is pointer-transparent and z-ordered beneath
 * the HUD).
 *
 * The clip is green-screen (Higgsfield Soul → seedance) and chroma-keyed to
 * alpha here, at quarter resolution (270×480) so the per-frame keying can
 * never compete with the beat-synced dance for frame budget.
 */

const SRC = '/assets/avatar-walk.mp4';
const KW = 270;
const KH = 480;
const FAILSAFE_MS = 8000; // a stalled video must never hold the loader hostage

/**
 * Stage marks — the tour-guide choreography. One mark per chapter; the avatar
 * GLIDES between them as the visitor travels, alternating sides like a
 * presenter walking between set pieces. All units are vw/vh so marks stay in
 * the viewport's negative space at any size; he mirrors (flip) on the left so
 * he always faces INTO the page. He renders BENEATH the content layer, so at
 * worst he tucks behind a paragraph — he can never cover a word.
 */
interface Mark {
  x: string; // left, in vw
  h: string; // height, in vh (width follows the 9:16 aspect)
  flip: boolean; // mirror to face the content
}

const LOADING_MARK: Mark = { x: '80vw', h: '42vh', flip: false }; // behind the toggle
const DESKTOP_MARKS: Record<string, Mark> = {
  hero: { x: '76vw', h: '56vh', flip: false },
  apps: { x: '2vw', h: '42vh', flip: true },
  fitness: { x: '78vw', h: '48vh', flip: false },
  guitar: { x: '2vw', h: '42vh', flip: true },
  gaming: { x: '77vw', h: '50vh', flip: false },
  github: { x: '2vw', h: '42vh', flip: true },
  contact: { x: '72vw', h: '60vh', flip: false }, // the finale bow
};
// Phones: one calm spot — a wandering giant would trample content.
const MOBILE_MARK: Mark = { x: '58vw', h: '34vh', flip: false };

/** Chroma-key one frame: green → transparent, soft edges + despill. */
function keyFrame(ctx: CanvasRenderingContext2D, video: HTMLVideoElement): void {
  ctx.drawImage(video, 0, 0, KW, KH);
  const img = ctx.getImageData(0, 0, KW, KH);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const m = g - Math.max(r, b);
    if (m > 38 && g > 80) {
      d[i + 3] = 0;
    } else if (m > 12 && g > 60) {
      d[i + 3] = Math.round(255 * (1 - (m - 12) / 26));
      d[i + 1] = Math.max(r, b);
    }
  }
  ctx.putImageData(img, 0, 0);
}

export default function AvatarIntro() {
  const phase = useExperience((s) => s.phase);
  const reduced = useExperience((s) => s.reducedMotion);
  const chapter = useExperience((s) => s.activeChapter);
  const [visible, setVisible] = useState(false); // first frame drawn → fade in
  const [failed, setFailed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const started = useRef(false);
  const rafRef = useRef(0);

  const active = phase !== 'overture';

  // Phones get the single calm mark; the choreography is a desktop luxury.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 880px)');
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!video || !canvas || !ctx) {
      loadSignal.avatarProgress = 1; // never gate the loader without an avatar
      setFailed(true);
      return;
    }

    const fail = () => {
      // hard error only (missing/corrupt asset) — hide entirely
      loadSignal.avatarProgress = 1;
      setFailed(true);
    };
    const showFinalPose = () => {
      // playback refused (strict mobile autoplay policies, throttled tabs…):
      // never block the loader, and show the folded-hands pose statically.
      loadSignal.avatarProgress = 1;
      const seekEnd = () => {
        video.currentTime = Math.max(0, (video.duration || 5) - 0.05);
      };
      video.addEventListener(
        'seeked',
        () => {
          try {
            keyFrame(ctx, video);
            setVisible(true);
          } catch {
            /* ignore */
          }
        },
        { once: true },
      );
      if (video.readyState >= 1) seekEnd();
      else video.addEventListener('loadedmetadata', seekEnd, { once: true });
    };
    const finish = () => {
      try {
        keyFrame(ctx, video); // freeze the folded-hands final pose
        setVisible(true);
      } catch {
        /* canvas may be gone */
      }
      loadSignal.avatarProgress = 1;
    };
    const onPause = () => {
      // browser intervened mid-walk (not our doing, not the natural end)
      if (!video.ended && loadSignal.avatarProgress < 1) showFinalPose();
    };
    video.addEventListener('error', fail);
    video.addEventListener('ended', finish);
    video.addEventListener('pause', onPause);

    // Stalled decode / missing asset → release the loader, keep the site alive.
    const failsafe = window.setTimeout(() => {
      if (loadSignal.avatarProgress < 1) loadSignal.avatarProgress = 1;
    }, FAILSAFE_MS);

    if (reduced) {
      // Reduced motion: no walk — final pose immediately, loader never gated.
      showFinalPose();
    } else {
      const draw = () => {
        if (video.readyState >= 2) {
          keyFrame(ctx, video);
          if (!video.ended && video.duration > 0) {
            loadSignal.avatarProgress = Math.max(
              loadSignal.avatarProgress,
              Math.min(0.995, video.currentTime / video.duration),
            );
          }
          setVisible(true);
        }
        if (!video.ended) rafRef.current = requestAnimationFrame(draw);
      };
      void video
        .play()
        .then(() => {
          rafRef.current = requestAnimationFrame(draw);
        })
        .catch(showFinalPose);
    }

    return () => {
      window.clearTimeout(failsafe);
      video.removeEventListener('error', fail);
      video.removeEventListener('ended', finish);
      video.removeEventListener('pause', onPause);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, reduced]);

  // Which stage mark is he on?
  const inWorld = phase === 'world';
  const mark: Mark = !inWorld
    ? LOADING_MARK
    : mobile
      ? MOBILE_MARK
      : (DESKTOP_MARKS[chapter] ?? DESKTOP_MARKS.hero);

  const glide = reduced
    ? { duration: 0.01 }
    : ({ type: 'spring', stiffness: 42, damping: 16, mass: 1.1, opacity: { duration: 0.9 } } as const);

  return (
    <>
      <video ref={videoRef} src={SRC} muted playsInline preload="auto" style={{ display: 'none' }} />
      {active && !failed && (
        <motion.div
          initial={{ left: LOADING_MARK.x, height: LOADING_MARK.h, opacity: 0 }}
          animate={{ left: mark.x, height: mark.h, opacity: visible ? 0.97 : 0 }}
          transition={glide}
          aria-hidden="true"
          style={{
            position: 'fixed',
            bottom: 0,
            // z 1: above the glass canvas (later in DOM), BELOW the journey
            // text (z 2) and the HUD/toggle (z 3) — he tucks behind content,
            // never covers a word, never blocks a tap.
            zIndex: 1,
            pointerEvents: 'none',
            aspectRatio: '9 / 16',
            filter: 'drop-shadow(0 14px 34px rgba(0,0,0,0.55))',
          }}
        >
          {/* idle breath — a person standing, not a sticker */}
          <motion.div
            animate={reduced ? {} : { y: [0, -7, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '100%', height: '100%' }}
          >
            {/* mirror swing so he faces INTO the page on left marks */}
            <motion.div
              animate={{ scaleX: mark.flip ? -1 : 1 }}
              transition={glide}
              style={{ width: '100%', height: '100%' }}
            >
              <canvas ref={canvasRef} width={KW} height={KH} style={{ width: '100%', height: '100%', display: 'block' }} />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
