// The "world beneath the glass" — an offscreen 2D canvas the ripple shader
// samples as its scene texture.
//
// Two behaviours:
//   • idle  — the hidden objects drift with soft physics (the overture).
//   • dance — on Enter, objects gather into an orbiting ring and DANCE to the
//             live FFT: bass drives the big objects, treble the small ones, a
//             bass onset pops them + throws sparks; monochrome → colour ignite.
//             A `burst` amount blows the ring open at the climax (§12 SC-02A,
//             §16.4). Ported from the canonical `mountBurst` prototype.

import { createHiddenObjects, stepObjects, type HiddenObject } from '@/lib/objects';
import { drawWeighty, drawGlyph } from '@/lib/glyphs';
import { lerpPalette, type Palette } from '@/theme/palettes';
import { rgbToCss, rgbToHex, mixHex } from '@/lib/color';

export interface Bands {
  bass: number;
  mid: number;
  treble: number;
  overall: number;
  beat: boolean;
}

export interface SceneState {
  ptr: [number, number];
  ptrOn: number;
  themeMix: number; // 0 = Neon Nightfall, 1 = Golden Daybreak
  reduced: boolean;
  mode: 'idle' | 'dance' | 'world';
  colorMix: number; // idle ignite (Enter preview)
  bands: Bands;
  burst: number; // 0..1 climax blow-out
  gathering: boolean; // rearranging into the ring, awaiting the first beat
  emphasis: boolean; // count-in (beats 1–3): every object pops + jumps, hard
  scroll: number; // 0..1 journey playhead — parallax travel through the city
}

interface DanceState {
  dx: number;
  dy: number;
  dvx: number;
  dvy: number;
  cf: number; // colour-fade 0→1
  pop: number;
  big: boolean;
  ang: number;
  ph: number;
  spin: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  col: string;
}

export class SceneBeneath {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  readonly objects: HiddenObject[] = createHiddenObjects();
  private dance: DanceState[];
  private sparks: Spark[] = [];
  private danceInit = false;
  /** 1 = hold dead-still (gather + count-in beats 1–3, so the beat jumps are the
   *  ONLY motion); eases to 0 from beat 4 as the continuous groove takes over. */
  private calm = 1;
  private sw = 2;
  private sh = 2;
  private cityImg: HTMLImageElement;
  private cityReady = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('SceneBeneath: 2D context unavailable');
    this.ctx = ctx;
    this.cityImg = new Image();
    this.cityImg.onload = () => {
      this.cityReady = true;
    };
    this.cityImg.src = '/assets/city.avif';
    this.dance = this.objects.map((o, i) => ({
      dx: 0,
      dy: 0,
      dvx: 0,
      dvy: 0,
      cf: 0,
      pop: 0,
      big: o.scl >= 1.0,
      ang: (i / this.objects.length) * Math.PI * 2 + (i % 2 ? 0.22 : -0.22),
      ph: o.ph,
      spin: o.spin,
    }));
    this.resize(1280, 720);
  }

  resize(viewW: number, viewH: number): void {
    this.sw = Math.min(860, Math.round(viewW * 1.15));
    this.sh = Math.max(2, Math.round((this.sw * viewH) / Math.max(1, viewW)));
    this.canvas.width = this.sw;
    this.canvas.height = this.sh;
  }

  step(dt: number, time: number, s: SceneState): void {
    const P = lerpPalette(s.themeMix);
    if (s.mode === 'world') {
      this.paintCity(P, s, time);
      return;
    }
    if (s.mode === 'idle') {
      this.danceInit = false;
      this.calm = 1;
      this.sparks.length = 0;
      stepObjects(this.objects, dt, time, s.ptr, s.ptrOn, s.reduced);
      this.paintBackground(P, 0);
      this.paintIdle(time, s.colorMix, s.themeMix);
    } else {
      // Hold dead-still through gather + count-in; groove eases in from beat 4.
      this.calm += ((s.gathering || s.emphasis ? 1 : 0) - this.calm) * 0.08;
      this.paintBackground(P, s.bands.overall * (1 - this.calm * 0.6));
      this.paintDance(time, s);
    }
  }

  // ---- painters ---------------------------------------------------------

  private paintBackground(P: Palette, energy: number): void {
    const { ctx, sw, sh } = this;
    const g = ctx.createLinearGradient(0, 0, 0, sh);
    g.addColorStop(0, rgbToCss(P.bg[0]));
    g.addColorStop(0.55, rgbToCss(P.bg[1]));
    g.addColorStop(1, rgbToCss(P.bg[2]));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, sw, sh);

    const r = Math.max(sw, sh) * 0.42;
    for (const bl of P.glow) {
      const x = bl.x * sw;
      const y = bl.y * sh;
      const [rr, gg, bb] = bl.rgb;
      const a = Math.min(1, bl.a * (1 + energy * 0.6));
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(${rr | 0},${gg | 0},${bb | 0},${a})`);
      rg.addColorStop(1, `rgba(${rr | 0},${gg | 0},${bb | 0},0)`);
      ctx.fillStyle = rg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  /** SC-03+ — the neon city behind the (now clear) glass, parallaxed by scroll
   *  (travel) and cursor. In the deep journey the ripple downgrades to a subtle
   *  cursor-lens refraction, so this is the persistent world backdrop (§23). */
  private paintCity(P: Palette, s: SceneState, time: number): void {
    const { ctx, sw, sh } = this;
    // neon sky wash (theme-graded) + light-source glows
    this.paintBackground(P, 0.15);

    if (this.cityReady) {
      const img = this.cityImg;
      const ar = img.width / img.height;
      const car = sw / sh;
      let dw: number;
      let dh: number;
      if (car > ar) {
        dw = sw * 1.08;
        dh = dw / ar;
      } else {
        dh = sh * 1.12;
        dw = dh * ar;
      }
      const px = (s.ptr[0] - 0.5) * -34; // cursor parallax
      const py = -s.scroll * sh * 0.4 + Math.sin(time * 0.25) * 4; // scroll travel + drift
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.drawImage(img, (sw - dw) / 2 + px, (sh - dh) * 0.42 + py, dw, dh);
      ctx.restore();
    }

    // theme haze + a road-glow floor so content sits in air above the road
    const warm = s.themeMix > 0.5;
    const g = ctx.createLinearGradient(0, 0, 0, sh);
    g.addColorStop(0, warm ? 'rgba(255,230,200,0.10)' : 'rgba(18,8,40,0.12)');
    g.addColorStop(0.55, warm ? 'rgba(255,225,195,0.04)' : 'rgba(10,8,26,0.06)');
    g.addColorStop(1, warm ? 'rgba(255,210,170,0.5)' : 'rgba(8,6,20,0.66)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, sw, sh);
  }

  private paintIdle(time: number, colorMix: number, themeMix: number): void {
    const { ctx, sw, sh } = this;
    const light = themeMix > 0.5;
    const baseHex = rgbToHex(lerpPalette(themeMix).base);
    const S = Math.min(sw, sh);
    for (const o of this.objects) {
      const size = S * 0.13 * o.scl;
      const accent = mixHex(o.neon, o.candy, themeMix);
      drawWeighty(
        ctx,
        o.type,
        o.x * sw,
        o.y * sh,
        size,
        o.rot + Math.sin(time * 0.5 + o.ph) * 0.05,
        baseHex,
        accent,
        colorMix,
        light,
      );
    }
  }

  private paintDance(time: number, s: SceneState): void {
    const { ctx, sw, sh } = this;
    const CX = sw / 2;
    const CY = sh / 2;
    const base = Math.min(sw, sh);
    const { bass, treble, overall, beat } = s.bands;
    const burst = s.burst;

    // Seed dance positions from the objects' current idle spots (continuity).
    if (!this.danceInit) {
      for (let i = 0; i < this.objects.length; i++) {
        const d = this.dance[i];
        d.dx = this.objects[i].x * sw;
        d.dy = this.objects[i].y * sh;
        d.dvx = 0;
        d.dvy = 0;
      }
      this.danceInit = true;
    }

    if (beat) this.onBeat(CX, CY, base, s.themeMix, s.emphasis);

    for (let i = 0; i < this.objects.length; i++) {
      const o = this.objects[i];
      const d = this.dance[i];
      const band = d.big ? bass : treble;
      d.cf += (1 - d.cf) * 0.08;

      // Orbiting ring target — burst blows the radius open and scatters.
      // `live` gates ALL continuous motion (ring breathing, bob, spin, FFT
      // scale) — 0 during gather/count-in so the beat jumps are the only move.
      const live = 1 - this.calm;
      const ringR = (d.big ? 0.26 : 0.36) * (1 + burst * 3.4);
      const rr = base * ringR * (0.9 + 0.1 * Math.sin(time * 0.5 + d.ph) * live);
      const tx = CX + Math.cos(d.ang) * rr * 1.12;
      const ty = CY + Math.sin(d.ang) * rr;
      // Fast, hard-damped spring while gathering: formation completes in ~0.55s
      // and the ringing dies, leaving a true dead-still hold before beat 1.
      const k = s.gathering ? 0.14 : 0.024 + burst * 0.03;
      const damp = s.gathering ? 0.8 : 0.86;
      d.dvx = (d.dvx + (tx - d.dx) * k) * damp;
      d.dvy = (d.dvy + (ty - d.dy) * k) * damp;
      d.dx += d.dvx;
      d.dy += d.dvy;
      if (s.gathering) {
        // Deadband: once home and slow, pin to stillness — the held breath.
        const err = Math.hypot(tx - d.dx, ty - d.dy);
        const spd = Math.hypot(d.dvx, d.dvy);
        if (err < base * 0.004 && spd < base * 0.002) {
          d.dvx *= 0.5;
          d.dvy *= 0.5;
          d.dx += (tx - d.dx) * 0.2;
          d.dy += (ty - d.dy) * 0.2;
        }
      }
      d.pop *= 0.9;
      o.rot += (d.spin * 0.02 + band * 0.03) * live;

      const bob = Math.sin(time * (d.big ? 2.2 : 3.4) + d.ph) * base * 0.012 * (0.5 + overall) * live;
      const size =
        base *
        (d.big ? 0.075 : 0.05) *
        (1 + band * 0.5 * (0.25 + 0.75 * live) + d.pop * 0.45 + burst * 1.6);
      const accent = mixHex(o.neon, o.candy, s.themeMix);

      ctx.save();
      ctx.translate(d.dx, d.dy + bob);
      ctx.rotate(o.rot * 0.15);
      // Squash & stretch on the pop — the jump reads as a real bounce.
      if (d.pop > 0.02) ctx.scale(1 - d.pop * 0.08, 1 + d.pop * 0.2);
      // Monochrome underlay, fading out as colour ignites
      ctx.globalAlpha = 1 - d.cf * 0.9;
      ctx.shadowColor = 'rgba(150,164,196,0.8)';
      ctx.shadowBlur = 6;
      drawGlyph(ctx, o.type, size, 'rgba(150,164,196,0.65)', size * 0.11);
      // Colour layer, glowing on the beat
      ctx.globalAlpha = d.cf;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 12 + band * 22 + d.pop * 18;
      drawGlyph(ctx, o.type, size, accent, size * 0.11);
      ctx.restore();
    }

    this.updateSparks(base);
  }

  private onBeat(CX: number, CY: number, base: number, themeMix: number, strong: boolean): void {
    // Count-in beats (1–3): EVERY object pops hard and hops upward so the first
    // beats of the track are unmistakably choreographed. After that, only the
    // big objects pop (bass) — the treble keeps the small ones alive.
    for (const d of this.dance) {
      if (strong) {
        d.pop = Math.min(2.0, d.pop + 1.5);
        d.dvy -= base * (0.02 + Math.random() * 0.008); // the jump — ~110px hop
      } else if (d.big) {
        d.pop = Math.min(1.6, d.pop + 0.95);
      }
    }
    const nSparks = strong ? 20 : 12;
    for (let i = 0; i < nSparks; i++) {
      const a = Math.random() * 6.28;
      const sp = (1.4 + Math.random() * 2.8) * base * 0.006;
      const o = this.objects[(Math.random() * this.objects.length) | 0];
      this.sparks.push({
        x: CX,
        y: CY,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        col: mixHex(o.neon, o.candy, themeMix),
      });
    }
  }

  private updateSparks(base: number): void {
    const { ctx } = this;
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += base * 0.0006;
      s.life -= 0.02;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = s.life;
      ctx.fillStyle = s.col;
      ctx.shadowColor = s.col;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(s.x, s.y, base * 0.006 * s.life + 1, 0, 6.28);
      ctx.fill();
      ctx.restore();
    }
  }
}
