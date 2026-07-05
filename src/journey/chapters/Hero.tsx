import { motion } from 'framer-motion';
import Chapter from '../Chapter';
import { Reveal } from '../ui';

const EASE = [0.2, 0.7, 0.2, 1] as const;

function Words({ text, style }: { text: string; style: React.CSSProperties }) {
  const words = text.split(' ');
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
      style={style}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 24, filter: 'blur(10px)' },
            show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
          }}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
        >
          {w}
        </motion.span>
      ))}
    </motion.div>
  );
}

/** SC-03 — the arrival. Hero copy fades up over the city as the road appears. */
export default function Hero() {
  return (
    <Chapter id="hero" label="Hero">
      <Words
        text="Anyone can vibe-code."
        style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--fs-display)', lineHeight: 0.98, letterSpacing: '-0.03em' }}
      />
      <Words
        text="Products people love are an obsession."
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 'clamp(40px,8vw,92px)',
          lineHeight: 1.02,
          letterSpacing: '-0.01em',
          marginTop: 6,
          background: 'linear-gradient(100deg,var(--cyan),var(--violet) 55%,var(--magenta))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          filter: 'drop-shadow(0 0 30px rgba(139,123,247,0.25))',
        }}
      />
      <Reveal delay={0.6}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(16px,2vw,21px)', lineHeight: 1.6, color: 'var(--muted)', maxWidth: '54ch', margin: '34px 0 0' }}>
          I'm <b style={{ color: 'var(--ink)', fontWeight: 600 }}>Aakash Pahuja</b> — a Sr. Associate Product Manager who turns ambiguous programmes into
          shipped products, then goes and builds things for the sheer joy of it.
        </p>
      </Reveal>
      <Reveal delay={0.8}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 48, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
            Scroll to travel
          </motion.span>
          <span style={{ fontSize: 16 }}>↓</span>
        </div>
      </Reveal>
    </Chapter>
  );
}
