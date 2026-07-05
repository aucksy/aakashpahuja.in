import { useEffect, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '@/store/useExperience';

/**
 * Lenis inertial smooth-scroll normalised into the single master playhead
 * (§13). Scroll is LOCKED through the overture/burst and only released once the
 * visitor is in the `world` — from there, scroll = distance travelled.
 * GSAP ScrollTrigger is synced to the same Lenis clock so type + world share it.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const setScroll = useExperience((s) => s.setScroll);
  const phase = useExperience((s) => s.phase);
  const reduced = useExperience((s) => s.reducedMotion);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('locked'); // overture starts locked

    const lenis = new Lenis({
      lerp: reduced ? 1 : 0.09,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      smoothWheel: !reduced,
      anchors: { offset: 0, onComplete: () => {} },
    });
    lenisRef.current = lenis;
    lenis.stop();

    lenis.on('scroll', (e: { progress: number }) => {
      setScroll(e.progress || 0);
      ScrollTrigger.update();
    });

    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [setScroll, reduced]);

  // Release the journey once the burst has resolved into the world.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (phase === 'world') {
      document.documentElement.classList.remove('locked');
      lenis.start();
    } else {
      document.documentElement.classList.add('locked');
      lenis.scrollTo(0, { immediate: true });
      lenis.stop();
    }
    ScrollTrigger.refresh();
  }, [phase]);

  return <>{children}</>;
}
