import { motion } from 'framer-motion';
import Chapter from '../Chapter';
import { Reveal } from '../ui';
import { useIsMobile } from '@/lib/useIsMobile';
import { useExperience } from '@/store/useExperience';

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
    // Plays on MOUNT, like the hero's other pieces (Reveal `immediate`): the
    // hero is on screen the instant the world arrives. The old whileInView
    // (amount: 0.5) needed half the block visible — on phones the tall wrapped
    // lines + URL-bar viewport could leave the statement waiting for a scroll
    // while the mount-timed subtext played first, breaking the sequence
    // (§ user). Desktop timing is identical: its observer fired at mount anyway.
    <motion.div
      initial="hidden"
      animate="show"
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

/** SC-03 — the arrival. The hero statement over the living city. */
export default function Hero() {
  const isMobile = useIsMobile();
  const light = useExperience((s) => s.theme) === 'light';
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
      {/* Identity — MOBILE only: name + titles pinned to the top centre. On
          desktop the persistent HUD kicker (EnterControls, top-left) already
          names it — an in-content line here doubled the title (§ user). */}
      {isMobile && (
        <div style={{ position: 'absolute', top: 'clamp(16px,6vh,54px)', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(21px,6.4vw,30px)', letterSpacing: '-0.01em', color: 'var(--ink)' }}>Aakash Pahuja</div>
          {/* light world: black (accent teal is too faint on the sand); dark: unchanged */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: light ? '#191320' : 'var(--cyan)', marginTop: 6 }}>Vibe Coder</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: light ? '#191320' : 'var(--muted)', marginTop: 4 }}>Digital Product Manager</div>
        </div>
      )}

      {/* Hero statement — two big lines; "obsession" in the accent gradient. */}
      <Words text="Products aren't built with prompts." style={bigStyle} />
      <Words text="They're forged through obsession" style={bigStyle} accentWord="obsession" accentStyle={obsessionStyle} />

      {/* Subtext — the promise under the statement (§ user). */}
      <Reveal delay={0.55} immediate>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(15.5px,2vw,21px)',
            lineHeight: 1.65,
            color: 'var(--muted)',
            maxWidth: '50ch',
            margin: '26px 0 0',
            textShadow: '0 1px 30px rgba(5,6,11,0.4)',
          }}
        >
          I build and ship digital experiences end-to-end — and I sweat the last 2% most people never notice.{' '}
          <span style={{ color: 'var(--ink)' }}>Users feel it anyway.</span>
        </p>
      </Reveal>

      <Reveal delay={0.85} immediate>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 46, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
            Travel the path
          </motion.span>
          <span style={{ fontSize: 16 }}>↓</span>
        </div>
      </Reveal>
    </Chapter>
  );
}
