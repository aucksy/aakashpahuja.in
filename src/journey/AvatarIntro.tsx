import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useExperience } from '@/store/useExperience';

/**
 * The avatar sequence (§ user spec #3). At the start of the world, Aakash walks
 * toward the camera over the cinematic city, stops, folds his hands and looks
 * at the visitor. The SAME element then morphs — one continuous animation — into
 * a small transparent avatar parked bottom-left for the rest of the journey.
 *
 * The clip is generated on a solid chroma-green background (Higgsfield Soul →
 * seedance) and keyed to alpha HERE, per-frame on a canvas — so the avatar
 * composites cleanly over any world (§ "exported with transparency").
 */

const SRC = '/assets/avatar-walk.mp4';
const KW = 540; // keying resolution (perf cap)
const KH = 960;

/** Chroma-key one frame: green → transparent, with soft edges + despill. */
function keyFrame(ctx: CanvasRenderingContext2D, video: HTMLVideoElement): void {
  ctx.drawImage(video, 0, 0, KW, KH);
  const img = ctx.getImageData(0, 0, KW, KH);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const m = g - Math.max(r, b); // how green-dominant
    if (m > 38 && g > 80) {
      d[i + 3] = 0;
    } else if (m > 12 && g > 60) {
      d[i + 3] = Math.round(255 * (1 - (m - 12) / 26));
      d[i + 1] = Math.max(r, b); // despill the fringe
    }
  }
  ctx.putImageData(img, 0, 0);
}

export default function AvatarIntro() {
  const phase = useExperience((s) => s.phase);
  const reduced = useExperience((s) => s.reducedMotion);
  const [stage, setStage] = useState<'idle' | 'walk' | 'corner' | 'failed'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  // Enter the sequence when the world begins.
  useEffect(() => {
    if (phase !== 'world' || stage !== 'idle') return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const draw = () => {
      if (video.readyState >= 2) keyFrame(ctx, video);
      if (!video.paused && !video.ended) rafRef.current = requestAnimationFrame(draw);
    };

    const fail = () => setStage('failed');
    const onEnded = () => {
      keyFrame(ctx, video); // freeze the final folded-hands pose
      setStage('corner');
    };
    video.addEventListener('error', fail);
    video.addEventListener('ended', onEnded);

    if (reduced) {
      // Reduced motion: no walk — jump straight to the final pose, corner only.
      setStage('corner');
      const seekEnd = () => {
        video.currentTime = Math.max(0, video.duration - 0.05);
        video.addEventListener('seeked', () => keyFrame(ctx, video), { once: true });
      };
      if (video.readyState >= 1) seekEnd();
      else video.addEventListener('loadedmetadata', seekEnd, { once: true });
    } else {
      setStage('walk');
      const start = () => {
        void video.play().then(() => {
          rafRef.current = requestAnimationFrame(draw);
        }).catch(fail);
      };
      // Small beat so the glass dissolve leads and the walk lands on the city.
      const t = window.setTimeout(start, 900);
      return () => {
        window.clearTimeout(t);
        video.removeEventListener('error', fail);
        video.removeEventListener('ended', onEnded);
        cancelAnimationFrame(rafRef.current);
      };
    }
    return () => {
      video.removeEventListener('error', fail);
      video.removeEventListener('ended', onEnded);
      cancelAnimationFrame(rafRef.current);
    };
  }, [phase, stage, reduced]);

  if (phase !== 'world' || stage === 'failed') {
    return (
      <video ref={videoRef} src={SRC} muted playsInline preload="auto" style={{ display: 'none' }} />
    );
  }

  const corner = stage === 'corner';

  return (
    <>
      <video ref={videoRef} src={SRC} muted playsInline preload="auto" style={{ display: 'none' }} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={
          corner
            ? { opacity: 0.96, left: 20, bottom: 92, width: 96, x: 0 }
            : { opacity: 1, left: '50%', bottom: 0, width: 'min(46vh, 340px)', x: '-50%' }
        }
        transition={{ type: 'spring', stiffness: 60, damping: 16, opacity: { duration: 0.9 } }}
        style={{
          position: 'fixed',
          zIndex: 4,
          pointerEvents: 'none',
          aspectRatio: '9 / 16',
          filter: corner ? 'drop-shadow(0 6px 18px rgba(0,0,0,0.45))' : 'drop-shadow(0 24px 60px rgba(0,0,0,0.55))',
        }}
        aria-hidden="true"
      >
        <canvas ref={canvasRef} width={KW} height={KH} style={{ width: '100%', height: '100%', display: 'block' }} />
      </motion.div>
    </>
  );
}
