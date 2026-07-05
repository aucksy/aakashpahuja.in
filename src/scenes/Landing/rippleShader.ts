// The signature liquid-glass ripple — a GLSL fragment shader (§16.1, §20).
// DOM filters can't do same-colour optical refraction; this must be a shader.
//
// Ported verbatim from the canonical `mountRipple` prototype in the Experience
// Blueprint. Only the vertex stage was adapted for a three.js fullscreen quad:
// three injects `position`/`uv` attributes, so we output clip-space directly and
// flip V to put (0,0) at the top-left — matching the pointer + object space and
// the CanvasTexture (which we upload with flipY=false).
//
// What the fragment does, in order:
//   1. hgt()     — sum of decaying sine-ring height sources (the wipe waves) +
//                  a faint idle breathing ripple.
//   2. clarity() — condensation mask: cleared under the cursor / recent wipes /
//                  the global `u_clear` pulse, re-frosting over time.
//   3. refraction — displace scene UVs by the height gradient (same-colour, no
//                   tint — expensive optical glass, not water).
//   4. blur       — 5×5 box blur that tightens where the glass is clear.
//   5. chromatic aberration, frost mix, specular glint, vignette.

export const MAX = 12; // max simultaneous ripple sources (ring buffer)

export const vertexShader = /* glsl */ `
  varying vec2 v_uv;
  void main() {
    v_uv = vec2(uv.x, 1.0 - uv.y);
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  varying vec2 v_uv;
  uniform sampler2D u_tex;
  uniform sampler2D u_trail; // wipe-trail clarity accumulation (alpha channel)
  uniform vec2 u_res;
  uniform float u_time;
  uniform vec2 u_ptr;
  uniform float u_ptrOn;
  uniform float u_clear;
  uniform vec3 u_frost;
  uniform vec2 u_orig[${MAX}];
  uniform float u_age[${MAX}];
  uniform float u_amp[${MAX}];
  uniform float u_fade; // 1 = opaque glass overlay · 0 = dissolved into the 3D city
  uniform float u_rest; // scene-through at rest — theme-tuned (dark hides more)

  float hgt(vec2 q) {
    float h = 0.0;
    for (int i = 0; i < ${MAX}; i++) {
      if (u_age[i] >= 0.0) {
        float d = distance(q, u_orig[i]);
        float t = u_age[i];
        float r = t * 0.30;
        float e = exp(-t * 1.4) * exp(-pow((d - r) / 0.12, 2.0));
        h += sin((d - r) * 38.0) * e * u_amp[i];
      }
    }
    h += 0.011 * sin(q.x * 10.0 + u_time * 0.5) * sin(q.y * 8.0 - u_time * 0.45);
    return h * 0.72;
  }

  float clarity(vec2 q) {
    // Persistent wipe trail: painted at the pointer on the CPU, re-frosting
    // exponentially — this is what makes a swipe leave a long clear path.
    float c = texture2D(u_trail, q).a;
    for (int i = 0; i < ${MAX}; i++) {
      if (u_age[i] >= 0.0) {
        float t = u_age[i];
        float d = distance(q, u_orig[i]);
        c = max(c, exp(-t * 1.1) * smoothstep(0.16, 0.0, d));
      }
    }
    float dP = distance(q, u_ptr);
    c = max(c, u_ptrOn * smoothstep(0.17, 0.0, dP));
    c = max(c, u_clear);
    return clamp(c, 0.0, 1.0);
  }

  void main() {
    vec2 uv = v_uv;
    uv.x += 0.0035 * sin(v_uv.y * 8.0 + u_time * 0.5);
    uv.y += 0.0035 * cos(v_uv.x * 7.0 + u_time * 0.4);
    vec2 e = vec2(1.5 / u_res.x, 1.5 / u_res.y);
    float hx = hgt(v_uv + vec2(e.x, 0.0)) - hgt(v_uv - vec2(e.x, 0.0));
    float hy = hgt(v_uv + vec2(0.0, e.y)) - hgt(v_uv - vec2(0.0, e.y));
    vec2 grad = vec2(hx, hy);
    float cl = clarity(v_uv);
    vec2 suv = uv - grad * (0.35 + cl * 0.5);
    float blur = mix(3.0, 0.28, cl) / u_res.y;
    vec3 col = vec3(0.0);
    float w = 0.0;
    for (int j = -2; j <= 2; j++) {
      for (int k = -2; k <= 2; k++) {
        vec2 o = vec2(float(j), float(k)) * blur;
        col += texture2D(u_tex, suv + o).rgb;
        w += 1.0;
      }
    }
    col /= w;
    vec3 c2 = col;
    c2.r = texture2D(u_tex, suv + grad * 0.012).r;
    c2.b = texture2D(u_tex, suv - grad * 0.012).b;
    col = mix(col, c2, 0.5);
    // Frost opacity: heavily frosted at rest — the world is HIDDEN except where
    // the cursor/finger wipes (~90% clear trail), then it re-frosts. u_rest is
    // theme-tuned: dark frost is dark, so it needs a lower floor than light's
    // milky white to conceal equally well.
    col = mix(u_frost, col, mix(u_rest, 0.92, cl));
    float spec = pow(clamp(length(grad) * 8.0, 0.0, 1.0), 1.5);
    col += spec * 0.10 * cl;
    float vig = smoothstep(1.15, 0.25, distance(v_uv, vec2(0.5)));
    col *= mix(0.82, 1.05, vig);
    gl_FragColor = vec4(col, u_fade);
  }
`;
