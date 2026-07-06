import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useExperience } from '@/store/useExperience';
import { loadSignal } from '@/scenes/Landing/loadSignal';

/**
 * The avatar (final form): fades in walking at the BOTTOM-RIGHT — behind the
 * Dark/Light toggle — while the 0→100 loading runs, resolves into his
 * folded-hands pose, and stays there for the whole journey. Desktop only —
 * on phones (≤760px) he's hidden entirely, landing and journey alike.
 *
 * SMOOTH *and* SYNC-SAFE — the lesson of three iterations:
 *   · v2 keyed with canvas getImageData per frame → GPU-pipeline READBACK
 *     stalls → broke the beat-synced dance.
 *   · v3 pre-baked 12fps bitmaps → stall-free but visibly choppy.
 *   · v4 (this): the video plays NATIVELY (hardware decode, full frame rate)
 *     and the chroma key runs in a tiny WebGL shader. texImage2D uploads the
 *     frame CPU→GPU (async, no stall) and the shader writes transparency.
 *     Zero readbacks, zero decode on the main thread — the dance keeps every
 *     frame, and the walk is silk.
 */

const SRC = '/assets/avatar-walk.mp4';
const CW = 405;
const CH = 720;
const FAILSAFE_MS = 8000; // the loader must never be held hostage

const VS = `
  attribute vec2 p;
  varying vec2 v;
  void main() { v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }
`;
// Same key curve as the CPU version: transparent above g−max(r,b) ≈ 38/255,
// soft edge from ≈12/255, despill the green fringe. Premultiplied output.
const FS = `
  precision mediump float;
  varying vec2 v;
  uniform sampler2D t;
  void main() {
    vec4 c = texture2D(t, v);
    float m = c.g - max(c.r, c.b);
    float a = 1.0 - smoothstep(0.047, 0.149, m);
    c.g = mix(c.g, max(c.r, c.b), smoothstep(0.02, 0.12, m));
    gl_FragColor = vec4(c.rgb * a, a);
  }
`;

interface Keyer {
  draw: (video: HTMLVideoElement) => void;
}

function initKeyer(canvas: HTMLCanvasElement): Keyer | null {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true, // the final pose persists after the loop stops
    antialias: false,
  });
  if (!gl) return null;
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VS);
  const fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.viewport(0, 0, CW, CH);
  return {
    draw(video: HTMLVideoElement) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
  };
}

export default function AvatarIntro() {
  const phase = useExperience((s) => s.phase);
  const reduced = useExperience((s) => s.reducedMotion);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [countInDone, setCountInDone] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const started = useRef(false);
  const rafRef = useRef(0);

  // He waits in the wings until the three bounces have landed (§ user spec —
  // the walk-in was stealing attention from the count-in). The frame loop
  // flips loadSignal.countInDone at beat 4; we poll it cheaply. The 10s
  // backstop makes a deadlock impossible even if the flag were never set.
  useEffect(() => {
    if (phase === 'overture' || countInDone) return;
    const startedAt = performance.now();
    const id = window.setInterval(() => {
      if (loadSignal.countInDone || performance.now() - startedAt > 10000) {
        setCountInDone(true);
        window.clearInterval(id);
      }
    }, 120);
    return () => window.clearInterval(id);
  }, [phase, countInDone]);

  const active = phase !== 'overture' && countInDone;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    // Phones: no avatar anywhere (landing OR journey). Release the loader gate
    // exactly as the asset-absent fallback does and run nothing else — the
    // count-in and burst stay byte-identical to a missing-avatar load, and the
    // walk clip is never fetched (the <video> isn't rendered on mobile below).
    if (mobile) {
      loadSignal.avatarProgress = 1;
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const keyer = canvas ? initKeyer(canvas) : null;
    if (!video || !canvas || !keyer) {
      loadSignal.avatarProgress = 1; // never gate the loader without an avatar
      setFailed(true);
      return;
    }

    const failsafe = window.setTimeout(() => {
      if (loadSignal.avatarProgress < 1) loadSignal.avatarProgress = 1;
    }, FAILSAFE_MS);

    const fail = () => {
      // hard error only (missing/corrupt asset) — hide entirely
      loadSignal.avatarProgress = 1;
      setFailed(true);
    };
    const drawOnce = () => {
      try {
        keyer.draw(video);
        setVisible(true);
      } catch {
        /* ignore */
      }
    };
    const showFinalPose = () => {
      // playback refused (strict autoplay policies, throttled tabs…):
      // static folded-hands pose, loader released.
      loadSignal.avatarProgress = 1;
      const seekEnd = () => {
        video.currentTime = Math.max(0, (video.duration || 5) - 0.05);
      };
      video.addEventListener('seeked', drawOnce, { once: true });
      if (video.readyState >= 1) seekEnd();
      else video.addEventListener('loadedmetadata', seekEnd, { once: true });
    };
    const finish = () => {
      drawOnce(); // freeze the folded-hands final pose (preserveDrawingBuffer)
      loadSignal.avatarProgress = 1;
      cancelAnimationFrame(rafRef.current);
    };
    const onPause = () => {
      if (!video.ended && loadSignal.avatarProgress < 1) showFinalPose();
    };
    video.addEventListener('error', fail);
    video.addEventListener('ended', finish);
    video.addEventListener('pause', onPause);

    if (reduced) {
      showFinalPose();
    } else {
      let lastT = -1;
      const loop = () => {
        // Upload only when the video has a NEW frame — halves the GPU uploads
        // for a 30fps clip on a 60Hz display. Never a readback, never a stall.
        if (video.readyState >= 2 && video.currentTime !== lastT) {
          lastT = video.currentTime;
          keyer.draw(video);
          setVisible(true);
          if (!video.ended && video.duration > 0) {
            loadSignal.avatarProgress = Math.max(
              loadSignal.avatarProgress,
              Math.min(0.995, video.currentTime / video.duration),
            );
          }
        }
        if (!video.ended) rafRef.current = requestAnimationFrame(loop);
      };
      void video
        .play()
        .then(() => {
          rafRef.current = requestAnimationFrame(loop);
        })
        .catch(showFinalPose);
    }

    return () => {
      window.clearTimeout(failsafe);
      video.removeEventListener('error', fail);
      video.removeEventListener('ended', finish);
      video.removeEventListener('pause', onPause);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, reduced, mobile]);

  // Phones render nothing at all — not even the hidden <video>, so the walk clip
  // isn't fetched — and the loader gate was already released in the effect above.
  // Desktop keeps the corner presence for the whole journey (unchanged).
  if (mobile) return null;

  return (
    <>
      <video ref={videoRef} src={SRC} muted playsInline preload="auto" style={{ display: 'none' }} />
      {active && !failed && (
        <motion.div
          initial={{ opacity: 0, x: 22 }}
          animate={{ opacity: visible ? 0.97 : 0, x: visible ? 0 : 22 }}
          transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          aria-hidden="true"
          style={{
            position: 'fixed',
            right: 'clamp(10px, 2.5vw, 40px)',
            bottom: 0,
            // z 1: above the glass canvas (later in DOM), below journey text
            // (z 2) and the HUD (z 3) — behind the toggle, never blocks it.
            zIndex: 1,
            pointerEvents: 'none',
            // Desktop: head reaches ~half the screen. Corner presence.
            height: 'min(56vh, 660px)',
            aspectRatio: '9 / 16',
            filter: 'drop-shadow(0 14px 34px rgba(0,0,0,0.55))',
          }}
        >
          <canvas ref={canvasRef} width={CW} height={CH} style={{ width: '100%', height: '100%', display: 'block' }} />
        </motion.div>
      )}
    </>
  );
}
