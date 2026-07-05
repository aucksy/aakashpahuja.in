// Small colour helpers shared by the palettes and the canvas glyph renderer.
// Kept dependency-free and allocation-light for per-frame use.

export type RGB = [number, number, number];

export function parseHex(hex: string): RGB {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function rgbToCss([r, g, b]: RGB): string {
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

const hx = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
export function rgbToHex([r, g, b]: RGB): string {
  return `#${hx(r)}${hx(g)}${hx(b)}`;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** Mix two hex colours in RGB space, returning a hex string. Ported from the
 *  canonical `mixHex` in the Experience Blueprint prototype. */
export function mixHex(a: string, b: string, t: number): string {
  return rgbToHex(lerpRgb(parseHex(a), parseHex(b), t));
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Smoothstep easing used across the physics + ripple choreography. */
export function ease(t: number): number {
  t = clamp01(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
