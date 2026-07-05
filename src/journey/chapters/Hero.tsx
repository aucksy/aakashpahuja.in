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
      viewport={{ once: true, amount: 0.5 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
      style={style}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 26, filter: 'blur(10px)' },
            show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
          }}
          style={{ display: 'inline-block', marginRight: '0.26em' }}
        >
          {w}
        </motion.span>
      ))}
    </motion.div>
  );
}

/** SC-03 — the arrival. The hero statement over the living city; the avatar
 *  walk-in (AvatarIntro) plays over this beat and settles bottom-left. */
export default function Hero() {
  return (
    <Chapter id="hero" label="Hero">
      <Reveal>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 26 }}>
          <span style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--cyan)', boxShadow: '0 0 12px var(--cyan)' }} />
          Aakash Pahuja — Digital Product Manager / Designer
        </div>
      </Reveal>
      <Words
        text="Vibe Coding is easy,"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(44px,8.6vw,110px)', lineHeight: 0.96, letterSpacing: '-0.035em', textShadow: '0 2px 40px rgba(5,6,11,0.35)' }}
      />
      <Words
        text="shipping experiences people love requires obsession."
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 'clamp(30px,5.8vw,72px)',
          lineHeight: 1.04,
          letterSpacing: '-0.01em',
          marginTop: 14,
          maxWidth: '22ch',
          background: 'linear-gradient(100deg,var(--cyan),var(--violet) 55%,var(--magenta))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          filter: 'drop-shadow(0 0 30px rgba(139,123,247,0.3))',
        }}
      />
      <Reveal delay={0.7}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(15px,1.7vw,19px)', lineHeight: 1.62, color: 'var(--muted)', maxWidth: '52ch', margin: '32px 0 0' }}>
          Generating code has never been easier. Products people genuinely love still take product
          thinking, craft, iteration — obsession. I'm{' '}
          <b style={{ color: 'var(--ink)', fontWeight: 600 }}>Aakash</b>, and this road is the tour.
        </p>
      </Reveal>
      <Reveal delay={0.85}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 46, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
            Travel the road
          </motion.span>
          <span style={{ fontSize: 16 }}>↓</span>
        </div>
      </Reveal>
    </Chapter>
  );
}
