import { useEffect, useMemo, useRef } from 'react';
import Chapter from '../Chapter';
import { Kicker, Reveal, h2Style, leadStyle, glassCard } from '../ui';
import { rafWhenVisible } from '../rafWhenVisible';
import { useIsMobile } from '@/lib/useIsMobile';

const GH = 'https://github.com/aucksy';
const WEEKS = 52;
const DAYS = 7;

/** The contribution graph reimagined as a drifting 3D-ish star-field (§12 SC-08).
 *  Intensities are a fixed pseudo-pattern (sample data) — wiring the live graph
 *  from github.com/aucksy is a GitHub-MCP enhancement (flagged in ASSETS_TODO). */
function Constellation({ mobile }: { mobile: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cells = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < WEEKS * DAYS; i++) {
      // deterministic pseudo-noise → a plausible contribution texture
      const v = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      out.push(Math.max(0, Math.abs(v) - 0.25) / 0.75);
    }
    return out;
  }, []);

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
    const t0 = performance.now();
    const draw = () => {
      const t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      const pad = 12;
      const cw = (W - pad * 2) / WEEKS;
      // Phone: let the 7 rows use the FULL height so the field fills its card
      // (desktop keeps square cells). Stars are nudged bigger to stay dense.
      const ch = mobile ? (H - pad * 2) / DAYS : Math.min(cw, (H - pad * 2) / DAYS);
      const oy = (H - ch * DAYS) / 2;
      for (let x = 0; x < WEEKS; x++) {
        for (let y = 0; y < DAYS; y++) {
          const v = cells[x * DAYS + y];
          if (v < 0.02) continue;
          const tw = 0.7 + 0.3 * Math.sin(t * 1.5 + x * 0.4 + y);
          const px = pad + x * cw + cw / 2;
          const py = oy + y * ch + ch / 2;
          const r = (1.2 + v * 3.2) * tw * (mobile ? 1.4 : 1);
          ctx.fillStyle = `rgba(93,229,224,${0.15 + v * 0.75 * tw})`;
          ctx.shadowColor = '#5de5e0';
          ctx.shadowBlur = v * 12 * tw;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, 6.28);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
    };
    const stop = rafWhenVisible(canvas, draw);
    return () => {
      stop();
      window.removeEventListener('resize', onR);
    };
  }, [cells]);

  return <canvas ref={ref} aria-hidden="true" style={{ width: '100%', height: mobile ? 'clamp(250px,44vh,420px)' : 'clamp(160px,24vh,230px)', display: 'block' }} />;
}

export default function GitHub() {
  const isMobile = useIsMobile();
  return (
    <Chapter id="github" label="GitHub">
      <Kicker n="06" accent="var(--cyan)">
        GitHub — the constellation
      </Kicker>
      <Reveal>
        <h2 style={{ ...h2Style, maxWidth: '18ch' }}>Contributions as a star-field.</h2>
      </Reveal>
      <Reveal delay={0.05}>
        <p style={{ ...leadStyle, marginBottom: 26 }}>
          A year of commits, reimagined as a sky you fly through. Each star is a day's work.
        </p>
      </Reveal>

      <Reveal delay={0.08}>
        <div style={{ ...glassCard, padding: '22px 20px', overflow: 'hidden', position: 'relative' }}>
          <Constellation mobile={isMobile} />
          <div style={{ position: 'absolute', top: 12, right: 16, fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
            sample · live graph via GitHub MCP
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <a href={GH} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 24, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cyan)', textDecoration: 'none', padding: '11px 20px', border: '1px solid var(--glass-border)', borderRadius: 999 }}>
          github.com/aucksy ↗
        </a>
      </Reveal>
    </Chapter>
  );
}
