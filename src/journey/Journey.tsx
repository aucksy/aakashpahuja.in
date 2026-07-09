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
 *  halves of the journey (§ user). An optional small mono line above the word
 *  playfully announces what's inside the half. Not a Chapter (no rail entry). */
function Separator({ word, sub, gradient }: { word: string; sub?: string; gradient: string }) {
  return (
    <section style={{ minHeight: '54vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px,9vh,110px) 0' }}>
      <Reveal>
        <div style={{ textAlign: 'center' }}>
          {sub && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(10px,1.6vw,13px)',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 18,
              }}
            >
              {sub}
            </div>
          )}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(40px,9vw,96px)',
              lineHeight: 0.95,
              letterSpacing: '-0.035em',
              maxWidth: '13ch',
              margin: '0 auto',
              textWrap: 'balance',
              background: gradient,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {word}
          </div>
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
            <About />
            {/* The two halves (§ user): WORK (apps first, then the Amex day job)
                and PLAY (everything that recharges it) — each headed by a big
                playful divider that says what's inside. */}
            <Separator word="Work" sub="Amex by day · apps by night" gradient="linear-gradient(100deg,var(--cyan),var(--violet) 55%,var(--magenta))" />
            <Apps />
            <Career />
            <Separator word="Play" sub="muscle · music · monsters" gradient="linear-gradient(100deg,var(--gold),var(--coral),var(--magenta))" />
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
