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
  const [visible, setVisible] = useState(false); // first frame drawn → fade in
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const started = useRef(false);
  const rafRef = useRef(0);

  const active = phase !== 'overture';

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

  return (
    <>
      <video ref={videoRef} src={SRC} muted playsInline preload="auto" style={{ display: 'none' }} />
      {active && !failed && (
        <motion.div
          initial={{ opacity: 0, x: 26 }}
          animate={{ opacity: visible ? 0.98 : 0, x: visible ? 0 : 26 }}
          transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          aria-hidden="true"
          style={{
            position: 'fixed',
            right: 'clamp(10px, 2.5vw, 38px)',
            bottom: 0,
            zIndex: 2, // beneath the HUD (z 3) — "behind the world theme toggle"
            pointerEvents: 'none', // toggle + dials stay fully usable
            width: 'clamp(88px, 22vw, 190px)', // phone → desktop
            aspectRatio: '9 / 16',
            filter: 'drop-shadow(0 10px 28px rgba(0,0,0,0.5))',
          }}
        >
          <canvas ref={canvasRef} width={KW} height={KH} style={{ width: '100%', height: '100%', display: 'block' }} />
        </motion.div>
      )}
    </>
  );
}
