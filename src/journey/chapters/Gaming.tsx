import Chapter from '../Chapter';
import { Kicker, Reveal, h2Style, leadStyle } from '../ui';

interface Game {
  title: string;
  tag: string;
  bg: string;
  glow: string;
}

const GAMES: Game[] = [
  {
    title: 'Elden Ring',
    tag: 'The Lands Between',
    bg: 'radial-gradient(120% 100% at 70% 20%, rgba(232,192,125,0.5), transparent 60%), linear-gradient(160deg,#1a1206,#0a0a12)',
    glow: '#e8c07d',
  },
  {
    title: 'Black Myth: Wukong',
    tag: 'The journey west',
    bg: 'radial-gradient(120% 100% at 30% 30%, rgba(55,210,155,0.4), transparent 55%), radial-gradient(80% 80% at 90% 90%, rgba(255,93,113,0.35), transparent 60%), linear-gradient(160deg,#06140f,#0a0a12)',
    glow: '#37d29b',
  },
  {
    title: 'God of War',
    tag: 'The Norse saga',
    bg: 'radial-gradient(120% 100% at 60% 25%, rgba(124,155,255,0.45), transparent 60%), linear-gradient(160deg,#081020,#0a0a12)',
    glow: '#7c9bff',
  },
];

export default function Gaming() {
  return (
    <Chapter id="gaming" label="Gaming">
      <Kicker n="05" accent="var(--violet)">
        Gaming — three worlds
      </Kicker>
      <Reveal>
        <h2 style={{ ...h2Style, maxWidth: '18ch' }}>Worlds the road passes through.</h2>
      </Reveal>
      <Reveal delay={0.05}>
        <p style={{ ...leadStyle, marginBottom: 30 }}>
          The stories I keep returning to — for the direction, the combat, the myth. Three portals along the way.
        </p>
      </Reveal>

      <div style={{ display: 'grid', gap: 18 }}>
        {GAMES.map((g, i) => (
          <Reveal key={g.title} y={44} delay={i * 0.04}>
            <div
              style={{
                position: 'relative',
                height: 'clamp(220px,34vh,320px)',
                borderRadius: 22,
                overflow: 'hidden',
                background: g.bg,
                border: '1px solid var(--glass-border)',
                boxShadow: `0 40px 90px -40px ${g.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: 'clamp(24px,4vw,44px)',
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: g.glow, marginBottom: 8 }}>{g.tag}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(30px,5vw,60px)', letterSpacing: '-0.02em', lineHeight: 1, textShadow: '0 6px 40px rgba(0,0,0,0.6)' }}>{g.title}</div>
              <div
                title="Licensed IP — official press-kit / Steam art to be added, with credit (§19-D)"
                style={{ position: 'absolute', top: 14, right: 16, fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, padding: '4px 10px' }}
              >
                ▲ key art placeholder
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Chapter>
  );
}
