import { useRef, useState } from 'react';
import { motion, animate } from 'framer-motion';
import Chapter from '../Chapter';
import { Kicker, Reveal, glassCard } from '../ui';
import { ReelTile } from '../ReelTile';

const TOTAL = 9775; // kg lifted since 2022 (Hevy · hevy.com/user/aucksy)
const BUS = 12000; // a London double-decker
const HEVY = 'https://hevy.com/user/aucksy';

// Workout reel covers (saved locally in public/assets). Same square-tile
// pattern as the Guitar chapter; the Hevy pill sits after them.
const REELS = [
  { href: 'https://www.instagram.com/reel/ComBPwdgzXx/', cover: '/assets/workout-1.jpg' },
  { href: 'https://www.instagram.com/reel/CpjoO7jomOk/', cover: '/assets/workout-2.jpg' },
];

const EQUIV = [
  { n: '≈ 20', unit: 'grand pianos' },
  { n: '≈ 4', unit: 'rhinos' },
  { n: '≈ 8', unit: 'small cars' },
];

function CountUp({ to }: { to: number }) {
  const [v, setV] = useState(0);
  const started = useRef(false);
  return (
    <motion.span
      onViewportEnter={() => {
        if (started.current) return;
        started.current = true;
        animate(0, to, { duration: 2.0, ease: [0.2, 0.7, 0.2, 1], onUpdate: (x) => setV(Math.round(x)) });
      }}
      viewport={{ once: true, amount: 0.6 }}
    >
      {v.toLocaleString()}
    </motion.span>
  );
}

export default function Fitness() {
  const pct = Math.round((TOTAL / BUS) * 100);
  return (
    <Chapter id="fitness" label="Fitness">
      <Kicker n="03" accent="var(--coral)">
        Fitness — the lifting saga
      </Kicker>

      <Reveal>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
          Total lifted since 2022
        </div>
      </Reveal>
      <Reveal delay={0.05}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 'clamp(64px,15vw,180px)',
            lineHeight: 0.9,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(100deg,var(--coral),var(--gold) 60%,var(--magenta))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 0 40px rgba(255,138,91,0.25))',
          }}
        >
          <CountUp to={TOTAL} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.32em', WebkitTextFillColor: 'var(--ink)', marginLeft: 14 }}>kg</span>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(16px,1.8vw,20px)', lineHeight: 1.6, color: 'var(--muted)', maxWidth: '56ch', margin: '22px 0 0' }}>
          Every rep since 2022, tracked and stacked. That's the same weight as…
        </p>
      </Reveal>

      <Reveal delay={0.12}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '26px 0 0' }}>
          {EQUIV.map((e) => (
            <div key={e.unit} style={{ ...glassCard, borderRadius: 16, padding: '18px 24px', minWidth: 150 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 28, color: 'var(--coral)' }}>{e.n}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em', color: 'var(--muted)', marginTop: 4 }}>{e.unit}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* progress toward a London bus */}
      <Reveal delay={0.15}>
        <div style={{ maxWidth: 620, marginTop: 34 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 8 }}>
            <span>{pct}% of the way to a London bus</span>
            <span>12,000 kg</span>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 1.6, ease: [0.2, 0.7, 0.2, 1], delay: 0.2 }}
              style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,var(--coral),var(--gold))', boxShadow: '0 0 18px rgba(255,138,91,0.6)' }}
            />
          </div>
        </div>
      </Reveal>

      {/* Workout reels + the Hevy pill — same square-tile row as Guitar & Singing */}
      <Reveal delay={0.18}>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 28, alignItems: 'center' }}>
          {REELS.map((reel, i) => (
            <ReelTile key={reel.href} href={reel.href} cover={reel.cover} index={i} total={REELS.length} subject="workout" accent="var(--coral)" glowRgb="255,138,91" />
          ))}
          <a href={HEVY} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--coral)', textDecoration: 'none', padding: '10px 18px', border: '1px solid var(--glass-border)', borderRadius: 999 }}>
            The log on Hevy ↗
          </a>
        </div>
      </Reveal>
    </Chapter>
  );
}
