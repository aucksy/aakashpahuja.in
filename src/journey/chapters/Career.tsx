import { type CSSProperties, type ReactNode } from 'react';
import Chapter from '../Chapter';
import { Kicker, Reveal, h2Style, glassCard } from '../ui';
import { useIsMobile } from '@/lib/useIsMobile';

// "Career" — the day job (§ user). One glass slab for the Amex chapter: role
// header, the current + completed flagship projects, and the road that led here.

const scaleStyle: CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontStyle: 'italic',
  background: 'linear-gradient(100deg,var(--blue),var(--cyan) 60%,var(--violet))',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

const bodyStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'clamp(14.5px,1.5vw,17.5px)',
  lineHeight: 1.68,
  color: 'var(--muted)',
  margin: 0,
};

const strongStyle: CSSProperties = { color: 'var(--ink)', fontWeight: 600 };

function Project({ tone, status, title, children }: { tone: string; status: string; title: string; children: ReactNode }) {
  return (
    <div style={{ background: 'var(--glass-fill)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 'clamp(18px,2.4vw,26px)' }}>
      <span
        style={{
          display: 'inline-block',
          padding: '5px 13px',
          borderRadius: 999,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: tone,
          border: `1px solid ${tone}`,
        }}
      >
        {status}
      </span>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(16.5px,1.9vw,20px)', color: 'var(--ink)', margin: '14px 0 10px', letterSpacing: '-0.01em' }}>
        {title}
      </div>
      <p style={bodyStyle}>{children}</p>
    </div>
  );
}

export default function Career() {
  const isMobile = useIsMobile();
  return (
    <Chapter id="career" label="Career">
      <Kicker n="04" accent="var(--blue)">
        Career
      </Kicker>
      <Reveal>
        <h2 style={{ ...h2Style, maxWidth: '20ch' }}>
          Product management, <span style={scaleStyle}>at enterprise scale.</span>
        </h2>
      </Reveal>
      <Reveal delay={0.12}>
        <div style={{ ...glassCard, padding: 'clamp(22px,3.6vw,42px)', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 'clamp(20px,2.6vw,28px)' }}>
            <span
              style={{
                padding: '6px 13px',
                borderRadius: 8,
                background: '#006fcf',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: '0.14em',
              }}
            >
              AMERICAN EXPRESS
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(17px,2.3vw,24px)', color: 'var(--ink)', letterSpacing: '-0.015em' }}>
              Sr. Associate — Digital Product Management
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <Project tone="var(--blue)" status="Current" title="Enterprise Intake & Governance Portal">
              Driving product strategy for an enterprise portal that modernises how customer communications are created, governed and
              delivered across markets — one digital entry point for the entire lifecycle, inside a large multi-year transformation
              program.
            </Project>
            <Project tone="var(--emerald)" status="Completed" title="Legacy Platform Migration">
              Led end-to-end discovery and migration of hundreds of legacy communication templates across 19 markets to a modern
              platform — reverse-engineering undocumented workflows and training engineering teams on the framework that made it
              repeatable.
            </Project>
          </div>
          <p style={{ ...bodyStyle, marginTop: 'clamp(20px,2.6vw,26px)', maxWidth: '78ch' }}>
            Before that: nearly a decade at Amex across <strong style={strongStyle}>UAT delivery</strong> (90+ projects, 500+
            communications) and <strong style={strongStyle}>customer service</strong> — plus a string of founder ventures
            along the way: a tech consultancy, a D2C apparel brand, an online grocery store and a music-gear brand — all chapters
            closed. Product mindset, learned the hard way.
          </p>
          <p style={{ ...bodyStyle, marginTop: 14, maxWidth: '78ch' }}>
            The nights sharpen the days — shipping my own apps end-to-end keeps my enterprise product calls grounded in how software
            actually gets built.
          </p>
        </div>
      </Reveal>
    </Chapter>
  );
}
