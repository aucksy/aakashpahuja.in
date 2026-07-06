import { motion } from 'framer-motion';
import Chapter from '../Chapter';
import { Reveal } from '../ui';
import { useIsMobile } from '@/lib/useIsMobile';

const EASE = [0.2, 0.7, 0.2, 1] as const;

function Words({
  text,
  style,
  accentWord,
  accentStyle,
}: {
  text: string;
  style: React.CSSProperties;
  accentWord?: string;
  accentStyle?: React.CSSProperties;
}) {
  const words = text.split(' ');
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.5 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
      style={style}
    >
      {words.map((w, i) => {
        const isAccent = accentWord != null && w.replace(/[.,!?'"]/g, '').toLowerCase() === accentWord.toLowerCase();
        return (
          <motion.span
            key={i}
            variants={{
              hidden: { opacity: 0, y: 26, filter: 'blur(10px)' },
              show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
            }}
            style={{ display: 'inline-block', marginRight: '0.26em', ...(isAccent ? accentStyle : null) }}
          >
            {w}
          </motion.span>
        );
      })}
    </motion.div>
  );
}

/** SC-03 — the arrival. The hero statement over the living city; the avatar
 *  walk-in (AvatarIntro) plays over this beat and settles bottom-left. */
export default function Hero() {
  const isMobile = useIsMobile();
  const bigStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 'clamp(36px,7.4vw,90px)',
    lineHeight: 1.0,
    letterSpacing: '-0.035em',
    textShadow: '0 2px 40px rgba(5,6,11,0.35)',
    maxWidth: '16ch',
  };
  const obsessionStyle: React.CSSProperties = {
    fontFamily: 'var(--font-serif)',
    fontStyle: 'italic',
    background: 'linear-gradient(100deg,var(--cyan),var(--violet) 55%,var(--magenta))',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  };
  return (
    <Chapter id="hero" label="Hero">
      {/* Identity — desktop: single line in the content flow. Mobile: name +
          title on two lines, pinned to the top centre of the section. */}
      {isMobile ? (
        <div style={{ position: 'absolute', top: 'clamp(16px,6vh,54px)', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(21px,6.4vw,30px)', letterSpacing: '-0.01em', color: 'var(--ink)' }}>Aakash Pahuja</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--cyan)', marginTop: 6 }}>Digital Product Designer</div>
        </div>
      ) : (
        <Reveal immediate>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 26 }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--cyan)', boxShadow: '0 0 12px var(--cyan)' }} />
            Aakash Pahuja — Digital Product Manager / Designer
          </div>
        </Reveal>
      )}

      {/* Hero statement — two big lines; "obsession" in the accent gradient. */}
      <Words text="Products aren't built with prompts." style={bigStyle} />
      <Words text="They're forged through obsession." style={bigStyle} accentWord="obsession" accentStyle={obsessionStyle} />

      <Reveal delay={0.6} immediate>
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
