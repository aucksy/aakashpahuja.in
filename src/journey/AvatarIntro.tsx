import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useExperience } from '@/store/useExperience';
import { loadSignal } from '@/scenes/Landing/loadSignal';

/**
 * The avatar (§ user spec, final): fades in walking at the BOTTOM-RIGHT —
 * behind the Dark/Light toggle — while the 0→100 loading runs, resolves into
 * his folded-hands pose, and stays there for the whole journey. Desktop: big —
 * his head reaches ~half the screen. Phones: smaller.
 *
 * SYNC-SAFETY (the hard requirement): the count-in dance must NEVER drop a
 * frame. Video decode + canvas getImageData (a GPU-pipeline readback) during
 * the dance is what broke the beat sync before. So ALL of that now happens
 * during the OVERTURE, before Enter: the green-screen clip is seek-stepped and
 * chroma-keyed into small ImageBitmaps, chunked between timeouts so even the
 * ripple never hitches. During loading, "playback" is nothing but stamping
 * pre-keyed bitmaps at 12fps — zero decode, zero readback, zero stalls.
 */

const SRC = '/assets/avatar-walk.mp4';
const KW = 216;
const KH = 384;
const BAKE_FPS = 12;
const FAILSAFE_MS = 8000; // the loader must never be held hostage

/** Chroma-key in place: green → transparent, soft edges + despill. */
function keyImageData(img: ImageData): void {
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
}

// Module-level bake (survives remounts; runs once per page load).
const bake: { frames: ImageBitmap[]; total: number; done: boolean; failed: boolean } = {
  frames: [],
  total: 0,
  done: false,
  failed: false,
};
let bakeStarted = false;

if (import.meta.env.DEV) {
  (window as unknown as { __avatarBake?: unknown }).__avatarBake = bake;
}

function startBake(): void {
  if (bakeStarted) return;
  bakeStarted = true;
  const video = document.createElement('video');
  video.src = SRC;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  // Detached <video> elements may never load in throttled/background contexts;
  // parking it hidden in the DOM guarantees the fetch+decode pipeline runs.
  video.style.display = 'none';
  document.body.appendChild(video);
  const cv = document.createElement('canvas');
  cv.width = KW;
  cv.height = KH;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    bake.failed = true;
    bake.done = true;
    return;
  }
  const finish = () => {
    if (bake.done) return;
    bake.done = true;
    if (!bake.frames.length) bake.failed = true;
    video.remove();
    video.removeAttribute('src');
    video.load();
  };
  video.addEventListener('error', finish);
  video.addEventListener(
    'loadedmetadata',
    () => {
      const dur = Math.min(video.duration || 5, 6);
      bake.total = Math.max(2, Math.floor(dur * BAKE_FPS));
      let i = 0;
      const step = () => {
        if (i >= bake.total) {
          finish();
          return;
        }
        video.addEventListener(
          'seeked',
          () => {
            void (async () => {
              try {
                ctx.drawImage(video, 0, 0, KW, KH);
                const img = ctx.getImageData(0, 0, KW, KH);
                keyImageData(img);
                ctx.putImageData(img, 0, 0);
                bake.frames.push(await createImageBitmap(cv));
              } catch {
                /* skip frame */
              }
              i++;
              // Idle-chunked: one small step at a time so the overture's
              // ripple never hitches while we work.
              window.setTimeout(step, 40);
            })();
          },
          { once: true },
        );
        video.currentTime = Math.min(dur - 0.03, i / BAKE_FPS);
      };
      step();
    },
    { once: true },
  );
  window.setTimeout(finish, 30000); // absolute bake ceiling
}

export default function AvatarIntro() {
  const phase = useExperience((s) => s.phase);
  const reduced = useExperience((s) => s.reducedMotion);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const started = useRef(false);
  const rafRef = useRef(0);

  const active = phase !== 'overture';

  // Bake during the overture, long before the beat-critical sequence.
  useEffect(() => {
    startBake();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 880px)');
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // The walk-in: stamp pre-keyed bitmaps; report progress; freeze final pose.
  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      loadSignal.avatarProgress = 1;
      setFailed(true);
      return;
    }

    const failsafe = window.setTimeout(() => {
      if (loadSignal.avatarProgress < 1) loadSignal.avatarProgress = 1;
    }, FAILSAFE_MS);

    const start = performance.now();
    let lastDrawn = -1;
    const tick = () => {
      if (bake.failed) {
        loadSignal.avatarProgress = 1;
        setFailed(true);
        return;
      }
      const total = bake.total || Math.max(2, bake.frames.length);
      // Reduced motion: no walk — jump straight to the final pose.
      const timeIdx = reduced
        ? total - 1
        : Math.floor(((performance.now() - start) / 1000) * BAKE_FPS);
      const idx = Math.min(timeIdx, bake.frames.length - 1, total - 1);
      if (idx >= 0 && idx !== lastDrawn) {
        ctx.clearRect(0, 0, KW, KH);
        ctx.drawImage(bake.frames[idx], 0, 0);
        lastDrawn = idx;
        setVisible(true);
      }
      if (bake.done && idx >= total - 1 && idx === bake.frames.length - 1) {
        // Final pose reached — release the loader, free all but the last frame.
        loadSignal.avatarProgress = 1;
        for (let i = 0; i < bake.frames.length - 1; i++) bake.frames[i].close();
        bake.frames.splice(0, bake.frames.length - 1);
        return;
      }
      loadSignal.avatarProgress = Math.max(
        loadSignal.avatarProgress,
        Math.min(0.99, total > 1 ? Math.max(0, timeIdx) / (total - 1) : 0),
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.clearTimeout(failsafe);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, reduced]);

  return (
    <>
      {active && !failed && (
        <motion.div
          initial={{ opacity: 0, x: 22 }}
          animate={{ opacity: visible ? 0.97 : 0, x: visible ? 0 : 22 }}
          transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          aria-hidden="true"
          style={{
            position: 'fixed',
            right: 'clamp(10px, 2.5vw, 40px)',
            bottom: 0,
            // z 1: above the glass canvas (later in DOM), below journey text
            // (z 2) and the HUD (z 3) — behind the toggle, never blocks it.
            zIndex: 1,
            pointerEvents: 'none',
            // Desktop: head reaches ~half the screen (the clip has a little
            // headroom, so 56vh puts the head at ≈50vh). Phones: smaller.
            height: mobile ? '32vh' : 'min(56vh, 660px)',
            aspectRatio: '9 / 16',
            filter: 'drop-shadow(0 14px 34px rgba(0,0,0,0.55))',
          }}
        >
          <canvas ref={canvasRef} width={KW} height={KH} style={{ width: '100%', height: '100%', display: 'block' }} />
        </motion.div>
      )}
    </>
  );
}
