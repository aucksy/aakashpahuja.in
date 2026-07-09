import { type CSSProperties } from 'react';
import Chapter from '../Chapter';
import { Kicker, Reveal, h2Style } from '../ui';
import { useIsMobile } from '@/lib/useIsMobile';

// "Hello" — the person behind the products (§ user). A taped studio portrait
// beside the intro prose and proof-point chips, carried over from the print
// site's copy but dressed in this world's glass.

const feelStyle: CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontStyle: 'italic',
  background: 'linear-gradient(100deg,var(--gold),var(--coral),var(--magenta))',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

const bodyStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'clamp(15.5px,1.6vw,19px)',
  lineHeight: 1.7,
  color: 'var(--muted)',
  maxWidth: '58ch',
  margin: '0 0 18px',
};

const strongStyle: CSSProperties = { color: 'var(--ink)', fontWeight: 600 };

const STATS = [
  { n: '9+', label: 'years in product @ Amex' },
  { n: '6', label: 'apps designed & shipped solo' },
  { n: '0', label: 'templates used' },
  { n: '∞', label: 'black coffee' },
] as const;

export default function About() {
  const isMobile = useIsMobile();
  return (
    <Chapter id="about" label="Hello">
      <Kicker n="02" accent="var(--gold)">
        Hello
      </Kicker>
      <div
        style={
          isMobile
            ? { display: 'flex', flexDirection: 'column', gap: 36 }
            : { display: 'grid', gridTemplateColumns: 'minmax(0,0.9fr) minmax(0,1.1fr)', gap: 'clamp(40px,5.5vw,76px)', alignItems: 'center' }
        }
      >
        {/* The portrait, taped up like a keepsake over the world. */}
        <Reveal>
          <div style={{ position: 'relative', maxWidth: isMobile ? 320 : 430, margin: isMobile ? '10px auto 0' : undefined, transform: 'rotate(-1.6deg)' }}>
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: -12,
                left: '50%',
                width: 96,
                height: 26,
                zIndex: 1,
                transform: 'translateX(-50%) rotate(-3.5deg)',
                background: 'linear-gradient(rgba(224,207,170,0.38),rgba(224,207,170,0.22))',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 3,
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)',
              }}
            />
            <img
              src="/assets/portrait.webp"
              alt="Aakash in his studio at night — guitar in hand, code on the screen behind him"
              loading="lazy"
              style={{ width: '100%', display: 'block', borderRadius: 18, border: '1px solid var(--glass-border)', boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7)' }}
            />
          </div>
        </Reveal>

        <div>
          <Reveal delay={0.08}>
            <h2 style={{ ...h2Style, maxWidth: '18ch' }}>
              Design is how it works — <span style={feelStyle}>and how it feels.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p style={bodyStyle}>
              I'm a <strong style={strongStyle}>passionate product designer and vibe coder</strong> who loves creating flawless digital
              experiences. By day I do product management at American Express; by night I design, code and ship my own apps — every
              flow, every empty state, every haptic.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <p style={bodyStyle}>
              Deeply caring about the <strong style={strongStyle}>end user</strong> isn't a line on my resume. It's why everything I
              ship has an undo, a dark mode, and copy written for the person having a bad day.
            </p>
          </Reveal>
          <Reveal delay={0.32}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
              {STATS.map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 16px',
                    borderRadius: 999,
                    background: 'var(--glass-fill)',
                    border: '1px solid var(--glass-border)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--gold)' }}>{s.n}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '0.05em', color: 'var(--muted)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </Chapter>
  );
}
