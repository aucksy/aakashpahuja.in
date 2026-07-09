import { useEffect, useRef, useState } from 'react';
import { useExperience } from '@/store/useExperience';
import { worldVideoUrl, preloadedSrc, requestPreload } from '@/lib/videoPreload';
import { useIsMobile } from '@/lib/useIsMobile';

/**
 * The living world behind the glass (§ user spec #2/#4):
 *   dark  — a cinematic drive down a curving neon road through a sci-fi city
 *   light — a sandy palm-lined pathway easing toward a sunrise beach
 * Sits BEHIND the WebGL glass canvas. A scrim (dim + blur) keeps typography
 * perfectly readable while the world glows through. Looping is crossfaded
 * between two stacked <video> elements so the wrap is invisible.
 */

const XFADE = 0.9; // seconds of crossfade at the loop point

function CrossfadeLoop({ src }: { src: string }) {
  const a = useRef<HTMLVideoElement>(null);
  const b = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(0);
  const switching = useRef(false);

  useEffect(() => {
    switching.current = false;
    setActive(0);
    const va = a.current;
    if (va) {
      va.currentTime = 0;
      void va.play().catch(() => {});
    }
  }, [src]);

  const onTime = (idx: number) => () => {
    const cur = idx === 0 ? a.current : b.current;
    const nxt = idx === 0 ? b.current : a.current;
    if (!cur || !nxt || active !== idx || switching.current) return;
    if (cur.duration && cur.duration - cur.currentTime < XFADE) {
      switching.current = true;
      nxt.currentTime = 0;
      void nxt.play().catch(() => {});
      setActive(idx === 0 ? 1 : 0);
      window.setTimeout(() => {
        cur.pause();
        switching.current = false;
      }, XFADE * 1000 + 80);
    }
  };

  const style = (on: boolean): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: on ? 1 : 0,
    transition: `opacity ${XFADE}s ease`,
  });

  return (
    <>
      <video ref={a} src={src} muted playsInline autoPlay preload="auto" onTimeUpdate={onTime(0)} style={style(active === 0)} />
      <video ref={b} src={src} muted playsInline preload="auto" onTimeUpdate={onTime(1)} style={style(active === 1)} />
    </>
  );
}

export default function WorldBackdrop() {
  const phase = useExperience((s) => s.phase);
  const theme = useExperience((s) => s.theme);
  const isMobile = useIsMobile();
  const show = phase === 'burst' || phase === 'world';

  // Theme toggled mid-journey → fetch the other world in the background.
  // Desktop during LOADING defers until the count-in lands (same reason as
  // EnterControls — keep the gather window clear); burst/world and phones
  // fetch immediately, exactly as before.
  useEffect(() => {
    if (phase !== 'overture') requestPreload(worldVideoUrl(theme), !isMobile && phase === 'loading');
  }, [phase, theme, isMobile]);

  if (!show) return null;
  const src = preloadedSrc(worldVideoUrl(theme));
  const light = theme === 'light';

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: light ? '#f2d7bf' : '#05060b' }}>
      <CrossfadeLoop key={src} src={src} />
      {/* the glass scrim — softens + dims so type stays comfortably readable (§ #6) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: light
            ? 'linear-gradient(rgba(255,247,238,0.34), rgba(255,247,238,0.14) 40%, rgba(255,247,238,0.55))'
            : 'linear-gradient(rgba(4,5,10,0.74), rgba(4,5,10,0.6) 40%, rgba(4,5,10,0.87))',
          backdropFilter: 'blur(5px) saturate(1.12)',
          WebkitBackdropFilter: 'blur(5px) saturate(1.12)',
          transition: 'background 1.2s ease',
        }}
      />
    </div>
  );
}
