import { AnimatePresence, motion } from 'framer-motion';
import { useExperience } from '@/store/useExperience';
import { CHAPTERS } from './chapters';

/** The left chapter-spine rail + a top progress bar — a chapter map that doubles
 *  as travel feedback (§13). Fades in once the visitor is in the world.
 */
export default function ChapterRail() {
  const phase = useExperience((s) => s.phase);
  const active = useExperience((s) => s.activeChapter);
  const scroll = useExperience((s) => s.scroll);
  const show = phase === 'world';

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* top progress spine */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 40, background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }}
          >
            <div
              style={{
                height: '100%',
                width: `${scroll * 100}%`,
                background: 'linear-gradient(90deg,var(--cyan),var(--violet),var(--magenta))',
                boxShadow: '0 0 14px rgba(93,229,224,0.6)',
              }}
            />
          </motion.div>

          {/* left rail */}
          <motion.nav
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ delay: 0.3 }}
            aria-label="Chapters"
            className="chapter-rail"
            style={{ position: 'fixed', left: 22, top: '50%', transform: 'translateY(-50%)', zIndex: 40, display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            {CHAPTERS.map((c) => {
              const on = active === c.id;
              return (
                <a
                  key={c.id}
                  href={`#${c.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', padding: '3px 0' }}
                >
                  <i
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      flex: 'none',
                      transition: '.3s',
                      background: on ? c.accent : 'rgba(255,255,255,0.2)',
                      boxShadow: on ? `0 0 10px ${c.accent}` : 'none',
                      transform: on ? 'scale(1.6)' : 'scale(1)',
                    }}
                  />
                  <b style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.1em', color: on ? 'var(--ink)' : 'var(--dim)', minWidth: 16, transition: '.3s' }}>{c.n}</b>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--ink)', opacity: on ? 1 : 0, transition: '.3s', whiteSpace: 'nowrap' }}>{c.label}</span>
                </a>
              );
            })}
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
