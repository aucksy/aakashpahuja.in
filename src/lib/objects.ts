// The hidden-world designer objects that drift beneath the glass, plus their
// soft-physics step (§16.2, §17). Object set + motion constants are ported from
// the canonical `mountRipple` prototype. Positions are in a 0..1, top-left,
// y-down space shared with the ripple shader and the pointer.

import type { GlyphType } from '@/lib/glyphs';

interface ObjDef {
  type: GlyphType;
  hx: number; // home x, 0..1
  hy: number; // home y, 0..1
  scl: number; // relative scale
  neon: string; // Neon Nightfall accent (ignite colour, dark world)
  candy: string; // Golden Daybreak accent (ignite colour, light world)
}

// [type, hx, hy, scale, neon, candy]
const DEFS: ObjDef[] = [
  { type: 'dumbbell', hx: 0.16, hy: 0.3, scl: 1.15, neon: '#5de5e0', candy: '#ff7a9c' },
  { type: 'guitar', hx: 0.74, hy: 0.26, scl: 1.4, neon: '#8b7bf7', candy: '#ffb14e' },
  { type: 'controller', hx: 0.45, hy: 0.17, scl: 1.1, neon: '#5b8cff', candy: '#5bd6b0' },
  { type: 'mug', hx: 0.14, hy: 0.66, scl: 0.95, neon: '#ff8a5b', candy: '#ff9e6b' },
  { type: 'sneaker', hx: 0.3, hy: 0.72, scl: 1.05, neon: '#37d29b', candy: '#7c9bff' },
  { type: 'pizza', hx: 0.55, hy: 0.83, scl: 1.0, neon: '#e8c07d', candy: '#ffcf5a' },
  { type: 'mic', hx: 0.83, hy: 0.62, scl: 0.95, neon: '#8b7bf7', candy: '#c07aff' },
  { type: 'laptop', hx: 0.68, hy: 0.5, scl: 1.15, neon: '#5de5e0', candy: '#5bd6b0' },
  { type: 'controller', hx: 0.9, hy: 0.4, scl: 0.8, neon: '#ff5db1', candy: '#ff7a9c' },
  { type: 'dumbbell', hx: 0.5, hy: 0.34, scl: 0.78, neon: '#8b7bf7', candy: '#ffb14e' },
  { type: 'pizza', hx: 0.24, hy: 0.46, scl: 0.72, neon: '#e8c07d', candy: '#ffcf5a' },
  { type: 'guitar', hx: 0.9, hy: 0.83, scl: 0.8, neon: '#37d29b', candy: '#7c9bff' },
];

export interface HiddenObject extends ObjDef {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ph: number; // idle-float phase
  ff: number; // idle-float frequency
  rot: number;
  spin: number;
}

export function createHiddenObjects(): HiddenObject[] {
  return DEFS.map((o) => ({
    ...o,
    x: o.hx,
    y: o.hy,
    vx: 0,
    vy: 0,
    ph: Math.random() * 6.28,
    ff: 0.4 + Math.random() * 0.5,
    rot: (Math.random() - 0.5) * 0.5,
    spin: (Math.random() - 0.5) * 0.3,
  }));
}

/**
 * One physics tick. Each object idles on a slow per-object float toward home;
 * a pointer within radius applies inverse-square repulsion; a spring (damping
 * 0.86) pulls it back with overshoot. Never teleports (§16.2).
 *
 * @param ptr    pointer in 0..1 top-left space
 * @param ptrOn  pointer influence 0..1 (decays when the cursor leaves)
 * @param reduced  prefers-reduced-motion → freeze float + ignore repulsion (§22)
 */
export function stepObjects(
  objects: HiddenObject[],
  dt: number,
  time: number,
  ptr: [number, number],
  ptrOn: number,
  reduced: boolean,
): void {
  const [px, py] = ptr;
  for (const o of objects) {
    const tx = reduced ? o.hx : o.hx + Math.sin(time * o.ff + o.ph) * 0.012;
    const ty = reduced ? o.hy : o.hy + Math.cos(time * o.ff * 0.9 + o.ph) * 0.012;
    let ax = (tx - o.x) * 6.0;
    let ay = (ty - o.y) * 6.0;

    if (!reduced && ptrOn > 0.15) {
      const dx = o.x - px;
      const dy = o.y - py;
      const d = Math.hypot(dx, dy) + 1e-4;
      const R = 0.17;
      if (d < R) {
        const f = (1 - d / R) * ptrOn * 3.4;
        ax += (dx / d) * f;
        ay += (dy / d) * f;
      }
    }

    o.vx = (o.vx + ax * dt) * 0.86;
    o.vy = (o.vy + ay * dt) * 0.86;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.rot += o.spin * dt;
  }
}
