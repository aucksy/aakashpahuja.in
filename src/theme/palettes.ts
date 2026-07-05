// The two worlds are two COMPLETE design systems, not an inversion (§06).
//   DARK  — "Neon Nightfall"  : elegant, futuristic, cinematic, moody night.
//   LIGHT — "Golden Daybreak"  : joy, optimism, warmth — a sunlit coast at golden hour.
// Values are ported from the canonical `PAL` in the Experience Blueprint and
// pre-parsed to numeric RGB so the theme cross-grade can lerp cheaply per frame.

import { parseHex, lerpRgb, lerp, type RGB } from '@/lib/color';

export interface GlowBlob {
  x: number; // 0..1 across the scene
  y: number; // 0..1 down the scene
  rgb: RGB;
  a: number; // core alpha
}

export interface Palette {
  name: string;
  bg: [RGB, RGB, RGB]; // vertical gradient stops (top → mid → bottom)
  glow: GlowBlob[]; // light sources that bleed through the glass (§10)
  base: RGB; // monochrome object body colour
  frost: [number, number, number]; // glass tint, 0..1 — the shader's u_frost
  accent: RGB; // laser accent (waveform ring, live dots)
}

const rgb = (s: string): RGB => {
  const [r, g, b] = s.split(',').map(Number);
  return [r, g, b];
};

export const DARK: Palette = {
  name: 'Neon Nightfall',
  bg: [parseHex('#0a1226'), parseHex('#070a18'), parseHex('#05060f')],
  glow: [
    { x: 0.2, y: 0.3, rgb: rgb('110,90,240'), a: 0.5 },
    { x: 0.86, y: 0.22, rgb: rgb('40,150,190'), a: 0.42 },
    { x: 0.55, y: 0.86, rgb: rgb('220,70,170'), a: 0.3 },
  ],
  base: parseHex('#c7d2ee'),
  frost: [0.13, 0.15, 0.24],
  accent: rgb('93,229,224'),
};

export const LIGHT: Palette = {
  name: 'Golden Daybreak',
  bg: [parseHex('#fdeede'), parseHex('#f7dccb'), parseHex('#efe6ff')],
  glow: [
    { x: 0.2, y: 0.3, rgb: rgb('255,158,125'), a: 0.5 },
    { x: 0.84, y: 0.24, rgb: rgb('255,210,122'), a: 0.42 },
    { x: 0.55, y: 0.86, rgb: rgb('142,197,255'), a: 0.42 },
  ],
  base: parseHex('#5a5166'),
  frost: [0.95, 0.92, 0.87],
  accent: rgb('255,122,156'),
};

/** Blend the two worlds. t=0 → Neon Nightfall, t=1 → Golden Daybreak.
 *  Drives the ~1.2s golden-hour "sunrise/sunset" sweep on theme toggle (§06). */
export function lerpPalette(t: number): Palette {
  if (t <= 0) return DARK;
  if (t >= 1) return LIGHT;
  return {
    name: t < 0.5 ? DARK.name : LIGHT.name,
    bg: [
      lerpRgb(DARK.bg[0], LIGHT.bg[0], t),
      lerpRgb(DARK.bg[1], LIGHT.bg[1], t),
      lerpRgb(DARK.bg[2], LIGHT.bg[2], t),
    ],
    glow: DARK.glow.map((g, i) => ({
      x: lerp(g.x, LIGHT.glow[i].x, t),
      y: lerp(g.y, LIGHT.glow[i].y, t),
      rgb: lerpRgb(g.rgb, LIGHT.glow[i].rgb, t),
      a: lerp(g.a, LIGHT.glow[i].a, t),
    })),
    base: lerpRgb(DARK.base, LIGHT.base, t),
    frost: [
      lerp(DARK.frost[0], LIGHT.frost[0], t),
      lerp(DARK.frost[1], LIGHT.frost[1], t),
      lerp(DARK.frost[2], LIGHT.frost[2], t),
    ],
    accent: lerpRgb(DARK.accent, LIGHT.accent, t),
  };
}
