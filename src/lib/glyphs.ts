// Canonical designer-object glyph renderer.
// Ported verbatim from the Experience Blueprint prototype (drawGlyph / drawWeighty /
// rr). These are declared *canonical* in the brief — the silhouettes, proportions and
// gradient/shadow maths are preserved exactly; only types + a `light` flag were added.
//
// The hidden-world props: dumbbell, guitar, controller, mug, sneaker, pizza, mic,
// laptop, plus headphones, note, code, coffee, phone (§19-A).

import { mixHex } from '@/lib/color';

export type GlyphType =
  | 'dumbbell'
  | 'controller'
  | 'headphones'
  | 'note'
  | 'code'
  | 'coffee'
  | 'pizza'
  | 'mic'
  | 'phone'
  | 'guitar'
  | 'sneaker'
  | 'laptop'
  | 'mug';

type Ctx = CanvasRenderingContext2D;

/** Rounded rectangle path (canonical `rr`). */
export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draw one designer object centred at the current transform origin.
 *  `col` may be any canvas fill/stroke style (colour string or gradient). */
export function drawGlyph(
  ctx: Ctx,
  type: GlyphType | string,
  s: number,
  col: string | CanvasGradient,
  lw?: number,
): void {
  const a = s;
  lw = lw || s * 0.1;
  ctx.save();
  ctx.fillStyle = col;
  ctx.strokeStyle = col;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const R = (x: number, y: number, w: number, h: number, r: number) => rr(ctx, x, y, w, h, r);

  if (type === 'dumbbell') {
    ctx.lineWidth = lw * 1.25;
    ctx.beginPath();
    ctx.moveTo(-a * 0.3, 0);
    ctx.lineTo(a * 0.3, 0);
    ctx.stroke();
    [-1, 1].forEach((g) => {
      R(g * a * 0.33 - a * 0.06, -a * 0.24, a * 0.12, a * 0.48, a * 0.04);
      ctx.fill();
      R(g * a * 0.47 - a * 0.045, -a * 0.16, a * 0.09, a * 0.32, a * 0.03);
      ctx.fill();
    });
  } else if (type === 'controller') {
    R(-a * 0.42, -a * 0.16, a * 0.84, a * 0.34, a * 0.16);
    ctx.fill();
    ctx.save();
    ctx.fillStyle = 'rgba(6,8,16,0.85)';
    R(-a * 0.31, -a * 0.02, a * 0.13, a * 0.045, a * 0.02);
    ctx.fill();
    R(-a * 0.265, -a * 0.065, a * 0.045, a * 0.135, a * 0.02);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(a * 0.2, -a * 0.03, a * 0.037, 0, 6.28);
    ctx.arc(a * 0.3, a * 0.04, a * 0.037, 0, 6.28);
    ctx.fill();
    ctx.restore();
  } else if (type === 'headphones') {
    ctx.lineWidth = lw * 1.15;
    ctx.beginPath();
    ctx.arc(0, a * 0.03, a * 0.36, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    [-1, 1].forEach((g) => {
      R(g * a * 0.4 - a * 0.06, -a * 0.01, a * 0.12, a * 0.3, a * 0.05);
      ctx.fill();
    });
  } else if (type === 'note') {
    ctx.beginPath();
    ctx.ellipse(-a * 0.16, a * 0.26, a * 0.15, a * 0.11, -0.4, 0, 6.28);
    ctx.fill();
    ctx.lineWidth = lw * 0.95;
    ctx.beginPath();
    ctx.moveTo(-a * 0.02, a * 0.24);
    ctx.lineTo(-a * 0.02, -a * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-a * 0.02, -a * 0.3);
    ctx.quadraticCurveTo(a * 0.22, -a * 0.24, a * 0.14, -a * 0.02);
    ctx.stroke();
  } else if (type === 'code') {
    ctx.lineWidth = lw * 1.1;
    ctx.beginPath();
    ctx.moveTo(-a * 0.12, -a * 0.24);
    ctx.lineTo(-a * 0.36, 0);
    ctx.lineTo(-a * 0.12, a * 0.24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(a * 0.12, -a * 0.24);
    ctx.lineTo(a * 0.36, 0);
    ctx.lineTo(a * 0.12, a * 0.24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(a * 0.06, -a * 0.3);
    ctx.lineTo(-a * 0.06, a * 0.3);
    ctx.stroke();
  } else if (type === 'coffee') {
    ctx.beginPath();
    ctx.moveTo(-a * 0.26, -a * 0.16);
    ctx.lineTo(a * 0.22, -a * 0.16);
    ctx.lineTo(a * 0.16, a * 0.28);
    ctx.lineTo(-a * 0.2, a * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = lw * 0.9;
    ctx.beginPath();
    ctx.arc(a * 0.28, -a * 0.02, a * 0.1, -1.2, 1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-a * 0.1, -a * 0.28);
    ctx.quadraticCurveTo(a * 0.02, -a * 0.34, -a * 0.04, -a * 0.44);
    ctx.moveTo(a * 0.08, -a * 0.28);
    ctx.quadraticCurveTo(a * 0.16, -a * 0.34, a * 0.1, -a * 0.44);
    ctx.stroke();
  } else if (type === 'pizza') {
    ctx.beginPath();
    ctx.moveTo(0, -a * 0.38);
    ctx.lineTo(a * 0.28, a * 0.28);
    ctx.lineTo(-a * 0.28, a * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.fillStyle = 'rgba(6,8,16,0.8)';
    ctx.beginPath();
    ctx.arc(-a * 0.05, a * 0.03, a * 0.04, 0, 6.28);
    ctx.arc(a * 0.06, a * 0.16, a * 0.04, 0, 6.28);
    ctx.arc(-a * 0.1, a * 0.18, a * 0.03, 0, 6.28);
    ctx.fill();
    ctx.restore();
  } else if (type === 'mic') {
    R(-a * 0.12, -a * 0.36, a * 0.24, a * 0.42, a * 0.12);
    ctx.fill();
    ctx.lineWidth = lw * 0.9;
    ctx.beginPath();
    ctx.arc(0, -a * 0.06, a * 0.22, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, a * 0.16);
    ctx.lineTo(0, a * 0.32);
    ctx.moveTo(-a * 0.14, a * 0.32);
    ctx.lineTo(a * 0.14, a * 0.32);
    ctx.stroke();
  } else if (type === 'phone') {
    R(-a * 0.2, -a * 0.38, a * 0.4, a * 0.76, a * 0.09);
    ctx.fill();
    ctx.save();
    ctx.fillStyle = 'rgba(6,8,16,0.85)';
    R(-a * 0.15, -a * 0.3, a * 0.3, a * 0.54, a * 0.03);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(0, a * 0.3, a * 0.03, 0, 6.28);
    ctx.fill();
  } else if (type === 'guitar') {
    ctx.beginPath();
    ctx.arc(-a * 0.14, a * 0.18, a * 0.22, 0, 6.28);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-a * 0.02, a * 0.02, a * 0.15, 0, 6.28);
    ctx.fill();
    ctx.lineWidth = lw * 1.15;
    ctx.beginPath();
    ctx.moveTo(a * 0.02, 0);
    ctx.lineTo(a * 0.32, -a * 0.3);
    ctx.stroke();
    R(a * 0.3, -a * 0.42, a * 0.1, a * 0.14, a * 0.03);
    ctx.fill();
    ctx.save();
    ctx.fillStyle = 'rgba(6,8,16,0.8)';
    ctx.beginPath();
    ctx.arc(-a * 0.1, a * 0.16, a * 0.06, 0, 6.28);
    ctx.fill();
    ctx.restore();
  } else if (type === 'sneaker') {
    ctx.beginPath();
    ctx.moveTo(-a * 0.4, a * 0.2);
    ctx.lineTo(-a * 0.4, a * 0.04);
    ctx.quadraticCurveTo(-a * 0.38, -a * 0.1, -a * 0.18, -a * 0.12);
    ctx.lineTo(-a * 0.02, -a * 0.14);
    ctx.quadraticCurveTo(a * 0.12, -a * 0.16, a * 0.24, -a * 0.02);
    ctx.quadraticCurveTo(a * 0.42, a * 0.02, a * 0.44, a * 0.14);
    ctx.lineTo(a * 0.44, a * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.fillStyle = 'rgba(6,8,16,0.28)';
    R(-a * 0.42, a * 0.18, a * 0.88, a * 0.09, a * 0.03);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(6,8,16,0.5)';
    ctx.lineWidth = lw * 0.85;
    ctx.beginPath();
    ctx.moveTo(-a * 0.14, -a * 0.11);
    ctx.lineTo(-a * 0.05, a * 0.1);
    ctx.moveTo(-a * 0.02, -a * 0.14);
    ctx.lineTo(a * 0.07, a * 0.09);
    ctx.moveTo(a * 0.1, -a * 0.13);
    ctx.lineTo(a * 0.17, a * 0.06);
    ctx.stroke();
    ctx.restore();
  } else if (type === 'laptop') {
    ctx.save();
    ctx.translate(0, -a * 0.02);
    R(-a * 0.3, -a * 0.3, a * 0.6, a * 0.4, a * 0.05);
    ctx.fill();
    ctx.save();
    ctx.fillStyle = 'rgba(6,8,16,0.8)';
    R(-a * 0.25, -a * 0.25, a * 0.5, a * 0.3, a * 0.03);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-a * 0.4, a * 0.2);
    ctx.lineTo(a * 0.4, a * 0.2);
    ctx.lineTo(a * 0.32, a * 0.11);
    ctx.lineTo(-a * 0.32, a * 0.11);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (type === 'mug') {
    R(-a * 0.26, -a * 0.24, a * 0.42, a * 0.5, a * 0.06);
    ctx.fill();
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = lw * 1.15;
    ctx.beginPath();
    ctx.arc(a * 0.24, 0, a * 0.13, -1.25, 1.25);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(6,8,16,0.4)';
    ctx.lineWidth = lw * 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-a * 0.1, -a * 0.36);
    ctx.quadraticCurveTo(a * 0.02, -a * 0.42, -a * 0.04, -a * 0.5);
    ctx.moveTo(a * 0.04, -a * 0.36);
    ctx.quadraticCurveTo(a * 0.14, -a * 0.42, a * 0.08, -a * 0.5);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, a * 0.3, 0, 6.28);
    ctx.fill();
  }
  ctx.restore();
}

/** Draw an object with weight: soft contact shadow, a lit body gradient, and an
 *  optional colour "ignite" driven by `colorMix` (0 = monochrome, 1 = full accent).
 *  Ported from canonical `drawWeighty`; `light` replaces the old `theme` string. */
export function drawWeighty(
  ctx: Ctx,
  type: GlyphType | string,
  cx: number,
  cy: number,
  size: number,
  rot: number,
  baseCol: string,
  accentCol: string,
  colorMix: number,
  light: boolean,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  // Contact shadow — a radial-gradient ellipse (soft edge WITHOUT ctx.filter,
  // which is a per-frame Canvas2D gaussian and the main ripple FPS killer).
  ctx.save();
  const shCol = light ? '122,103,83' : '0,0,0';
  const shA = light ? 0.18 : 0.34;
  const shR = size * 0.6;
  const sg = ctx.createRadialGradient(0, size * 0.52, 0, 0, size * 0.52, shR);
  sg.addColorStop(0, `rgba(${shCol},${shA})`);
  sg.addColorStop(0.55, `rgba(${shCol},${shA * 0.55})`);
  sg.addColorStop(1, `rgba(${shCol},0)`);
  ctx.fillStyle = sg;
  ctx.translate(0, size * 0.52);
  ctx.scale(1, 0.32); // squash the circle into a ground ellipse
  ctx.beginPath();
  ctx.arc(0, 0, shR, 0, 6.28);
  ctx.fill();
  ctx.restore();

  // Body gradient — monochrome, or ignited to the accent hue
  const g = ctx.createLinearGradient(0, -size * 0.6, 0, size * 0.6);
  if (colorMix > 0.01) {
    const c = accentCol;
    g.addColorStop(0, mixHex('#ffffff', c, 0.38));
    g.addColorStop(0.55, c);
    g.addColorStop(1, mixHex(c, '#000000', 0.34));
  } else {
    g.addColorStop(0, mixHex('#ffffff', baseCol, 0.3));
    g.addColorStop(0.6, baseCol);
    g.addColorStop(1, mixHex(baseCol, '#000000', 0.24));
  }
  ctx.shadowColor = colorMix > 0.4 ? accentCol : 'rgba(0,0,0,0)';
  ctx.shadowBlur = colorMix * size * 0.55;
  drawGlyph(ctx, type, size, g, size * 0.12);
  ctx.restore();
}
