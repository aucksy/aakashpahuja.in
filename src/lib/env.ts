// Environment / capability probes (§21 adaptive quality, §22 fallbacks).

export type Quality = 'high' | 'medium' | 'low';

export function detectWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function prefersLight(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches;
}

export function isTouch(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
}

/** Coarse quality tier from device hints. A real detect-gpu pass is on
 *  ASSETS_TODO; this heuristic keeps the first frame safe without a probe. */
export function guessQuality(): Quality {
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = isTouch();
  if (mem <= 3 || cores <= 3) return 'low';
  if (coarse || mem <= 6) return 'medium';
  return 'high';
}

/** Max device-pixel-ratio per tier — DPR capped at 2 on desktop (§14, §21). */
export function dprCap(q: Quality): number {
  return q === 'low' ? 1 : q === 'medium' ? 1.5 : 2;
}
