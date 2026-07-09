import { useEffect, useRef } from 'react';
import Chapter from '../Chapter';
import { Kicker, Reveal, h2Style, leadStyle, glassCard } from '../ui';
import { audio } from '@/audio/AudioEngine';
import { useExperience } from '@/store/useExperience';
import { rafWhenVisible } from '../rafWhenVisible';
import { ReelTile } from '../ReelTile';

const IG = 'https://instagram.com/aakashpahuja108';

// Reel cover art (saved locally in public/assets so it never depends on
// Instagram's expiring CDN URLs). Each square tile links to its own reel.
const REELS = [
  { href: 'https://www.instagram.com/reel/DUdT5r1kp9N/', cover: '/assets/reel-1.jpg' },
  { href: 'https://www.instagram.com/reel/DSPxuoskiJu/', cover: '/assets/reel-2.jpg' },
  { href: 'https://www.instagram.com/reel/CwnemWAyueR/', cover: '/assets/reel-3.jpg' },
];

/** Six neon strings that become the audio waveform — bass moves the low strings,
 *  treble the high ones; hovering "strums" them (§12 SC-06). */
function Strings() {
  const ref = useRef<HTMLCanvasElement>(null);
  const strum = useRef(0);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = 0;
    let H = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const onR = () => resize();
    window.addEventListener('resize', onR);
    const N = 6;
    const t0 = performance.now();
    const draw = () => {
      const reduced = useExperience.getState().reducedMotion;
      const b = audio.bands();
      strum.current *= 0.94;
      const t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < N; i++) {
        const y = (H / (N + 1)) * (i + 1);
        const band = i < 2 ? b.bass : i < 4 ? b.mid : b.treble;
        const amp = (reduced ? 2 : (2 + band * 26 + strum.current * 30)) * (0.5 + i * 0.12);
        const hue = ['#5de5e0', '#8b7bf7', '#ff5db1', '#ff8a5b', '#37d29b', '#7c9bff'][i];
        ctx.strokeStyle = hue;
        ctx.globalAlpha = 0.45 + band * 0.5 + strum.current * 0.4;
        ctx.lineWidth = 1.5 + band * 2;
        ctx.shadowColor = hue;
        ctx.shadowBlur = 8 + band * 16;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 6) {
          const k = x / W;
          const env = Math.sin(k * Math.PI); // pinned at both ends like a real string
          const yy = y + Math.sin(k * (8 + i) * Math.PI + t * (4 + i) + i) * amp * env * (reduced ? 0.2 : 1);
          x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };
    const stop = rafWhenVisible(canvas, draw);
    return () => {
      stop();
      window.removeEventListener('resize', onR);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      onMouseMove={() => {
        strum.current = Math.min(1, strum.current + 0.15);
      }}
      style={{ width: '100%', height: 'clamp(180px,26vh,260px)', display: 'block', cursor: 'crosshair' }}
    />
  );
}

export default function Guitar() {
  return (
    <Chapter id="guitar" label="Guitar & Singing">
      <Kicker n="06" accent="var(--magenta)">
        Guitar &amp; Singing
      </Kicker>
      <Reveal>
        <h2 style={{ ...h2Style, maxWidth: '16ch' }}>The strings are the waveform.</h2>
      </Reveal>
      <Reveal delay={0.05}>
        <p style={{ ...leadStyle, marginBottom: 26 }}>
          Hover the strings to strum them — they ride the track you're hearing. Covers and originals live on Instagram.
        </p>
      </Reveal>

      <Reveal delay={0.08}>
        <div style={{ ...glassCard, padding: '26px 26px 14px', overflow: 'hidden' }}>
          <Strings />
        </div>
      </Reveal>

      {/* Sync the reel row with the strings card above it (it sits ~31% vh
          lower, so the default trigger would slide it in on a separate scroll)
          — reveal it together with the rest of the section. */}
      <Reveal delay={0.12} margin="0px 0px -9% 0px">
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 28, alignItems: 'center' }}>
          {REELS.map((reel, i) => (
            <ReelTile key={reel.href} href={reel.href} cover={reel.cover} index={i} total={REELS.length} subject="guitar cover" accent="var(--magenta)" glowRgb="255,93,177" />
          ))}
          <a href={IG} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--magenta)', textDecoration: 'none', padding: '10px 18px', border: '1px solid var(--glass-border)', borderRadius: 999 }}>
            @aakashpahuja108 ↗
          </a>
        </div>
      </Reveal>
    </Chapter>
  );
}
