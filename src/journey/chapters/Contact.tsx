import Chapter from '../Chapter';
import { Reveal } from '../ui';

const LINKS = [
  { label: 'Email', value: 'aakashpahuja1990@gmail.com', href: 'mailto:aakashpahuja1990@gmail.com', accent: 'var(--cyan)' },
  { label: 'GitHub', value: 'github.com/aucksy', href: 'https://github.com/aucksy', accent: 'var(--violet)' },
  { label: 'Instagram', value: '@aakashpahuja108', href: 'https://instagram.com/aakashpahuja108', accent: 'var(--magenta)' },
  { label: 'Hevy', value: 'hevy.com/user/aucksy', href: 'https://hevy.com/user/aucksy', accent: 'var(--coral)' },
];

/** SC-09 — the road curves into the sky; contact links as constellations. */
export default function Contact() {
  return (
    <Chapter id="contact" label="Contact">
      <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
        <Reveal>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 22 }}>
            07 · Arrival
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(36px,7vw,84px)', lineHeight: 1.0, letterSpacing: '-0.03em', margin: 0, textWrap: 'balance' }}>
            Let's build something
            <br />
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', background: 'linear-gradient(100deg,var(--gold),var(--coral),var(--magenta))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              people love.
            </span>
          </h2>
        </Reveal>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, margin: '48px 0 0' }}>
          {LINKS.map((l, i) => (
            <Reveal key={l.label} delay={0.1 + i * 0.05}>
              <a
                href={l.href}
                target={l.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  padding: '16px 24px',
                  borderRadius: 16,
                  background: 'var(--glass-fill)',
                  border: '1px solid var(--glass-border)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  minWidth: 200,
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: l.accent, marginBottom: 6 }}>{l.label}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink)' }}>{l.value}</div>
              </a>
            </Reveal>
          ))}
        </div>

        {/* Last line of the last (centred) section: at max scroll it rests at
            ~86% of the viewport and can't rise higher, so it needs a shallow
            trigger or it would never cross the default line and reveal. */}
        <Reveal delay={0.4} margin="0px 0px -8% 0px">
          <div style={{ marginTop: 64, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--dim)' }}>
            Aakash Pahuja · Work earns the meeting · Play earns the memory
          </div>
        </Reveal>
      </div>
    </Chapter>
  );
}
