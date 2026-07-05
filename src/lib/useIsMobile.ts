import { useEffect, useState } from 'react';

/** True while the viewport is at or below `maxWidth` (default 760px — phones and
 *  small tablets in portrait). Drives the journey's mobile layout branches so the
 *  desktop styling above the breakpoint stays byte-for-byte unchanged. Client-only
 *  (this is a Vite SPA); correct on first paint via lazy init, and it never runs
 *  during the sacred overture — the journey mounts only in the world. */
export function useIsMobile(maxWidth = 760): boolean {
  const query = `(max-width: ${maxWidth}px)`;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return isMobile;
}
