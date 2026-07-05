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

  private bAvg = 0.001;
  private _level = 0;

  playing = false;
  ready = false;

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
        // Remaining wait AFTER decode — if decode already ate the gather time,
        // start immediately; otherwise hold playback until the formation is set.
        const delay = opts?.notBeforeMs ? Math.max(0, (opts.notBeforeMs - performance.now()) / 1000) : 0;
        const startAt = this.ctx.currentTime + delay;
        this.source = this.ctx.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.loop = true;
        this.source.loopStart = 0;
        this.source.loopEnd = this.buffer.duration;
        this.source.connect(this.analyser!);
        this.source.start(startAt);
        this.startCtxTime = startAt;
        // Gain reaches target exactly WHEN playback begins — no fade softening
        // beat 1 (the pre-roll silence is the fade; 50ms floor kills any click).
        const g = this.gain!.gain;
        const now = this.ctx.currentTime;
        g.cancelScheduledValues(now);
        g.setValueAtTime(0.0001, now);
        g.linearRampToValueAtTime(Math.max(0.0001, volume), Math.max(startAt, now + 0.05));
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

  // ---- beat-grid clock -----------------------------------------------------

  /** Seconds into the (looping) track — sample-clock accurate. Null until playing. */
  getPlaybackTime(): number | null {
    if (!this.ctx || !this.playing || !this.buffer) return null;
    const t = this.ctx.currentTime - this.startCtxTime;
    return t < 0 ? null : t % this.buffer.duration;
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
