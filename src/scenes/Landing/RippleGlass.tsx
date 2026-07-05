import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

import { useExperience } from '@/store/useExperience';
import { dprCap } from '@/lib/env';
import { lerpPalette } from '@/theme/palettes';
import { audio } from '@/audio/AudioEngine';
import { worldVideoUrl, preloadProgress } from '@/lib/videoPreload';
import { SceneBeneath } from './SceneBeneath';
import { loadSignal } from './loadSignal';
import { MAX, vertexShader, fragmentShader } from './rippleShader';

const LOAD_DURATION = 5.0; // fallback loader length when no beat grid exists
const PHRASE_BEATS = 8; // with a grid, the loader = two bars — ends ON a beat (§23)
const BURST_DURATION = 1.25;
const MIN_GATHER = 0.6; // ring must be fully formed before we accept a beat
const MAX_WAIT = 2.6; // synthetic-pulse fallback (entered quietly)
const MAX_WAIT_AUDIO = 4.0; // playing but no scheduled/live beat found
const MAX_WAIT_DECODE = 6.0; // audio requested but decode stalled
const TRAIL_TAU = 0.85; // seconds — wipe-trail re-frost time constant

/** The fullscreen glass quad: paints the world beneath into a CanvasTexture and
 *  runs the ripple fragment shader over it each frame. */
function Ripple() {
  const { gl, size } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);

  const scene = useMemo(() => new SceneBeneath(), []);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(scene.canvas);
    t.flipY = false; // scene canvas is y-down, top-left origin — matches v_uv
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  }, [scene]);

  // Wipe-trail clarity accumulation: a small canvas painted at the pointer each
  // frame and faded toward opaque (dt-based). The shader samples its alpha as
  // u_trail — this is what leaves the long transparent trail behind a swipe.
  const trail = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = 180;
    return { canvas: c, ctx: c.getContext('2d')! };
  }, []);
  const trailTexture = useMemo(() => {
    const t = new THREE.CanvasTexture(trail.canvas);
    t.flipY = false;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  }, [trail]);

  // Ripple source ring-buffer (mutated in place, re-uploaded each frame)
  const orig = useMemo(() => new Float32Array(MAX * 2), []);
  const age = useMemo(() => {
    const a = new Float32Array(MAX);
    a.fill(-1);
    return a;
  }, []);
  const amp = useMemo(() => new Float32Array(MAX), []);

  const uniforms = useMemo(
    () => ({
      u_tex: { value: texture },
      u_trail: { value: trailTexture },
      u_res: { value: new THREE.Vector2(1, 1) },
      u_time: { value: 0 },
      u_ptr: { value: new THREE.Vector2(0.5, 0.5) },
      u_ptrOn: { value: 0 },
      u_clear: { value: 0 },
      u_frost: { value: new THREE.Vector3(0.13, 0.15, 0.24) },
      u_orig: { value: orig },
      u_age: { value: age },
      u_amp: { value: amp },
      u_fade: { value: 1 },
      u_rest: { value: 0.1 },
    }),
    [texture, trailTexture, orig, age, amp],
  );

  const rt = useRef({
    head: 0,
    ptr: [0.5, 0.5] as [number, number],
    ptrOn: 0,
    last: [0.5, 0.5] as [number, number],
    lastT: performance.now(),
    clearPulse: 0,
    themeMix: useExperience.getState().theme === 'light' ? 1 : 0,
    burstStart: 0,
    prevPhase: 'overture' as string,
    gatherStart: 0,
    beatLocked: false,
    lastPlayT: null as number | null, // playhead last frame (grid-beat crossing)
    lockPlayT: 0, // playhead at the beat lock (loader counts from here)
    lockWall: 0,
    phrase: LOAD_DURATION,
    beatCount: 0, // beats since the lock — 1..3 get the emphasized count-in
    fade: 1, // glass overlay opacity — dissolves to reveal the 3D city at world
    prevT: performance.now(),
  });

  // Pointer / touch → decaying wave sources (§16.1). Ported from canonical onMove.
  useEffect(() => {
    const el = gl.domElement;
    const toUV = (cx: number, cy: number): [number, number] => {
      const r = el.getBoundingClientRect();
      return [(cx - r.left) / r.width, (cy - r.top) / r.height];
    };
    const push = (uv: [number, number]) => {
      const s = rt.current;
      const now = performance.now();
      const dt = Math.max(16, now - s.lastT);
      const moved = Math.hypot(uv[0] - s.last[0], uv[1] - s.last[1]);
      const sp = moved / (dt / 1000);
      s.ptr = uv;
      s.ptrOn = 1;
      if (moved > 0.012) {
        orig[s.head * 2] = uv[0];
        orig[s.head * 2 + 1] = uv[1];
        age[s.head] = 0;
        amp[s.head] = Math.min(0.85, 0.26 + sp * 0.4);
        s.head = (s.head + 1) % MAX;
        s.last = [uv[0], uv[1]];
        s.lastT = now;
      }
    };
    const onMouse = (e: MouseEvent) => push(toUV(e.clientX, e.clientY));
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) push(toUV(t.clientX, t.clientY));
    };
    const onLeave = () => {
      rt.current.ptrOn = 0;
    };
    el.addEventListener('mousemove', onMouse);
    el.addEventListener('touchmove', onTouch, { passive: true });
    el.addEventListener('touchstart', onTouch, { passive: true });
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMouse);
      el.removeEventListener('touchmove', onTouch);
      el.removeEventListener('touchstart', onTouch);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [gl, orig, age, amp]);

  // Keep the offscreen scene + trail canvas sized to the viewport aspect
  useEffect(() => {
    scene.resize(size.width, size.height);
    texture.needsUpdate = true;
    trail.canvas.width = 320;
    trail.canvas.height = Math.max(2, Math.round((320 * size.height) / Math.max(1, size.width)));
    trailTexture.needsUpdate = true;
  }, [size, scene, texture, trail, trailTexture]);

  useFrame(() => {
    const s = rt.current;
    const now = performance.now();
    const dt = Math.min(0.05, (now - s.prevT) / 1000);
    s.prevT = now;
    const time = now / 1000;
    const st = useExperience.getState();

    // decay pointer influence + age out the ripple sources
    s.ptrOn *= 0.97;
    for (let i = 0; i < MAX; i++) {
      if (age[i] >= 0) {
        age[i] += dt;
        if (age[i] > 2.3) age[i] = -1;
      }
    }

    // ease the golden-hour theme sweep
    const themeTarget = st.theme === 'light' ? 1 : 0;
    s.themeMix += (themeTarget - s.themeMix) * 0.055;

    // --- audio bands (live FFT, or a gentle synthetic pulse for quiet entry) ---
    const bands = audio.bands();
    if (!st.audioStarted && st.phase !== 'overture') {
      bands.bass = 0.36 + 0.3 * Math.abs(Math.sin(time * 3.0));
      bands.treble = 0.3 + 0.26 * Math.abs(Math.sin(time * 6.2 + 1));
      bands.overall = 0.32 + 0.26 * Math.abs(Math.sin(time * 3.0));
      // rising edge only — one beat event per pulse, not one per frame at the peak
      bands.beat = Math.sin(time * 3.0) > 0.972 && Math.sin((time - dt) * 3.0) <= 0.972;
    }
    if (st.reducedMotion) {
      bands.bass *= 0.35;
      bands.treble *= 0.35;
      bands.overall *= 0.35;
      bands.beat = false;
    }
    loadSignal.overall = bands.overall;

    // --- glass dissolve: at world the opaque overlay fades out, revealing the
    // 3D city behind it (T1's rack-focus push "through the glass"). Once fully
    // dissolved, skip ALL 2D painting — the landing's cost drops to ~zero and
    // the city owns the frame. (bands above still run: signs breathe on music.)
    if (st.phase === 'world') {
      s.fade = Math.max(0, s.fade - dt * 0.8);
      uniforms.u_fade.value = s.fade;
      if (meshRef.current) meshRef.current.visible = s.fade > 0.001;
      if (s.fade <= 0.001) return;
    } else {
      s.fade = 1;
      uniforms.u_fade.value = 1;
      if (meshRef.current) meshRef.current.visible = true;
    }

    // --- scheduled beat clock: did the playhead cross a grid beat this frame? ---
    // (sample-clock accurate + volume-independent — the analyser taps pre-gain,
    //  and the grid comes from scanning the actual PCM, not the smoothed FFT.)
    const playT = audio.getPlaybackTime();
    let gridBeat = false; // sequencing: lock / burst / beat count
    if (playT != null && s.lastPlayT != null) gridBeat = audio.beatCrossed(s.lastPlayT, playT);
    s.lastPlayT = playT;
    // visual pops are suppressed under reduced motion, but sequencing must
    // still advance or the loader would hang at 99 waiting for a beat.
    const popBeat = gridBeat && !st.reducedMotion;

    // --- the entry sequence: overture → loading → burst → world (§12, §21) ---
    const phase = st.phase;
    if (phase === 'loading' && s.prevPhase !== 'loading') {
      s.gatherStart = time;
      s.beatLocked = false;
      s.lockPlayT = 0;
      s.lockWall = 0;
      s.phrase = LOAD_DURATION;
      s.beatCount = 0;
      loadSignal.progress = 0;
      loadSignal.countInDone = false;
    }
    s.prevPhase = phase;

    // Bands actually handed to the dance, and gather state. During the count-in
    // (beats 1–3) ONLY scheduled grid beats pop — a stray live-FFT onset between
    // them would blur the choreography. From beat 4, both sources drive pops.
    let danceBands = bands;
    if (s.beatLocked) {
      const inCountIn = s.beatCount < 3;
      const countBeat = audio.hasGrid() ? popBeat : bands.beat;
      danceBands = { ...bands, beat: inCountIn ? countBeat : bands.beat || popBeat };
    }
    let gathering = false;

    if (phase === 'loading') {
      if (!s.beatLocked) {
        // GATHER: rearrange into the ring, but hold the dance — no pops yet.
        gathering = true;
        danceBands = { bass: 0, mid: 0, treble: 0, overall: 0.16, beat: false };
        const waited = time - s.gatherStart;
        const ready = waited > MIN_GATHER;
        let lock = false;
        if (st.audioStarted) {
          if (playT != null) {
            // Music is running: lock on the next SCHEDULED beat after the ring
            // forms (grid), or the live FFT onset if no stable tempo was found.
            lock = ready && (gridBeat || (!audio.hasGrid() && bands.beat) || waited > MAX_WAIT_AUDIO);
          } else {
            lock = waited > MAX_WAIT_DECODE; // decode stalled — don't hang forever
          }
        } else {
          // Entered quietly: synthetic pulse stands in for the track.
          lock = ready && (bands.beat || waited > MAX_WAIT);
        }
        if (lock) {
          // THE SYNC MOMENT — the first pop lands exactly on this beat, and the
          // loader counts from this downbeat.
          s.beatLocked = true;
          s.lockPlayT = playT ?? 0;
          s.lockWall = time;
          const g = audio.getGrid();
          s.phrase = g?.period ? PHRASE_BEATS * g.period : LOAD_DURATION;
          danceBands = { ...bands, bass: Math.max(bands.bass, 0.6), beat: !st.reducedMotion };
          gathering = false;
        }
      } else {
        // DANCE: loader = one 8-beat phrase on the playback clock AND the world
        // video download AND the avatar's walk-in resolving into his final pose
        // (§ user spec — loading finishes only when assets are loaded and the
        // avatar has done its animation). Burst still fires ON a beat.
        const onGrid = audio.hasGrid() && playT != null;
        const elapsed = onGrid ? Math.max(0, (playT as number) - s.lockPlayT) : time - s.lockWall;
        const videoP = preloadProgress(worldVideoUrl(st.theme));
        const p = Math.min(elapsed / s.phrase, videoP, loadSignal.avatarProgress);
        if (p >= 1 && (!onGrid || gridBeat)) {
          loadSignal.progress = 1;
          s.burstStart = time;
          st.setPhase('burst');
        } else {
          loadSignal.progress = Math.max(loadSignal.progress, Math.min(0.99, p));
        }
      }
    } else if (phase === 'burst') {
      loadSignal.burst = Math.min(1, (time - s.burstStart) / BURST_DURATION);
      if (loadSignal.burst >= 1) st.setPhase('world');
    } else if (phase === 'world') {
      loadSignal.burst = 1;
    }

    // clarity: frosted overture (pointer wipes) → glass fully clears during the
    // gather, so beats 1·2·3 are watched through CLEAR glass, never blur.
    const clearTarget = phase === 'overture' ? 0 : 1;
    s.clearPulse += (clearTarget - s.clearPulse) * 0.12;

    // Count beats since the lock — the first three are the emphasized count-in.
    if (s.beatLocked && !gathering && danceBands.beat) s.beatCount++;

    // The avatar holds his entrance until the three bounces have had their
    // moment (beat 4 = the groove takes over). Time fallback covers the
    // quiet-entry synthetic path; burst/world guarantee it can never be missed
    // — the loader gate depends on this flag eventually flipping.
    if (
      !loadSignal.countInDone &&
      ((s.beatLocked && (s.beatCount >= 4 || time - s.lockWall > 2.6)) ||
        phase === 'burst' ||
        phase === 'world')
    ) {
      loadSignal.countInDone = true;
    }

    scene.step(dt, time, {
      ptr: s.ptr,
      ptrOn: Math.min(1, s.ptrOn),
      themeMix: s.themeMix,
      reduced: st.reducedMotion,
      mode: phase === 'overture' ? 'idle' : 'dance',
      colorMix: 0,
      bands: danceBands,
      burst: loadSignal.burst,
      gathering,
      emphasis: s.beatCount > 0 && s.beatCount <= 3,
      scroll: st.scroll,
    });
    texture.needsUpdate = true;

    // --- wipe trail: fade toward opaque (re-frost), then paint the pointer ---
    {
      const tc = trail.ctx;
      const tw = trail.canvas.width;
      const th = trail.canvas.height;
      tc.globalCompositeOperation = 'destination-out';
      tc.fillStyle = `rgba(0,0,0,${Math.min(1, 1 - Math.exp(-dt / TRAIL_TAU))})`;
      tc.fillRect(0, 0, tw, th);
      // ptrOn > 0.9 ⇒ the pointer actually moved within the last few frames
      if (s.ptrOn > 0.9) {
        const x = s.ptr[0] * tw;
        const y = s.ptr[1] * th;
        const r = 0.16 * th;
        const g2 = tc.createRadialGradient(x, y, 0, x, y, r);
        g2.addColorStop(0, 'rgba(255,255,255,1)');
        g2.addColorStop(0.6, 'rgba(255,255,255,0.6)');
        g2.addColorStop(1, 'rgba(255,255,255,0)');
        tc.globalCompositeOperation = 'source-over';
        tc.fillStyle = g2;
        tc.beginPath();
        tc.arc(x, y, r, 0, 6.28);
        tc.fill();
      }
      trailTexture.needsUpdate = true;
    }

    uniforms.u_time.value = time;
    (uniforms.u_ptr.value as THREE.Vector2).set(s.ptr[0], s.ptr[1]);
    uniforms.u_ptrOn.value = Math.min(1, s.ptrOn);
    uniforms.u_clear.value = s.clearPulse;
    const P = lerpPalette(s.themeMix);
    (uniforms.u_frost.value as THREE.Vector3).set(P.frost[0], P.frost[1], P.frost[2]);
    // Dark frost conceals almost everything: ~4% scene-through at rest
    // (user-tuned −35%); the wipe (cl→0.92) is the only reveal.
    uniforms.u_rest.value = 0.04 + 0.18 * s.themeMix;
    (uniforms.u_res.value as THREE.Vector2).set(gl.domElement.width, gl.domElement.height);
  });

  return (
    // Drawn LAST (renderOrder 10) as a transparent overlay over the 3D city;
    // opaque through the whole overture (u_fade=1 → visually identical to the
    // locked landing), dissolving only at world.
    <mesh ref={meshRef} frustumCulled={false} renderOrder={10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthTest={false}
        depthWrite={false}
        transparent
      />
    </mesh>
  );
}

/** The "expensive look" post stack — bloom, film grain, vignette (§08, §10). */
function Post({ reduced }: { reduced: boolean }) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.55}
        luminanceThreshold={0.22}
        luminanceSmoothing={0.35}
        radius={0.7}
        mipmapBlur
      />
      <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={reduced ? 0 : 0.04} />
      <Vignette offset={0.28} darkness={0.62} eskil={false} />
    </EffectComposer>
  );
}

export default function RippleGlass() {
  const quality = useExperience((s) => s.quality);
  const reduced = useExperience((s) => s.reducedMotion);
  const phase = useExperience((s) => s.phase);
  // At world the whole glass canvas dissolves (CSS) to reveal the cinematic
  // world VIDEO behind it (WorldBackdrop, z:0). Post is dropped at world so the
  // composer can't paint over the video; the frame loop early-returns too.
  const world = phase === 'world';
  return (
    <Canvas
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        touchAction: 'none',
        opacity: world ? 0 : 1,
        pointerEvents: world ? 'none' : 'auto',
        transition: 'opacity 1.5s ease 0.15s',
      }}
      gl={{ alpha: false, antialias: false, powerPreference: 'high-performance', stencil: false }}
      dpr={[1, Math.min(1.5, dprCap(quality))]}
      camera={{ position: [0, 0, 1], near: 0.1, far: 10 }}
      onCreated={({ gl }) => gl.setClearColor(0x05060b, 1)}
    >
      <Ripple />
      {quality !== 'low' && !world && <Post reduced={reduced} />}
    </Canvas>
  );
}
