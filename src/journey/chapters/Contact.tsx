import Chapter from '../Chapter';
import { Reveal } from '../ui';
import { useIsMobile } from '@/lib/useIsMobile';

const LINKS = [
  { label: 'Email', value: 'connect@aakashpahuja.in', href: 'mailto:connect@aakashpahuja.in', accent: 'var(--cyan)' },
  { label: 'GitHub', value: 'github.com/aucksy', href: 'https://github.com/aucksy', accent: 'var(--violet)' },
  { label: 'Instagram', value: '@aakashpahuja108', href: 'https://instagram.com/aakashpahuja108', accent: 'var(--magenta)' },
  { label: 'Hevy', value: 'hevy.com/user/aucksy', href: 'https://hevy.com/user/aucksy', accent: 'var(--coral)' },
];

// The last, centred section: its content can't scroll above centre, so the
// aggressive default reveal trigger (~60% vh) would strand the lower links and
// footer (they never cross the line). Reveal the whole section as it rises into
// view from the bottom instead — everything sits below ~86% at max scroll.
const NEAR = '0px 0px -10% 0px';

/** SC-09 — the road curves into the sky; contact links as constellations. */
export default function Contact() {
  const isMobile = useIsMobile();
  return (
    <Chapter id="contact" label="Contact">
      <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
        <Reveal margin={NEAR}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 22 }}>
            {isMobile ? 'Arrival' : '09 · Arrival'}
          </div>
        </Reveal>
        <Reveal delay={0.05} margin={NEAR}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(36px,7vw,84px)', lineHeight: 1.0, letterSpacing: '-0.03em', margin: 0, textWrap: 'balance' }}>
            The journey ends here —
            <br />
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', background: 'linear-gradient(100deg,var(--gold),var(--coral),var(--magenta))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              the conversation doesn't have to.
            </span>
          </h2>
        </Reveal>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, margin: '48px 0 0' }}>
          {LINKS.map((l, i) => (
            <Reveal key={l.label} delay={0.1 + i * 0.05} margin={NEAR}>
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

        <Reveal delay={0.4} margin={NEAR}>
          <div style={{ marginTop: 64, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--dim)' }}>
            Aakash Pahuja · Work earns the meeting · Play earns the memory
          </div>
        </Reveal>
      </div>
    </Chapter>
  );
}
