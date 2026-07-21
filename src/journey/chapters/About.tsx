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
  { n: '6', label: 'apps built & shipped solo' },
  { n: '0', label: 'templates used' },
  { n: '∞', label: 'black coffee' },
] as const;

export default function About() {
  const isMobile = useIsMobile();
  return (
    <Chapter id="about" label="Hello">
      {/* ONE Reveal for the whole section (§ user): kicker, portrait, heading,
          prose and chips arrive together as a single unit on both layouts —
          no per-element stagger, no image trailing the text. */}
      <Reveal>
        <Kicker n="02" accent="var(--gold)" plain>
          Hello
        </Kicker>
        <div
          style={
            isMobile
              ? { display: 'flex', flexDirection: 'column', gap: 36 }
              : { display: 'grid', gridTemplateColumns: 'minmax(0,0.9fr) minmax(0,1.1fr)', gap: 'clamp(40px,5.5vw,76px)', alignItems: 'start' }
          }
        >
          {/* The portrait, taped up like a keepsake over the world. */}
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
            {/* Eager on purpose: lazy-loading made the JPEG start downloading only
                on approach, so the reveal could play around a half-loaded image.
                The journey mounts at world — the file is ready long before scroll. */}
            <img
              src="/assets/portrait-studio.jpg"
              alt="Aakash in his home studio at night — a guitar, synth and a code-lit monitor behind him"
              style={{ width: '100%', height: 'auto', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block', borderRadius: 18, border: '1px solid var(--glass-border)', boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7)' }}
            />
          </div>

          <div>
            <h2 style={{ ...h2Style, maxWidth: '18ch' }}>
              Obsessed with how it works — <span style={feelStyle}>and how it feels.</span>
            </h2>
            <p style={bodyStyle}>
              I'm a <strong style={strongStyle}>vibe coder at heart</strong> — I love building flawless, delightful digital experiences
              anywhere a human meets a screen. By day I do product management at American Express; by night I design, code and ship my
              own apps — every flow, every empty state, every haptic. Nights and weekends, purely for the love of the craft.
            </p>
            <p style={bodyStyle}>
              Deeply caring about the <strong style={strongStyle}>end user</strong> isn't a line on my resume. It's why everything I
              ship has an undo, a dark mode, and copy written for the person having a bad day.
            </p>
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
          </div>
        </div>
      </Reveal>
    </Chapter>
  );
}
