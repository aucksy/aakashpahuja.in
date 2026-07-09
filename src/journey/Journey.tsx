import { motion } from 'framer-motion';
import SmoothScroll from './SmoothScroll';
import ChapterRail from './ChapterRail';
import { Reveal } from './ui';
import { useIsMobile } from '@/lib/useIsMobile';
import Hero from './chapters/Hero';
import About from './chapters/About';
import Career from './chapters/Career';
import Apps from './chapters/Apps';
import Fitness from './chapters/Fitness';
import Guitar from './chapters/Guitar';
import Gaming from './chapters/Gaming';
import GitHub from './chapters/GitHub';
import Contact from './chapters/Contact';

/** A full-width divider — one big, hero-scale word that heads the Work and Play
 *  halves of the journey (§ user). Not a Chapter (it doesn't drive the rail). */
function Separator({ word, gradient }: { word: string; gradient: string }) {
  return (
    <section style={{ minHeight: '54vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px,9vh,110px) 0' }}>
      <Reveal>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 'clamp(40px,9vw,96px)',
            lineHeight: 0.95,
            letterSpacing: '-0.035em',
            textAlign: 'center',
            maxWidth: '13ch',
            textWrap: 'balance',
            background: gradient,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {word}
        </div>
      </Reveal>
    </section>
  );
}

/**
 * The travelling journey (§12–13). A centered content column (≤1080px) scrolls
 * over the fixed WebGL world; each chapter arrives as a set-piece. Hidden and
 * inert through the overture/burst, it fades in once the visitor is in the world.
 */
export default function Journey() {
  const isMobile = useIsMobile();
  // Mounts only once the visitor is in the world, so it fades up on mount.
  return (
    <>
      <SmoothScroll>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ position: 'relative', zIndex: 2 }}
        >
          <main id="content" style={{ maxWidth: 1080, margin: '0 auto', padding: '0 clamp(22px,5vw,54px)' }}>
            <Hero />
            {/* Who I am, then the day job — the "by day" half before the apps. */}
            <About />
            <Career />
            {/* "Meet my Apps" heads the work half; "Play" the rest. Big dividers. */}
            <Separator word="Meet my Apps" gradient="linear-gradient(100deg,var(--cyan),var(--violet) 55%,var(--magenta))" />
            <Apps />
            <Separator word="Play" gradient="linear-gradient(100deg,var(--gold),var(--coral),var(--magenta))" />
            <Fitness />
            <Guitar />
            <Gaming />
            {/* GitHub is sample data — dropped on phones (§ user); no gap left. */}
            {!isMobile && <GitHub />}
            <Contact />
          </main>
        </motion.div>
      </SmoothScroll>
      <ChapterRail />
    </>
  );
}
