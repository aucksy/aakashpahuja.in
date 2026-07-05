import { useEffect, useRef, useState } from 'react';
import Chapter from '../Chapter';
import { Kicker, Reveal, h2Style, leadStyle, glassCard } from '../ui';
import { audio } from '@/audio/AudioEngine';
import { useExperience } from '@/store/useExperience';
import { rafWhenVisible } from '../rafWhenVisible';

const IG = 'https://instagram.com/aakashpahuja108';

// Real reel covers (pulled from the posts, saved locally so they never depend on
// Instagram's expiring CDN URLs). Each tile links to its own reel.
const REELS = [
  { href: 'https://www.instagram.com/reel/DUdT5r1kp9N/', cover: '/assets/reel-1.jpg' },
  { href: 'https://www.instagram.com/reel/DSPxuoskiJu/', cover: '/assets/reel-2.jpg' },
  { href: 'https://www.instagram.com/reel/CwnemWAyueR/', cover: '/assets/reel-3.jpg' },
];

const EASE = 'cubic-bezier(0.2,0.7,0.2,1)';

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

/** A single reel cover: 9:16 thumbnail that links out to the Instagram reel,
 *  lifting + glowing in the chapter accent on hover/focus (§08 glass system). */
function ReelCard({ href, cover, index }: { href: string; cover: string; index: number }) {
  const [hover, setHover] = useState(false);
  const reduced = useExperience.getState().reducedMotion;
  const lift = hover && !reduced;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Watch guitar cover reel ${index + 1} of ${REELS.length} on Instagram`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        position: 'relative',
        flex: '1 1 96px',
        maxWidth: 168,
        aspectRatio: '9 / 16',
        borderRadius: 18,
        overflow: 'hidden',
        display: 'block',
        textDecoration: 'none',
        background: '#0a0d16',
        border: `1px solid ${hover ? 'var(--magenta)' : 'var(--glass-border)'}`,
        boxShadow: hover
          ? '0 28px 60px -22px rgba(255,93,177,0.7), inset 0 1px 0 rgba(255,255,255,0.12)'
          : '0 20px 50px -26px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
        transform: lift ? 'translateY(-6px)' : 'translateY(0)',
        transition: `transform 0.5s ${EASE}, box-shadow 0.5s ease, border-color 0.5s ease`,
      }}
    >
      <img
        src={cover}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: hover ? 'brightness(1)' : 'brightness(0.9)',
          transform: lift ? 'scale(1.06)' : 'scale(1)',
          transition: `transform 0.9s ${EASE}, filter 0.5s ease`,
        }}
      />
      {/* grounding scrim so the tile reads as one object over any world */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,7,14,0.72) 0%, rgba(6,7,14,0) 44%)', pointerEvents: 'none' }} />
      {/* opens-externally affordance — subtle at rest, lit on hover */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 24,
          height: 24,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          fontSize: 12,
          lineHeight: 1,
          color: '#fff',
          background: 'rgba(10,13,22,0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: hover ? 1 : 0.7,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
        }}
      >
        ↗
      </div>
      <span style={{ position: 'absolute', left: 10, bottom: 9, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.92)', pointerEvents: 'none' }}>
        Reel
      </span>
    </a>
  );
}

export default function Guitar() {
  return (
    <Chapter id="guitar" label="Guitar & Singing">
      <Kicker n="04" accent="var(--magenta)">
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

      <Reveal delay={0.12}>
        <div style={{ marginTop: 30 }}>
          <div style={{ display: 'flex', gap: 'clamp(10px,1.6vw,16px)', flexWrap: 'wrap', alignItems: 'stretch', maxWidth: 560 }}>
            {REELS.map((reel, i) => (
              <ReelCard key={reel.href} href={reel.href} cover={reel.cover} index={i} />
            ))}
          </div>
          <a href={IG} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 20, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--magenta)', textDecoration: 'none', padding: '10px 18px', border: '1px solid var(--glass-border)', borderRadius: 999 }}>
            @aakashpahuja108 ↗
          </a>
        </div>
      </Reveal>
    </Chapter>
  );
}
