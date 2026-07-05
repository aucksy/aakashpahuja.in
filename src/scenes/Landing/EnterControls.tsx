import { useEffect, useRef, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperience } from '@/store/useExperience';
import { audio } from '@/audio/AudioEngine';
import { loadSignal, GATHER_SECONDS } from './loadSignal';
import WaveRing from './WaveRing';

const mono: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
};

const glassPanel: CSSProperties = {
  background: 'rgba(10,12,22,0.5)',
  border: '1px solid var(--glass-border)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  borderRadius: 999,
  pointerEvents: 'auto',
};

/** The 0→100 loader. Reads loadSignal in its own rAF and writes textContent
 *  directly — no per-frame React re-render. The burst IS the loader (§21). */
function LoadingCounter({ ink, accent }: { ink: string; accent: string }) {
  const numRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (numRef.current) {
        numRef.current.textContent = String(Math.round(loadSignal.progress * 100)).padStart(2, '0');
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
      <div
        ref={numRef}
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 'clamp(52px,11vw,108px)',
          lineHeight: 1,
          letterSpacing: '-0.03em',
          color: ink,
          transition: 'color .8s',
          textShadow: '0 4px 34px rgba(93,229,224,0.35)',
        }}
      >
        00
      </div>
      <div style={{ ...mono, color: accent, transition: 'color .8s', marginTop: 4 }}>Entering the world</div>
    </div>
  );
}

export default function EnterControls() {
  const theme = useExperience((s) => s.theme);
  const volume = useExperience((s) => s.volume);
  const phase = useExperience((s) => s.phase);
  const audioStarted = useExperience((s) => s.audioStarted);
  const muted = useExperience((s) => s.muted);
  const firstVisit = useExperience((s) => s.firstVisit);
  const setVolume = useExperience((s) => s.setVolume);
  const setTheme = useExperience((s) => s.setTheme);
  const enter = useExperience((s) => s.enter);
  const setAudioStarted = useExperience((s) => s.setAudioStarted);
  const toggleMute = useExperience((s) => s.toggleMute);

  useEffect(() => {
    if (audioStarted) audio.setVolume(volume, muted);
  }, [volume, muted, audioStarted]);

  const withMusic = volume > 0.02;

  // In Golden Daybreak the scene is bright, so on-scene text must go dark. Chips
  // (mute/toggle) keep their dark-glass background, so their text stays light.
  const light = theme === 'light';
  const sceneInk = light ? '#2a2233' : '#eaf2ff';
  const sceneMuted = light ? 'rgba(42,34,51,0.74)' : 'var(--muted)';
  const sceneFaint = light ? 'rgba(42,34,51,0.62)' : 'rgba(255,255,255,0.62)';
  const sceneAccent = light ? '#c1547a' : 'var(--cyan)';
  const ease = 'color .8s, background .8s, border-color .8s';

  const onEnter = async () => {
    enter();
    if (withMusic) {
      setAudioStarted(true);
      // Playback is SCHEDULED to begin only after the icons have finished
      // rearranging — so the track's beats 1·2·3 land on a still, ready
      // formation and the count-in pops are unmistakable.
      await audio.start(useExperience.getState().volume, {
        notBeforeMs: performance.now() + GATHER_SECONDS * 1000,
      });
    }
  };

  const onVolume = (v: number) => {
    setVolume(v);
    // "Turn the dial up any time → the PLAY invite ignites the music" (§03).
    if (phase !== 'overture' && !audioStarted && v > 0.05) {
      setAudioStarted(true);
      void audio.start(v);
    }
  };

  const segBtn = (active: boolean): CSSProperties => ({
    ...mono,
    padding: '7px 15px',
    border: 0,
    borderRadius: 999,
    cursor: 'pointer',
    transition: 'background .3s, color .3s',
    background: active ? 'rgba(255,255,255,0.92)' : 'transparent',
    color: active ? '#06070d' : 'var(--muted)',
  });

  // The hero + chapters live in the Journey now; the overture HUD only owns the
  // Enter + loading moments, then clears its centre for the world.
  const centerKey = phase === 'overture' ? 'enter' : phase === 'loading' ? 'loading' : 'none';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
      {/* Identity kicker */}
      <div style={{ position: 'absolute', top: 'clamp(18px,3vw,30px)', left: 'clamp(18px,3vw,30px)', ...mono, color: sceneMuted, transition: ease, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: sceneAccent, boxShadow: `0 0 12px ${sceneAccent}`, transition: ease }} />
        Aakash Pahuja · Sr. Associate Product Manager
      </div>

      {/* Persistent mute */}
      <AnimatePresence>
        {audioStarted && (
          <motion.button
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={toggleMute}
            aria-label={muted ? 'Unmute music' : 'Mute music'}
            style={{ position: 'absolute', top: 'clamp(16px,3vw,28px)', right: 'clamp(16px,3vw,28px)', ...glassPanel, ...mono, color: 'var(--ink)', padding: '9px 16px', cursor: 'pointer' }}
          >
            {muted ? '♪ muted' : '♪ sound on'}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Center stage */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <AnimatePresence mode="wait">
          {centerKey === 'enter' && (
            <motion.div
              key="enter"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(6px)' }}
              transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] as const }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'min(66vw,320px)', height: 'min(66vw,320px)' }}>
                <WaveRing size={320} />
                <motion.button
                  onClick={onEnter}
                  whileHover={{ scale: 1.045, boxShadow: '0 18px 60px -12px rgba(93,229,224,0.45), inset 0 1px 0 rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                  style={{
                    position: 'relative',
                    pointerEvents: 'auto',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 'clamp(15px,2vw,19px)',
                    letterSpacing: '0.01em',
                    color: sceneInk,
                    background: light ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${light ? 'rgba(42,34,51,0.28)' : 'rgba(255,255,255,0.22)'}`,
                    padding: '16px 32px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    transition: ease,
                    boxShadow: light
                      ? '0 12px 40px -14px rgba(90,70,60,0.5), inset 0 1px 0 rgba(255,255,255,0.5)'
                      : '0 12px 40px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                >
                  {withMusic ? 'Enter with music' : 'Enter quietly'}
                </motion.button>
              </div>
              <div style={{ ...mono, color: sceneFaint, transition: ease, textShadow: light ? 'none' : '0 2px 12px #000', textAlign: 'center' }}>
                Wipe the glass to reveal · press Enter to begin
              </div>
              {firstVisit && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} style={{ ...mono, fontSize: 10, color: sceneAccent, transition: ease, letterSpacing: '0.16em' }}>
                  ♪ sound is part of this experience
                </motion.div>
              )}
            </motion.div>
          )}

          {centerKey === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.15, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] as const }}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'min(76vw,380px)', height: 'min(76vw,380px)' }}
            >
              <WaveRing size={380} />
              <LoadingCounter ink={sceneInk} accent={sceneAccent} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Volume / intensity dial */}
      <div style={{ position: 'absolute', left: 'clamp(18px,3vw,30px)', bottom: 'clamp(18px,3vw,28px)', display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'auto' }}>
        <span style={{ ...mono, fontSize: 9.5, color: sceneFaint, transition: ease }}>Volume · intensity</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          aria-label="Volume and intensity"
          onChange={(e) => onVolume(Number(e.target.value) / 100)}
          style={{ width: 150, '--accent': 'var(--cyan)' } as CSSProperties}
        />
      </div>

      {/* Dark / Light world toggle */}
      <div style={{ position: 'absolute', right: 'clamp(18px,3vw,30px)', bottom: 'clamp(18px,3vw,28px)', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', pointerEvents: 'auto' }}>
        <span style={{ ...mono, fontSize: 9.5, color: sceneFaint, transition: ease }}>World</span>
        <div style={{ display: 'flex', gap: 3, padding: 4, ...glassPanel }}>
          <button style={segBtn(theme === 'dark')} onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'}>
            Dark
          </button>
          <button style={segBtn(theme === 'light')} onClick={() => setTheme('light')} aria-pressed={theme === 'light'}>
            Light
          </button>
        </div>
      </div>
    </div>
  );
}
