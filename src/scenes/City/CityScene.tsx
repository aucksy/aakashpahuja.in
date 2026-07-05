import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperience } from '@/store/useExperience';
import { loadSignal } from '@/scenes/Landing/loadSignal';
import { lerp } from '@/lib/color';

/**
 * The REAL 3D city (§12 SC-03+, §13). A procedural neon street built from
 * instanced window-lit towers, a rain-dark road with neon edge strips, glowing
 * signs, stars and the city.avif skyline as the far matte painting. The camera
 * physically DRIVES down the street: scroll = distance travelled. Exponential
 * fog swallows the far end so the world materialises as you move — content
 * reveals itself along the way.
 */

const LENGTH = 620; // metres of street the full journey covers
const ROAD_HALF = 8.2;

// ---- palettes ---------------------------------------------------------------
const NIGHT = {
  fog: new THREE.Color('#0a0718'),
  fogDensity: 0.0085,
  star: '#cfe2ff',
  windowTint: new THREE.Color('#ffffff'),
  stripL: '#5de5e0',
  stripR: '#ff5db1',
  signs: ['#5de5e0', '#8b7bf7', '#ff5db1', '#ffb14e', '#37d29b', '#7c9bff'],
};
const DAY = {
  fog: new THREE.Color('#f2d7bf'),
  fogDensity: 0.006,
  star: '#ffffff',
  windowTint: new THREE.Color('#ffe4c9'),
  stripL: '#ff8a5b',
  stripR: '#ffc14e',
  signs: ['#ff8a5b', '#ffc14e', '#ff7a9c', '#7c9bff', '#5bd6b0', '#c07aff'],
};

// ---- helpers ----------------------------------------------------------------

/** One shared 64×128 "lit windows at night" texture per building batch. */
function windowTexture(colors: string[], litProb: number, seed: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#06080f';
  g.fillRect(0, 0, 64, 128);
  let rnd = seed;
  const rand = () => {
    rnd = (rnd * 16807) % 2147483647;
    return rnd / 2147483647;
  };
  const cols = 6;
  const rows = 16;
  const cw = 64 / cols;
  const ch = 128 / rows;
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if (rand() < litProb) {
        g.fillStyle = colors[(rand() * colors.length) | 0];
        g.globalAlpha = 0.3 + rand() * 0.7;
        g.fillRect(x * cw + 1.5, y * ch + 1.5, cw - 3, ch - 3);
      }
    }
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

interface BuildingBatch {
  texture: THREE.CanvasTexture;
  matrices: THREE.Matrix4[];
}

function buildBatches(count: number): BuildingBatch[] {
  let rnd = 1337;
  const rand = () => {
    rnd = (rnd * 16807) % 2147483647;
    return rnd / 2147483647;
  };
  const dummy = new THREE.Object3D();
  const batches: BuildingBatch[] = [0, 1, 2].map((i) => ({
    texture: windowTexture(NIGHT.signs, 0.24 + i * 0.05, 1000 + i * 77),
    matrices: [],
  }));
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const w = 8 + rand() * 14;
    const h = 16 + rand() * 62;
    const d = 8 + rand() * 14;
    const x = side * (ROAD_HALF + 3 + w / 2 + rand() * 26);
    const z = -60 + rand() * (LENGTH + 320);
    dummy.position.set(x, h / 2 - 0.5, z);
    dummy.scale.set(w, h, d);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    batches[i % 3].matrices.push(dummy.matrix.clone());
  }
  return batches;
}

interface Sign {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  colorIdx: number;
  phase: number;
}

function buildSigns(count: number): Sign[] {
  let rnd = 4242;
  const rand = () => {
    rnd = (rnd * 16807) % 2147483647;
    return rnd / 2147483647;
  };
  const out: Sign[] = [];
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    out.push({
      x: side * (ROAD_HALF + 2.2 + rand() * 4),
      y: 3.5 + rand() * 15,
      z: 6 + rand() * (LENGTH + 120),
      w: 1.6 + rand() * 3.4,
      h: 0.8 + rand() * 1.8,
      colorIdx: (rand() * 6) | 0,
      phase: rand() * 6.28,
    });
  }
  return out;
}

// ---- the scene ----------------------------------------------------------------

export default function CityScene() {
  const quality = useExperience((s) => s.quality);
  const skyTex = useLoader(THREE.TextureLoader, '/assets/city.avif');
  skyTex.colorSpace = THREE.SRGBColorSpace;

  const buildingCount = quality === 'low' ? 110 : 200;
  const batches = useMemo(() => buildBatches(buildingCount), [buildingCount]);
  const signs = useMemo(() => buildSigns(quality === 'low' ? 10 : 18), [quality]);

  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([null, null, null]);
  const signMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const stripMats = useRef<(THREE.MeshBasicMaterial | null)[]>([null, null]);
  const winMats = useRef<(THREE.MeshBasicMaterial | null)[]>([null, null, null]);
  const skyRef = useRef<THREE.Mesh>(null);
  const fogRef = useRef(new THREE.FogExp2(NIGHT.fog.clone(), NIGHT.fogDensity));
  const rt = useRef({ ptrX: 0.5, themeMix: useExperience.getState().theme === 'light' ? 1 : 0 });

  // instanced matrices
  useEffect(() => {
    batches.forEach((b, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      b.matrices.forEach((m, j) => mesh.setMatrixAt(j, m));
      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [batches]);

  // cursor sway
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      rt.current.ptrX = e.clientX / window.innerWidth;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const stars = useMemo(() => {
    const n = 500;
    const pos = new Float32Array(n * 3);
    let rnd = 777;
    const rand = () => {
      rnd = (rnd * 16807) % 2147483647;
      return rnd / 2147483647;
    };
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rand() - 0.5) * 800;
      pos[i * 3 + 1] = 50 + rand() * 240;
      pos[i * 3 + 2] = -150 + rand() * (LENGTH + 500);
    }
    return pos;
  }, []);

  useFrame(({ camera, scene, clock }) => {
    const st = useExperience.getState();
    const t = clock.elapsedTime;
    const s = rt.current;

    // theme cross-grade (golden-hour sweep reaches the city too)
    s.themeMix += ((st.theme === 'light' ? 1 : 0) - s.themeMix) * 0.04;
    const mix = s.themeMix;
    fogRef.current.color.lerpColors(NIGHT.fog, DAY.fog, mix);
    fogRef.current.density = lerp(NIGHT.fogDensity, DAY.fogDensity, mix);
    scene.fog = fogRef.current;
    if (!(scene.background instanceof THREE.Color)) scene.background = new THREE.Color();
    (scene.background as THREE.Color).copy(fogRef.current.color);
    winMats.current.forEach((m) => m?.color.lerpColors(NIGHT.windowTint, DAY.windowTint, mix));

    // THE DRIVE — scroll is distance down the street (§13)
    const z = st.scroll * LENGTH;
    const sway = st.reducedMotion ? 0 : (s.ptrX - 0.5) * 2.4;
    const breathe = st.reducedMotion ? 0 : Math.sin(t * 0.5) * 0.12;
    camera.position.set(sway, 5.4 + breathe, z);
    camera.lookAt(sway * 0.35, 5.1, z + 42);

    // skyline matte rides ahead of the camera, outside the fog
    if (skyRef.current) {
      skyRef.current.position.set(sway * -6, 46, z + 330);
      const m = skyRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = lerp(0.92, 0.55, mix);
    }

    // neon signs breathe with the music (loadSignal.overall is fed by the
    // audio loop — never call audio.bands() twice a frame, it owns beat state)
    const energy = 0.72 + loadSignal.overall * 0.55;
    signMats.current.forEach((m, i) => {
      if (!m) return;
      const sg = signs[i];
      if (!sg) return;
      const flicker = 0.9 + 0.1 * Math.sin(t * 2.2 + sg.phase);
      const palette = mix < 0.5 ? NIGHT.signs : DAY.signs;
      m.color.set(palette[sg.colorIdx]);
      m.color.multiplyScalar(energy * flicker);
    });
    stripMats.current.forEach((m, i) => {
      if (!m) return;
      m.color.set(i === 0 ? (mix < 0.5 ? NIGHT.stripL : DAY.stripL) : mix < 0.5 ? NIGHT.stripR : DAY.stripR);
      m.color.multiplyScalar(0.85 + loadSignal.overall * 0.5);
    });
  });

  return (
    <group>
      {/* towers — three instanced batches with different window textures */}
      {batches.map((b, i) => (
        <instancedMesh
          key={i}
          ref={(m) => {
            meshRefs.current[i] = m;
          }}
          args={[undefined, undefined, b.matrices.length]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            ref={(m) => {
              winMats.current[i] = m;
            }}
            map={b.texture}
          />
        </instancedMesh>
      ))}

      {/* the road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, LENGTH / 2]}>
        <planeGeometry args={[ROAD_HALF * 2, LENGTH + 500]} />
        <meshBasicMaterial color="#05060c" />
      </mesh>
      {/* sidewalks */}
      {[-1, 1].map((side) => (
        <mesh key={side} rotation={[-Math.PI / 2, 0, 0]} position={[side * (ROAD_HALF + 2.6), 0.02, LENGTH / 2]}>
          <planeGeometry args={[5.2, LENGTH + 500]} />
          <meshBasicMaterial color="#0a0d18" />
        </mesh>
      ))}
      {/* neon edge strips — the rain-slick glow lines that carry the drive */}
      {[-1, 1].map((side, i) => (
        <mesh key={side} position={[side * ROAD_HALF, 0.05, LENGTH / 2]}>
          <boxGeometry args={[0.16, 0.06, LENGTH + 500]} />
          <meshBasicMaterial
            ref={(m) => {
              stripMats.current[i] = m;
            }}
            color={i === 0 ? NIGHT.stripL : NIGHT.stripR}
          />
        </mesh>
      ))}
      {/* centre dashes */}
      {Array.from({ length: Math.floor((LENGTH + 400) / 12) }, (_, i) => (
        <mesh key={i} position={[0, 0.03, -40 + i * 12]}>
          <boxGeometry args={[0.22, 0.02, 3.2]} />
          <meshBasicMaterial color="#39415e" />
        </mesh>
      ))}

      {/* neon signs */}
      {signs.map((sg, i) => (
        <mesh key={i} position={[sg.x, sg.y, sg.z]} rotation={[0, (sg.x < 0 ? 1 : -1) * Math.PI * 0.5, 0]}>
          <planeGeometry args={[sg.w, sg.h]} />
          <meshBasicMaterial
            ref={(m) => {
              signMats.current[i] = m;
            }}
            color={NIGHT.signs[sg.colorIdx]}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial color={NIGHT.star} size={0.9} sizeAttenuation transparent opacity={0.8} />
      </points>

      {/* far skyline — the definitive city.avif matte, exempt from fog */}
      <mesh ref={skyRef} position={[0, 46, 330]}>
        <planeGeometry args={[720, 340]} />
        <meshBasicMaterial map={skyTex} transparent opacity={0.92} fog={false} depthWrite={false} />
      </mesh>
    </group>
  );
}
