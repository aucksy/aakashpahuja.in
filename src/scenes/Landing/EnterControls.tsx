import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperience } from '@/store/useExperience';
import { audio } from '@/audio/AudioEngine';
import { loadSignal, GATHER_SECONDS } from './loadSignal';
import { startPreload, worldVideoUrl } from '@/lib/videoPreload';
import { useIsMobile } from '@/lib/useIsMobile';
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

// Shell-less landing icons: soft off-white on the DARK world; a muted grey on the
// bright LIGHT world (§ user — off-white was too hot in the eye on the beach).
const OFFWHITE = '#c4ccdb';
const ICON_GREY = '#6b6470';

// Mobile-only glyphs — off-white solid (currentColor).
function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
      {on ? (
        <>
          <path d="M16.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19.5 5.5a9 9 0 0 1 0 13" />
        </>
      ) : (
        <path d="M16 9l5 6M21 9l-5 6" />
      )}
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  );
}

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
  const isMobile = useIsMobile();
  // Mobile: the volume dial is tucked behind the sound button and slides up on tap.
  const [sliderOpen, setSliderOpen] = useState(false);
  const soundOn = !muted && volume > 0.02;

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
    // The loader preloads the cinematic world video; the burst waits for it.
    startPreload(worldVideoUrl(useExperience.getState().theme));
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

  const segBtn = (active: boolean, icon = false): CSSProperties => ({
    ...mono,
    padding: icon ? 0 : '7px 15px',
    width: icon ? 38 : undefined,
    height: icon ? 38 : undefined,
    display: icon ? 'grid' : undefined,
    placeItems: icon ? 'center' : undefined,
    border: 0,
    borderRadius: 999,
    cursor: 'pointer',
    pointerEvents: 'auto',
    transition: 'background .3s, color .3s, opacity .3s',
    // Icon toggle (mobile): shell-less off-white glyphs — active is full opacity,
    // inactive dims. Text toggle (desktop): white active pill.
    background: icon ? 'transparent' : active ? 'rgba(255,255,255,0.92)' : 'transparent',
    // Icon toggle: dark world → off-white (active bright, inactive dim). Light
    // world → the SELECTED icon goes dark so it reads as selected; the other stays grey.
    color: icon ? (light ? (active ? '#241a30' : ICON_GREY) : OFFWHITE) : active ? '#06070d' : 'var(--muted)',
    opacity: icon ? (active ? 1 : light ? 0.6 : 0.38) : 1,
  });

  // The hero + chapters live in the Journey now; the overture HUD only owns the
  // Enter + loading moments, then clears its centre for the world.
  const centerKey = phase === 'overture' ? 'enter' : phase === 'loading' ? 'loading' : 'none';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
      {/* Identity kicker — hidden on phones, where it would collide with the
          mute pill; the Hero re-states the name + title in-content just below. */}
      <div style={{ position: 'absolute', top: 'clamp(18px,3vw,30px)', left: 'clamp(18px,3vw,30px)', ...mono, color: sceneMuted, transition: ease, display: isMobile ? 'none' : 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: sceneAccent, boxShadow: `0 0 12px ${sceneAccent}`, transition: ease }} />
        Aakash Pahuja · Digital Product Manager / Designer
      </div>

      {/* Persistent mute — desktop only (top-right). On mobile the bottom-left
          sound button owns sound (it reveals the volume dial). */}
      <AnimatePresence>
        {!isMobile && audioStarted && (
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
                    fontSize: isMobile ? 'clamp(14px,3.6vw,16px)' : 'clamp(15px,2vw,19px)',
                    letterSpacing: '0.01em',
                    color: sceneInk,
                    background: light ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${light ? 'rgba(42,34,51,0.28)' : 'rgba(255,255,255,0.22)'}`,
                    padding: isMobile ? '12px 22px' : '16px 32px',
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

      {/* Sound / volume. Desktop: the dial sits open at bottom-left. Mobile: a
          persistent "sound" button (from the overture on) reveals the SAME dial
          on tap — it drives the waveform + audio exactly as before. */}
      {isMobile ? (
        <div style={{ position: 'absolute', left: 'clamp(16px,3vw,28px)', bottom: 'clamp(16px,3vw,28px)', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start', pointerEvents: 'auto' }}>
          <AnimatePresence>
            {sliderOpen && (
              <motion.div
                key="dial"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.34, ease: [0.2, 0.7, 0.2, 1] as const }}
                style={{ display: 'flex', flexDirection: 'column', gap: 8, ...glassPanel, borderRadius: 18, padding: '12px 16px' }}
              >
                <span style={{ ...mono, fontSize: 9.5, color: 'var(--muted)' }}>Volume · intensity</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(volume * 100)}
                  aria-label="Volume and intensity"
                  onChange={(e) => onVolume(Number(e.target.value) / 100)}
                  style={{ width: 160, '--accent': 'var(--cyan)' } as CSSProperties}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setSliderOpen((v) => !v)}
            aria-label={soundOn ? 'Sound on — tap to adjust volume' : 'Muted — tap to adjust volume'}
            aria-expanded={sliderOpen}
            style={{ background: 'transparent', border: 0, display: 'grid', placeItems: 'center', width: 44, height: 44, padding: 0, color: light ? ICON_GREY : OFFWHITE, cursor: 'pointer', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7))' }}
          >
            <SoundIcon on={soundOn} />
          </button>
        </div>
      ) : (
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
      )}

      {/* Dark / Light world toggle — desktop: horizontal text segments with a
          label. Mobile: horizontal, compact, icon-only (moon / sun), no label. */}
      <div style={{ position: 'absolute', right: 'clamp(18px,3vw,30px)', bottom: 'clamp(18px,3vw,28px)', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', pointerEvents: 'auto' }}>
        {!isMobile && <span style={{ ...mono, fontSize: 9.5, color: sceneFaint, transition: ease }}>World</span>}
        <div style={isMobile ? { display: 'flex', flexDirection: 'row', gap: 12, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7))' } : { display: 'flex', flexDirection: 'row', gap: 3, padding: 4, ...glassPanel }}>
          <button style={segBtn(theme === 'dark', isMobile)} onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'} aria-label="Dark world">
            {isMobile ? <MoonIcon /> : 'Dark'}
          </button>
          <button style={segBtn(theme === 'light', isMobile)} onClick={() => setTheme('light')} aria-pressed={theme === 'light'} aria-label="Light world">
            {isMobile ? <SunIcon /> : 'Light'}
          </button>
        </div>
      </div>
    </div>
  );
}
