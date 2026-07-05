import { motion } from 'framer-motion';
import SmoothScroll from './SmoothScroll';
import ChapterRail from './ChapterRail';
import Hero from './chapters/Hero';
import Apps from './chapters/Apps';
import Fitness from './chapters/Fitness';
import Guitar from './chapters/Guitar';
import Gaming from './chapters/Gaming';
import GitHub from './chapters/GitHub';
import Contact from './chapters/Contact';

/**
 * The travelling journey (§12–13). A centered content column (≤1080px) scrolls
 * over the fixed WebGL world; each chapter arrives as a set-piece. Hidden and
 * inert through the overture/burst, it fades in once the visitor is in the world.
 */
export default function Journey() {
  // Mounts only once the visitor is in the world, so it fades up on mount.
  return (
    <>
      <SmoothScroll>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <main id="content" style={{ maxWidth: 1080, margin: '0 auto', padding: '0 clamp(22px,5vw,54px)' }}>
            <Hero />
            <Apps />
            <Fitness />
            <Guitar />
            <Gaming />
            <GitHub />
            <Contact />
          </main>
        </motion.div>
      </SmoothScroll>
      <ChapterRail />
    </>
  );
}
