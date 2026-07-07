// Web Audio engine (§11). The music must never appear to loop and must never
// autoplay. We decode the track once into an AudioBuffer and loop a single
// BufferSource with sample-accurate loop points — NOT <audio loop> — and feed an
// AnalyserNode (fftSize 2048, smoothing 0.8) for live FFT reactivity.
//
// Node chain — ORDER MATTERS:
//   source → analyser → gain → destination
// The analyser sits BEFORE the gain so the FFT always sees the full-scale
// waveform, independent of the volume dial, the entry fade-in, or mute.
// (With the analyser after the gain, beat detection silently dies at low
// volume — the bass never crosses the onset threshold.)
//
// Beat grid — "read the music waveform" (§11 pre-processing, done at runtime):
// after decoding we scan the raw PCM once — short-window RMS energy → positive
// spectral flux → autocorrelation over 68–185 BPM — yielding {firstBeat, period}.
// Choreography then locks to *scheduled* beat times via getPlaybackTime(), which
// is sample-clock accurate, instead of waiting on smoothed live FFT onsets.
//
// NOTE (ASSETS_TODO): a mastered gapless loop (bar-aligned region, equal-power
// crossfade → .wav/.m4a) + an offline librosa beat-map remain the premium path;
// this runtime grid gives the same sync behaviour without the offline step.

const TRACK_URL = '/assets/music.mp3';

export interface Bands {
  bass: number; // 20–150 Hz  → large objects
  mid: number;
  treble: number; // 4–16 kHz → small objects
  overall: number;
  beat: boolean; // bass onset this frame (live FFT)
}

export interface BeatGrid {
  firstBeat: number; // seconds into the track of the first strong onset
  period: number | null; // seconds per beat (null if no stable tempo found)
  bpm: number | null;
}

/**
 * Scan raw PCM for the first strong onset and the beat period.
 * Pure function (exported for the dev verification harness).
 */
export function computeBeatGrid(ch: Float32Array, sampleRate: number): BeatGrid | null {
  const hop = 512; // ~11.6ms @ 44.1kHz
  const n = Math.floor(ch.length / hop);
  if (n < 120) return null;

  // Short-window RMS energy envelope
  const energy = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    const o = i * hop;
    for (let j = 0; j < hop; j++) {
      const v = ch[o + j];
      s += v * v;
    }
    energy[i] = Math.sqrt(s / hop);
  }

  // Onset strength = positive energy flux
  const flux = new Float32Array(n);
  for (let i = 1; i < n; i++) flux[i] = Math.max(0, energy[i] - energy[i - 1]);

  const sorted = Float32Array.from(energy).sort();
  const p90 = sorted[Math.min(n - 1, (n * 0.9) | 0)];
  if (!(p90 > 1e-4)) return null; // silent / broken track

  // First strong onset = the track's first beat-like hit
  let first = -1;
  for (let i = 1; i < n; i++) {
    if (energy[i] > 0.5 * p90 && flux[i] > 0.1 * p90) {
      first = i;
      break;
    }
  }
  if (first < 0) first = 0;
  const firstBeat = (first * hop) / sampleRate;

  // Tempo via autocorrelation of the onset envelope, constrained to 68–185 BPM
  const fps = sampleRate / hop;
  const minLag = Math.max(2, Math.round((fps * 60) / 185));
  const maxLag = Math.min(n - 2, Math.round((fps * 60) / 68));
  let bestLag = 0;
  let best = 0;
  const score = (lag: number) => {
    let s = 0;
    const m = n - lag;
    for (let i = 0; i < m; i++) s += flux[i] * flux[i + lag];
    return s / m;
  };
  for (let lag = minLag; lag <= maxLag; lag++) {
    const sc = score(lag);
    if (sc > best) {
      best = sc;
      bestLag = lag;
    }
  }
  if (!bestLag || best <= 0) return { firstBeat, period: null, bpm: null };

  // Parabolic refinement for sub-frame period accuracy (limits drift over 8 beats)
  let lag = bestLag;
  if (bestLag > minLag && bestLag < maxLag) {
    const s0 = score(bestLag - 1);
    const s1 = best;
    const s2 = score(bestLag + 1);
    const denom = s0 - 2 * s1 + s2;
    if (Math.abs(denom) > 1e-12) {
      const delta = (0.5 * (s0 - s2)) / denom;
      if (Math.abs(delta) < 1) lag = bestLag + delta;
    }
  }
  const period = lag / fps;
  return { firstBeat, period, bpm: 60 / period };
}

/**
 * Estimate which beat-phase class (k mod 4) carries the downbeats: the class
 * whose beats consistently open with the most energy. Loop points anchored on
 * downbeats mean the wrap always lands on a bar-start — the strongest masking
 * transient the track has.
 */
export function estimateDownbeatPhase(ch: Float32Array, sampleRate: number, grid: BeatGrid): number {
  if (!grid.period) return 0;
  const W = Math.round(0.03 * sampleRate); // 30ms onset window
  const totals = [0, 0, 0, 0];
  const counts = [0, 0, 0, 0];
  const nBeats = Math.floor((ch.length / sampleRate - grid.firstBeat) / grid.period);
  for (let k = 0; k < nBeats; k++) {
    const i0 = Math.round((grid.firstBeat + k * grid.period) * sampleRate);
    let s = 0;
    for (let i = 0; i < W; i++) {
      const v = ch[i0 + i] ?? 0;
      s += v * v;
    }
    totals[k % 4] += Math.sqrt(s / W);
    counts[k % 4]++;
  }
  let best = 0;
  for (let d = 1; d < 4; d++) {
    if (totals[d] / Math.max(1, counts[d]) > totals[best] / Math.max(1, counts[best])) best = d;
  }
  return best;
}

/**
 * Pick the cleanest seamless loop region (§ user spec: first playback runs from
 * 00:00, wraps at ~00:28 back into ~00:02, then loops that region forever; the
 * wrap must NOT cut a phrase early).
 *
 * Sound-engineering, not guesswork:
 *  1. Both loop points sit on DOWNBEATS (bar starts) — the wrap lands on the
 *     bar's strongest transient, and the region is whole bars by construction.
 *  2. loopEnd is searched LATE (~27.3–29s) so the final phrase completes.
 *  3. Among candidates, score perceptual continuity at the splice (energy flow,
 *     timbre, instantaneous step) and prefer the LATEST near-tied end.
 *  4. start() then BAKES a 60ms equal-power crossfade into the buffer at the
 *     seam (bakeSeamlessLoop) — the splice becomes sample-continuous, exactly
 *     like an offline gapless master (§11).
 */
export interface LoopRegion {
  loopStart: number;
  loopEnd: number;
  seamScore: number;
  downbeatPhase: number;
  bars: number;
}

export function pickLoopRegion(ch: Float32Array, sampleRate: number, grid: BeatGrid): LoopRegion | null {
  const p = grid.period;
  if (!p) return null;
  const durS = ch.length / sampleRate;
  const beat = (k: number) => grid.firstBeat + k * p;
  const W = Math.round(0.05 * sampleRate); // 50ms perceptual window

  // What the ear hears at a splice is a jump in ENERGY or TIMBRE, not raw
  // sample mismatch (a beat-aligned cut is masked by the kick transient).
  const rms = (i0: number, n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) {
      const v = ch[i0 + i] ?? 0;
      s += v * v;
    }
    return Math.sqrt(s / n);
  };
  const zcr = (i0: number, n: number) => {
    let c = 0;
    for (let i = 1; i < n; i++) {
      const a = ch[i0 + i - 1] ?? 0;
      const b = ch[i0 + i] ?? 0;
      if ((a < 0 && b >= 0) || (a >= 0 && b < 0)) c++;
    }
    return c / n;
  };
  const score = (lsIdx: number, leIdx: number) =>
    Math.abs(rms(leIdx - W, W) - rms(lsIdx, W)) * 4 + // energy flow across the wrap
    Math.abs(zcr(leIdx - W, W) - zcr(lsIdx, W)) + // timbre continuity
    Math.abs((ch[leIdx] ?? 0) - (ch[lsIdx] ?? 0)) * 0.5; // instantaneous step (click)

  // Anchor BOTH points on downbeats — the wrap lands on a bar-start transient,
  // and the region is whole bars by construction.
  const d = estimateDownbeatPhase(ch, sampleRate, grid);
  const downbeats: number[] = [];
  for (let k = d; beat(k) < durS; k += 4) downbeats.push(k);

  const startKs = downbeats.filter((k) => beat(k) >= 1.7 && beat(k) <= 3.4);
  // Search LATE (user: "you are cutting it a bit early") — let the last phrase
  // resolve before the wrap.
  const maxEnd = Math.min(29.2, durS - 0.08);
  const endKs = downbeats.filter((k) => beat(k) >= 27.2 && beat(k) <= maxEnd);
  // Fallback windows if the track is structured unusually.
  const startPool = startKs.length ? startKs : downbeats.filter((k) => beat(k) >= 1.2 && beat(k) <= 4.2);
  const endPool = endKs.length ? endKs : downbeats.filter((k) => beat(k) >= 25.5 && beat(k) <= maxEnd);

  const candidates: LoopRegion[] = [];
  for (const k of startPool) {
    for (const ke of endPool) {
      if (ke - k < 16) continue; // at least 4 bars of loop
      const ls = beat(k);
      const le = beat(ke);
      const sc = score(Math.round(ls * sampleRate), Math.round(le * sampleRate));
      candidates.push({ loopStart: ls, loopEnd: le, seamScore: sc, downbeatPhase: d, bars: (ke - k) / 4 });
    }
  }
  if (!candidates.length) return null;
  const bestScore = Math.min(...candidates.map((c) => c.seamScore));
  // Among near-tied seams (within 25%), take the LATEST end — never cut early.
  const nearTies = candidates.filter((c) => c.seamScore <= bestScore * 1.25);
  nearTies.sort((a, b) => b.loopEnd - a.loopEnd || a.seamScore - b.seamScore);
  return nearTies[0];
}

/**
 * Bake a gapless master at runtime (§11 "equal-power crossfade the seam"):
 * copy the PCM and, over the last `fadeS` before loopEnd, equal-power
 * crossfade into the material that precedes loopStart. The final pre-wrap
 * sample becomes identical to the sample before loopStart, so the native
 * sample-accurate loop jump is mathematically continuous — no click, no step,
 * no audible restart. (First-pass listeners hear a ~60ms morph, inaudible.)
 */
export function bakeSeamlessLoop(
  ctx: BaseAudioContext,
  src: AudioBuffer,
  loopStart: number,
  loopEnd: number,
  fadeS = 0.06,
): AudioBuffer {
  const sr = src.sampleRate;
  const lsIdx = Math.round(loopStart * sr);
  const leIdx = Math.round(loopEnd * sr);
  const w = Math.max(8, Math.min(Math.round(fadeS * sr), lsIdx - 1));
  const out = ctx.createBuffer(src.numberOfChannels, src.length, sr);
  for (let c = 0; c < src.numberOfChannels; c++) {
    const a = src.getChannelData(c);
    const o = out.getChannelData(c);
    o.set(a);
    for (let i = 0; i < w; i++) {
      const t = ((i + 1) / w) * Math.PI * 0.5;
      const pos = leIdx - w + i;
      const donor = lsIdx - w + i;
      o[pos] = (a[pos] ?? 0) * Math.cos(t) + (a[donor] ?? 0) * Math.sin(t);
    }
  }
  return out;
}

type AudioContextCtor = typeof AudioContext;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  private rawBytes: ArrayBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private freq: Uint8Array<ArrayBuffer> | null = null;
  private grid: BeatGrid | null = null;
  private startCtxTime = 0; // ctx.currentTime at source.start()
  private loopStartS = 0; // seamless loop region, snapped to grid beats (§ user: ~2s → ~27s)
  private loopEndS = 0;

  private bAvg = 0.001;
  private _level = 0;

  playing = false;
  ready = false;
  private bgPaused = false; // suspended because the tab/app went to the background

  /** Fetch the raw track bytes early (no AudioContext / no gesture needed). */
  async preload(): Promise<void> {
    if (this.rawBytes) return;
    try {
      const res = await fetch(TRACK_URL);
      this.rawBytes = await res.arrayBuffer();
    } catch (e) {
      console.warn('[audio] preload failed', e);
    }
  }

  /** Start playback + analysis. MUST be called from a user gesture (§11).
   *  `opts.notBeforeMs` (a performance.now() timestamp) schedules the actual
   *  playback start sample-accurately — used so the track's first beat never
   *  arrives before the icon formation has finished (the count-in). */
  async start(volume: number, opts?: { notBeforeMs?: number }): Promise<void> {
    try {
      if (!this.ctx) {
        const Ctor = (window.AudioContext ||
          (window as unknown as { webkitAudioContext: AudioContextCtor }).webkitAudioContext) as AudioContextCtor;
        this.ctx = new Ctor();
      }
      await this.ctx.resume();

      if (!this.buffer) {
        if (!this.rawBytes) await this.preload();
        if (!this.rawBytes) throw new Error('no track bytes');
        // decodeAudioData detaches the ArrayBuffer — decode a copy so preload can retry.
        this.buffer = await this.ctx.decodeAudioData(this.rawBytes.slice(0));
      }
      if (!this.grid) {
        this.grid = computeBeatGrid(this.buffer.getChannelData(0), this.buffer.sampleRate);
        if (this.grid) {
          console.info(
            '[audio] beat grid — first beat %ss · %s BPM',
            this.grid.firstBeat.toFixed(3),
            this.grid.bpm ? this.grid.bpm.toFixed(1) : '?',
          );
        }
      }

      if (!this.gain) {
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 0;
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;
        this.freq = new Uint8Array(this.analyser.frequencyBinCount);
        // source → analyser → gain → destination (analyser pre-gain: see header)
        this.analyser.connect(this.gain);
        this.gain.connect(this.ctx.destination);
      }

      // Never stop/restart the graph while playing; only build a source once.
      if (!this.source) {
        // --- seamless loop region (user spec: FIRST playback runs untouched
        // from 00:00 — the landing count-in owns the track's opening beats —
        // then the wrap at ~00:28 drops back into ~00:02 and loops once more, stops).
        // Points are chosen by pickLoopRegion: beat-aligned, bar-phase-safe,
        // and seam-scored against the actual PCM for an inaudible splice.
        const dur = this.buffer.duration;
        let ls = Math.min(2.0, dur * 0.1);
        let le = Math.min(28.0, dur - 0.05);
        const picked = this.grid
          ? pickLoopRegion(this.buffer.getChannelData(0), this.buffer.sampleRate, this.grid)
          : null;
        let playBuffer = this.buffer;
        if (picked) {
          ls = picked.loopStart;
          le = picked.loopEnd;
          // Bake the gapless master: equal-power crossfade at the seam (§11).
          playBuffer = bakeSeamlessLoop(this.ctx, this.buffer, ls, le);
          console.info(
            '[audio] seamless loop %ss → %ss · %s bars · downbeat phase %s · seam %s · crossfade baked',
            ls.toFixed(3),
            le.toFixed(3),
            picked.bars,
            picked.downbeatPhase,
            picked.seamScore.toFixed(4),
          );
        }
        this.loopStartS = ls;
        this.loopEndS = le;

        // Remaining wait AFTER decode — if decode already ate the gather time,
        // start immediately; otherwise hold playback until the formation is set.
        const delay = opts?.notBeforeMs ? Math.max(0, (opts.notBeforeMs - performance.now()) / 1000) : 0;
        const startAt = this.ctx.currentTime + delay;
        this.source = this.ctx.createBufferSource();
        this.source.buffer = playBuffer; // the baked gapless master
        this.source.loop = true;
        this.source.loopStart = ls;
        this.source.loopEnd = le;
        this.source.connect(this.analyser!);
        this.source.start(startAt); // from 00:00 — the count-in's opening beats intact
        this.startCtxTime = startAt;
        // Gain reaches target exactly WHEN playback begins — no fade softening
        // beat 1 (the pre-roll silence is the fade; 50ms floor kills any click).
        const g = this.gain!.gain;
        const now = this.ctx.currentTime;
        g.cancelScheduledValues(now);
        g.setValueAtTime(0.0001, now);
        g.linearRampToValueAtTime(Math.max(0.0001, volume), Math.max(startAt, now + 0.05));

        // § user: play the intro once, loop the region exactly ONE more time,
        // then STOP — no forever-loop. The stop lands on loopEnd (a downbeat /
        // bar-end): 0->le (intro) then ls->le (one loop) = startAt + 2*le - ls.
        // A short release ramp keeps the ending from clicking. Only the TAIL is
        // touched — startAt, the beat grid, and the count-in fade above are
        // untouched, so the icon-bounce sync is unchanged.
        if (le > ls) {
          const endAt = startAt + 2 * le - ls;
          g.setValueAtTime(Math.max(0.0001, volume), Math.max(now, endAt - 0.22));
          g.linearRampToValueAtTime(0.0001, endAt);
          this.source.stop(endAt);
          this.source.onended = () => {
            this.playing = false;
          };
        }
      } else {
        this.fade(volume, 0.5);
      }

      this.ready = true;
      this.playing = true;
    } catch (e) {
      console.warn('[audio] start failed', e);
    }
  }

  /** Equal-power-ish linear fade to a target gain over `seconds` (§11). */
  fade(target: number, seconds: number): void {
    if (!this.ctx || !this.gain) return;
    const now = this.ctx.currentTime;
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(this.gain.gain.value, now);
    this.gain.gain.linearRampToValueAtTime(Math.max(0.0001, target), now + seconds);
  }

  setVolume(v: number, muted: boolean): void {
    if (!this.playing) return;
    this.fade(muted ? 0 : v, 0.25);
  }

  /** Pause when the tab/app leaves the foreground (§ user: the music must not
   *  keep playing in the background). Suspends the audio clock, so on return
   *  playback resumes at the exact same sample — position, loop, and the
   *  scheduled tail-stop are all preserved. Additive only: start(), the
   *  scheduling, notBeforeMs and the beat grid are untouched, so the
   *  icon-bounce count-in sync is unaffected. */
  pauseForBackground(): void {
    if (!this.ctx || !this.playing || this.bgPaused) return;
    if (this.ctx.state === 'running') {
      this.bgPaused = true;
      void this.ctx.suspend().catch(() => {});
    }
  }

  /** Resume after returning to the foreground — only ever un-pauses what this
   *  helper paused, so it is safe to call unconditionally on visibility change. */
  resumeFromBackground(): void {
    if (!this.ctx || !this.bgPaused) return;
    this.bgPaused = false;
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {});
  }

  // ---- beat-grid clock -----------------------------------------------------

  /** Seconds into the (looping) track — sample-clock accurate. Null until
   *  playing. First pass runs 0 → loopEnd exactly as recorded (identical to the
   *  locked landing for the whole entry sequence); every pass after wraps
   *  loopEnd → loopStart. */
  getPlaybackTime(): number | null {
    if (!this.ctx || !this.playing || !this.buffer) return null;
    const t = this.ctx.currentTime - this.startCtxTime;
    if (t < 0) return null;
    const len = this.loopEndS - this.loopStartS;
    if (len > 0 && t >= this.loopEndS) {
      return this.loopStartS + ((t - this.loopEndS) % len);
    }
    if (len > 0) return t;
    return t % this.buffer.duration;
  }

  getGrid(): BeatGrid | null {
    return this.grid;
  }

  hasGrid(): boolean {
    return !!(this.grid && this.grid.period != null);
  }

  /** Did playback cross a scheduled beat between the two playhead positions? */
  beatCrossed(prev: number, now: number): boolean {
    const g = this.grid;
    if (!g || g.period == null || !this.buffer) return false;
    const idx = (t: number) => Math.floor((t - g.firstBeat) / g.period!);
    if (now >= prev) return idx(now) > idx(prev);
    // wrapped around the loop point
    return idx(this.buffer.duration) > idx(prev) || idx(now) >= 0;
  }

  /** The next scheduled beat at/after playhead t (null without a grid). */
  nextBeatAfter(t: number): number | null {
    const g = this.grid;
    if (!g || g.period == null) return null;
    if (t <= g.firstBeat) return g.firstBeat;
    return g.firstBeat + Math.ceil((t - g.firstBeat) / g.period) * g.period;
  }

  // ---- live FFT --------------------------------------------------------------

  /** Live FFT bands + bass-onset beat detection. Safe to call every frame. */
  bands(): Bands {
    const a = this.analyser;
    const f = this.freq;
    if (!a || !f || !this.playing) {
      this._level *= 0.9;
      return { bass: 0, mid: 0, treble: 0, overall: this._level, beat: false };
    }
    a.getByteFrequencyData(f);
    const avg = (lo: number, hi: number) => {
      let s = 0;
      for (let i = lo; i < hi; i++) s += f[i];
      return s / ((hi - lo) * 255);
    };
    const bass = avg(1, 7);
    const mid = avg(7, 70);
    const treble = avg(70, 240);
    const overall = avg(1, 240);
    this.bAvg = this.bAvg * 0.94 + bass * 0.06;
    const beat = bass > this.bAvg * 1.35 && bass > 0.22;
    this._level += (overall - this._level) * 0.35;
    return { bass, mid, treble, overall, beat };
  }

  /** Smoothed overall energy for the waveform ring. */
  getLevel(): number {
    return this._level;
  }

  dispose(): void {
    try {
      this.source?.stop();
    } catch {
      /* already stopped */
    }
    this.source = null;
    this.playing = false;
    this.ctx?.close();
    this.ctx = null;
    this.gain = null;
    this.analyser = null;
    this.buffer = null;
    this.grid = null;
  }
}

export const audio = new AudioEngine();
