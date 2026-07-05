import { useEffect, useRef } from 'react';
import { useExperience } from '@/store/useExperience';
import { audio } from '@/audio/AudioEngine';
import { DARK, LIGHT } from '@/theme/palettes';
import { lerpRgb } from '@/lib/color';

/**
 * The live waveform that rings the Enter button (§16.3). Before entering it
 * grows / pulses with the volume dial — a preview of the sound before you
 * commit; after entering it reacts to the real track's FFT energy.
 */
export default function WaveRing({ size = 320 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let raf = 0;
    let themeMix = useExperience.getState().theme === 'light' ? 1 : 0;
    const t0 = performance.now();

    const draw = () => {
      const st = useExperience.getState();
      const reduced = st.reducedMotion;
      themeMix += ((st.theme === 'light' ? 1 : 0) - themeMix) * 0.06;
      const acc = lerpRgb(DARK.accent, LIGHT.accent, themeMix);
      const accCss = (a: number) => `rgba(${acc[0] | 0},${acc[1] | 0},${acc[2] | 0},${a})`;

      const t = (performance.now() - t0) / 1000;
      const WW = size;
      const cx = WW / 2;
      const cy = WW / 2;
      const R = WW * 0.3;
      const n = 76;

      // Energy: overture = volume preview; after Enter = live audio.
      const entered = st.phase !== 'overture';
      const live = entered ? audio.getLevel() : 0;
      const energy = entered ? 0.22 + live * 1.7 : st.volume;

      ctx.clearRect(0, 0, WW, WW);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.28;
        const wobble = reduced ? 0.7 : 0.5 + 0.5 * Math.sin(t * 3.2 + i * 0.55);
        const amp = wobble * energy;
        const len = R * 0.08 + amp * R * 0.42;
        const x1 = cx + Math.cos(a) * R;
        const y1 = cy + Math.sin(a) * R;
        const x2 = cx + Math.cos(a) * (R + len);
        const y2 = cy + Math.sin(a) * (R + len);
        ctx.strokeStyle = accCss(0.24 + energy * 0.6);
        ctx.lineWidth = WW * 0.007;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Faint base ring
      ctx.strokeStyle = accCss(0.14);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 6.28);
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        pointerEvents: 'none',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}
