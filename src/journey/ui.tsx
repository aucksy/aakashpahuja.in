import { type ReactNode, type CSSProperties } from 'react';
import { motion } from 'framer-motion';

// Shared journey UI kit — keeps every chapter on the one glass design system
// (§08) so the travel feels like one continuous world, not seven pages.

const EASE = [0.2, 0.7, 0.2, 1] as const;

/** Content that arrives on scroll — y+blur rise, honouring reduced-motion. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  style?: CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-12% 0px -12% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/** Chapter kicker: "02 · My Apps" with the chapter accent. */
export function Kicker({ n, children, accent }: { n: string; children: ReactNode; accent: string }) {
  return (
    <Reveal>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5,
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          color: accent,
          marginBottom: 18,
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: 2, background: accent, boxShadow: `0 0 12px ${accent}` }} />
        {n} · {children}
      </div>
    </Reveal>
  );
}

export const sectionStyle: CSSProperties = {
  position: 'relative',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: 'clamp(90px,14vh,150px) 0',
};

export const h2Style: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  fontSize: 'var(--fs-h2)',
  lineHeight: 1.0,
  letterSpacing: '-0.025em',
  margin: '0 0 22px',
  textWrap: 'balance',
};

export const leadStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--fs-lead)',
  lineHeight: 1.6,
  color: 'var(--muted)',
  maxWidth: '62ch',
  margin: 0,
};

export const glassCard: CSSProperties = {
  background: 'var(--glass-fill)',
  border: '1px solid var(--glass-border)',
  borderRadius: 22,
  backdropFilter: 'blur(20px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
  boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
};
