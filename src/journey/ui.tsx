import { type ReactNode, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { useExperience } from '@/store/useExperience';

// Shared journey UI kit — keeps every chapter on the one glass design system
// (§08) so the travel feels like one continuous world, not seven pages.

const EASE = [0.2, 0.7, 0.2, 1] as const;

/** Content that slides up into place as it's scrolled to — a pronounced y-rise
 *  + fade + unblur. The trigger is held until the element reaches ~60% of the
 *  viewport height (just below centre) so the motion plays right as you arrive
 *  at it, rather than finishing a screen early. Honours reduced-motion (fade
 *  only, no travel/blur).
 *
 *  `margin` (IntersectionObserver rootMargin) can be overridden for elements
 *  that rest low in the viewport at max scroll — e.g. the last line of the last
 *  (centred) section, which never rises past ~86% and would otherwise never
 *  cross the default trigger line. Give those a shallow bottom margin. */
export function Reveal({
  children,
  delay = 0,
  y = 56,
  margin = '0px 0px -40% 0px',
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  margin?: string;
  style?: CSSProperties;
}) {
  const reduced = useExperience((s) => s.reducedMotion);
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin }}
      transition={reduced ? { duration: 0.3, delay } : { duration: 0.72, ease: EASE, delay }}
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
