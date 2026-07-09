import Chapter from '../Chapter';
import { Kicker, Reveal, h2Style, leadStyle } from '../ui';

interface Game {
  title: string;
  tag: string;
  img: string;
  bg: string; // fallback gradient behind the key art (shows if the image fails)
  glow: string;
}

const GAMES: Game[] = [
  {
    title: 'Elden Ring',
    tag: 'The Lands Between',
    img: '/assets/game-elden.avif',
    bg: 'radial-gradient(120% 100% at 70% 20%, rgba(232,192,125,0.5), transparent 60%), linear-gradient(160deg,#1a1206,#0a0a12)',
    glow: '#e8c07d',
  },
  {
    title: 'Black Myth: Wukong',
    tag: 'The journey west',
    img: '/assets/game-wukong.jpg',
    bg: 'radial-gradient(120% 100% at 30% 30%, rgba(55,210,155,0.4), transparent 55%), radial-gradient(80% 80% at 90% 90%, rgba(255,93,113,0.35), transparent 60%), linear-gradient(160deg,#06140f,#0a0a12)',
    glow: '#37d29b',
  },
  {
    title: 'God of War',
    tag: 'The Norse saga',
    img: '/assets/game-gow.jpg',
    bg: 'radial-gradient(120% 100% at 60% 25%, rgba(124,155,255,0.45), transparent 60%), linear-gradient(160deg,#081020,#0a0a12)',
    glow: '#7c9bff',
  },
];

export default function Gaming() {
  return (
    <Chapter id="gaming" label="Gaming">
      <Kicker n="07" accent="var(--violet)">
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
              }}
            >
              <img
                src={g.img}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
              />
              {/* readability scrim — dark at the bottom where the title sits */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,5,10,0.92) 0%, rgba(4,5,10,0.62) 24%, rgba(4,5,10,0.12) 52%, rgba(4,5,10,0) 78%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(24px,4vw,44px)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: g.glow, marginBottom: 8, textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>{g.tag}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(30px,5vw,60px)', letterSpacing: '-0.02em', lineHeight: 1, color: '#fff', textShadow: '0 6px 40px rgba(0,0,0,0.75)' }}>{g.title}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Chapter>
  );
}
