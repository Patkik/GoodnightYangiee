import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/appStore.js';

// ─── Texture Helpers ──────────────────────────────────────────────────────────
function createStarFlareTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0,   '#FFFFFF');
  g.addColorStop(0.2, 'rgba(255, 240, 200, 0.95)');
  g.addColorStop(0.5, 'rgba(244, 208, 63, 0.5)');
  g.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);

  ctx.save(); ctx.translate(64, 64);
  for (let a = 0; a < 4; a++) {
    ctx.rotate(a * Math.PI / 4);
    const rg = ctx.createLinearGradient(-56, 0, 56, 0);
    rg.addColorStop(0, 'rgba(255,255,255,0)');
    rg.addColorStop(0.5, 'rgba(255,255,255,0.9)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(-56, -1.5, 112, 3);
  }
  ctx.restore();
  return new THREE.CanvasTexture(c);
}

function createGlowHaloTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(244, 208, 63, 0.7)');
  g.addColorStop(0.4, 'rgba(203, 166, 247, 0.3)');
  g.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// ─── Procedural Earth Textures by Time of Day ─────────────────────────────────
function createMorningTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 512, 256);
  g.addColorStop(0,    '#FFD580');
  g.addColorStop(0.25, '#FF9A3C');
  g.addColorStop(0.55, '#4A90D9');
  g.addColorStop(0.8,  '#1E4D8C');
  g.addColorStop(1,    '#0D2B5E');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = 'rgba(60, 140, 80, 0.75)';
  [[80,120,90,55],[200,80,120,60],[310,130,80,50],[400,90,100,65]].forEach(([x,y,w,h]) => {
    ctx.beginPath(); ctx.ellipse(x,y,w,h,0.4,0,Math.PI*2); ctx.fill();
  });

  ctx.fillStyle = 'rgba(255, 252, 230, 0.35)';
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * 512, y = Math.random() * 256;
    ctx.beginPath(); ctx.ellipse(x, y, 30 + Math.random()*55, 10 + Math.random()*20, 0, 0, Math.PI*2); ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}

function createAfternoonTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 512, 256);
  g.addColorStop(0,   '#1A8FE3');
  g.addColorStop(0.5, '#1B6FB5');
  g.addColorStop(1,   '#0D4A8C');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = 'rgba(55, 150, 75, 0.85)';
  [[90,100,100,60],[260,90,130,70],[390,110,90,50],[60,180,110,55]].forEach(([x,y,w,h]) => {
    ctx.beginPath(); ctx.ellipse(x,y,w,h,0.3,0,Math.PI*2); ctx.fill();
  });

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  for (let i = 0; i < 18; i++) {
    const x = Math.random()*512, y = Math.random()*256;
    ctx.beginPath(); ctx.ellipse(x,y,25+Math.random()*50,8+Math.random()*18,0,0,Math.PI*2); ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}

function createEveningTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 512, 256);
  g.addColorStop(0,    '#2D1B69');
  g.addColorStop(0.3,  '#8B4513');
  g.addColorStop(0.55, '#D4520A');
  g.addColorStop(0.75, '#8B3A8B');
  g.addColorStop(1,    '#1A0A2E');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = 'rgba(20, 50, 30, 0.8)';
  [[90,100,100,60],[270,90,120,65],[400,110,85,50]].forEach(([x,y,w,h]) => {
    ctx.beginPath(); ctx.ellipse(x,y,w,h,0.4,0,Math.PI*2); ctx.fill();
  });

  ctx.fillStyle = 'rgba(255, 220, 120, 0.85)';
  for (let i = 0; i < 40; i++) {
    const x = Math.random()*512, y = Math.random()*256;
    ctx.beginPath(); ctx.arc(x,y,1+Math.random()*2,0,Math.PI*2); ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}

function createNightTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 512, 256);
  g.addColorStop(0, '#0A0D1C');
  g.addColorStop(0.5, '#080B18');
  g.addColorStop(1, '#04060F');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = 'rgba(15, 35, 55, 0.9)';
  [[90,100,100,60],[270,90,120,65],[400,110,85,50],[60,180,100,55]].forEach(([x,y,w,h]) => {
    ctx.beginPath(); ctx.ellipse(x,y,w,h,0.4,0,Math.PI*2); ctx.fill();
  });

  ctx.fillStyle = 'rgba(255, 230, 140, 0.9)';
  for (let i = 0; i < 80; i++) {
    const x = Math.random()*512, y = Math.random()*256;
    ctx.beginPath(); ctx.arc(x,y,0.8+Math.random()*1.8,0,Math.PI*2); ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}

// ─── Time-of-day planet config ─────────────────────────────────────────────────
const TOD_CONFIG = {
  morning:   { createTex: createMorningTexture,   emissive: '#FFAA44', emissiveInt: 0.5,  roughness: 0.35, metalness: 0.2, atmoColor: 'vec4(1.0, 0.65, 0.25, 1.0)' },
  afternoon: { createTex: createAfternoonTexture,  emissive: '#88CCFF', emissiveInt: 0.25, roughness: 0.4,  metalness: 0.1, atmoColor: 'vec4(0.35, 0.7, 1.0, 1.0)' },
  evening:   { createTex: createEveningTexture,    emissive: '#CC4400', emissiveInt: 0.4,  roughness: 0.5,  metalness: 0.1, atmoColor: 'vec4(0.85, 0.35, 0.1, 1.0)' },
  night:     { createTex: createNightTexture,      emissive: '#001133', emissiveInt: 0.15, roughness: 0.7,  metalness: 0.05, atmoColor: 'vec4(0.2, 0.55, 0.7, 1.0)' },
};

// ─── Celestial Planet Component ───────────────────────────────────────────────
function CelestialPlanet({ timeOfDay, onClick }) {
  const meshRef = useRef();
  const atmoRef = useRef();
  const cfg = TOD_CONFIG[timeOfDay] ?? TOD_CONFIG.night;
  const { viewport } = useThree();

  const planetTexture = useMemo(() => cfg.createTex(), [cfg]);

  const atmoShader = useMemo(() => ({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
        gl_FragColor = ${cfg.atmoColor} * intensity * 1.4;
      }
    `,
  }), [cfg]);

  const planetY = useMemo(() => Math.min(viewport.height * 0.26, 2.8), [viewport.height]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0018;
      meshRef.current.rotation.x = Math.sin(t * 0.15) * 0.03;
    }
  });

  return (
    <group position={[0, planetY, 0]}>
      {/* Interactive Planet Sphere */}
      <mesh ref={meshRef} onClick={onClick} castShadow cursor="pointer">
        <sphereGeometry args={[2.2, 48, 48]} />
        <meshStandardMaterial
          map={planetTexture}
          roughness={cfg.roughness}
          metalness={cfg.metalness}
          emissive={cfg.emissive}
          emissiveIntensity={cfg.emissiveInt}
        />
      </mesh>
      {/* Corona Atmosphere Glow */}
      <mesh ref={atmoRef}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <shaderMaterial
          args={[atmoShader]}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent
        />
      </mesh>
    </group>
  );
}

// ─── Constellation Star Nodes ────────────────────────────────────────────────
const STAR_MEMORIES = [
  "Every late night conversation with you feels like discovering a brand new star.",
  "Your laugh is my favorite melody in the whole universe, Yangiee.",
  "No matter how noisy the day gets, thinking of you brings peace.",
  "I wished upon every shooting star that your days are full of joy.",
  "You shine brighter than any constellation in the night sky.",
];

function ConstellationNodes() {
  const showToast = useAppStore(s => s.showToast);
  const flareTexture = useMemo(() => createStarFlareTexture(), []);
  const haloTexture  = useMemo(() => createGlowHaloTexture(), []);
  const { viewport }  = useThree();

  const W = Math.min(viewport.width  * 0.44, 4.8);
  const H = Math.min(viewport.height * 0.36, 4.2);

  const nodes = useMemo(() => [
    { pos: [-W,     H * 0.6, 2.5], idx: 0 },
    { pos: [-W*0.4, H,       1.5], idx: 1 },
    { pos: [ W*0.6, H * 0.8, 3.0], idx: 2 },
    { pos: [ W,     H * 0.0, 2.0], idx: 3 },
    { pos: [ W*0.2,-H * 0.7, 3.5], idx: 4 },
  ], [W, H]);

  const groupRefs = useRef([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    groupRefs.current.forEach((g, i) => {
      if (!g) return;
      g.rotation.y += 0.008;
      g.rotation.x = Math.sin(t * 1.2 + i) * 0.08;
      g.position.y = nodes[i].pos[1] + Math.sin(t * 1.0 + i * 0.9) * 0.12;
    });
  });

  const lineGeo = useMemo(() => {
    const pts = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      pts.push(new THREE.Vector3(...nodes[i].pos));
      pts.push(new THREE.Vector3(...nodes[i + 1].pos));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [nodes]);

  return (
    <group>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial color="#45A29E" transparent opacity={0.35} />
      </lineSegments>
      {nodes.map((n, i) => (
        <group
          key={i}
          position={n.pos}
          ref={el => (groupRefs.current[i] = el)}
          onClick={(e) => { e.stopPropagation(); showToast(STAR_MEMORIES[i]); }}
        >
          <mesh>
            <octahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial
              color="#FFF5D0"
              emissive="#F4D03F"
              emissiveIntensity={0.9}
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
          <sprite scale={[1.7, 1.7, 1.7]}>
            <spriteMaterial map={flareTexture} blending={THREE.AdditiveBlending} transparent opacity={0.9} />
          </sprite>
          <sprite scale={[2.5, 2.5, 2.5]}>
            <spriteMaterial map={haloTexture} blending={THREE.AdditiveBlending} transparent opacity={0.4} />
          </sprite>
        </group>
      ))}
    </group>
  );
}

// ─── Multi-directional Crash-Proof Comet System ──────────────────────────────
const MAX_ACTIVE_COMETS = 3;
const SEGMENTS_PER_COMET = 12;

function CometSystem() {
  const { viewport } = useThree();
  const comets = useRef([]);
  const spawnTimer = useRef(0);
  const lineRef = useRef();

  const totalPoints = MAX_ACTIVE_COMETS * SEGMENTS_PER_COMET * 2;
  const positions = useMemo(() => new Float32Array(totalPoints * 3), [totalPoints]);

  useFrame((_, delta) => {
    spawnTimer.current += delta;

    // Spawn new comet every 3.5s
    if (spawnTimer.current > 3.5 && comets.current.length < MAX_ACTIVE_COMETS) {
      spawnTimer.current = 0;
      const W = viewport.width  * 0.6;
      const H = viewport.height * 0.5;

      const mode = Math.floor(Math.random() * 4);
      let x, y, vx, vy;
      if (mode === 0) {
        x = -W * (0.7 + Math.random() * 0.4); y = H * (0.6 + Math.random() * 0.5);
        vx = 0.06 + Math.random() * 0.04; vy = -(0.03 + Math.random() * 0.03);
      } else if (mode === 1) {
        x = W * (0.7 + Math.random() * 0.4); y = H * (0.6 + Math.random() * 0.5);
        vx = -(0.06 + Math.random() * 0.04); vy = -(0.03 + Math.random() * 0.03);
      } else if (mode === 2) {
        x = -W * 1.1; y = H * (0.2 + Math.random() * 0.6);
        vx = 0.07 + Math.random() * 0.03; vy = -(0.02 + Math.random() * 0.03);
      } else {
        x = W * 1.1; y = H * (0.2 + Math.random() * 0.6);
        vx = -(0.07 + Math.random() * 0.03); vy = -(0.02 + Math.random() * 0.03);
      }

      comets.current.push({ x, y, vx, vy, life: 0, maxLife: 140, history: [] });
    }

    // Update active comets
    comets.current = comets.current.filter(c => c.life < c.maxLife);

    // Zero out positions array
    positions.fill(0);
    let ptIdx = 0;

    comets.current.forEach(c => {
      c.x += c.vx;
      c.y += c.vy;
      c.life++;
      c.history.push({ x: c.x, y: c.y });
      if (c.history.length > SEGMENTS_PER_COMET) c.history.shift();

      for (let k = 0; k < c.history.length - 1; k++) {
        const p1 = c.history[k];
        const p2 = c.history[k + 1];

        positions[ptIdx * 3]     = p1.x;
        positions[ptIdx * 3 + 1] = p1.y;
        positions[ptIdx * 3 + 2] = -4;

        positions[ptIdx * 3 + 3] = p2.x;
        positions[ptIdx * 3 + 4] = p2.y;
        positions[ptIdx * 3 + 5] = -4;

        ptIdx += 2;
      }
    });

    if (lineRef.current && lineRef.current.geometry.attributes.position) {
      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#F9E2AF" transparent opacity={0.7} linewidth={1.5} />
    </lineSegments>
  );
}

// ─── Camera Rig ───────────────────────────────────────────────────────────────
function CameraRig({ isKiroMode }) {
  const { camera, viewport } = useThree();
  const isTelescopeActive = useAppStore(s => s.isTelescopeActive);
  const telescopePan = useAppStore(s => s.telescopePan);

  useFrame((_, delta) => {
    const aspect = viewport.width / viewport.height;
    const baseZ = 14;

    if (isTelescopeActive) {
      const destX = -telescopePan.x * 0.05;
      const destY = -telescopePan.y * 0.05;
      camera.position.lerp(new THREE.Vector3(destX, destY + 0.5, 8), delta * 3.5);
      camera.lookAt(destX, destY + 0.5, 0);
    } else {
      const targetZ = isKiroMode ? 0.1 : Math.max(baseZ, Math.min(22, baseZ * (1 / Math.max(aspect, 0.45))));
      const dest = isKiroMode
        ? new THREE.Vector3(0, 0, 0.1)
        : new THREE.Vector3(0, 0.5, targetZ);
      camera.position.lerp(dest, delta * 2.2);
      camera.lookAt(0, 0.5, 0);
    }
  });

  return null;
}

// ─── Deep Space Telescope 3D Objects Group ───────────────────────────────────
function TelescopeGroup() {
  const isTelescopeActive = useAppStore(s => s.isTelescopeActive);
  const telescopePan = useAppStore(s => s.telescopePan);
  const setLockedTarget = useAppStore(s => s.setLockedTarget);
  const galaxyRef = useRef();

  const galaxyParticles = useMemo(() => {
    const count = 1200;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = ['#CBA6F7', '#94E2D5', '#F9E2AF', '#F5C2E7'];

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 8 + 0.5;
      const spinAngle = radius * 1.5;
      const branchAngle = ((i % 3) * (2 * Math.PI)) / 3;

      const x = Math.cos(spinAngle + branchAngle) * radius + (Math.random() - 0.5) * 0.5;
      const y = (Math.random() - 0.5) * 0.8;
      const z = Math.sin(spinAngle + branchAngle) * radius + (Math.random() - 0.5) * 0.5;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const c = new THREE.Color(palette[i % palette.length]);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { pos, colors };
  }, []);

  const targets = useMemo(() => [
    {
      id: 'galaxy',
      pos: new THREE.Vector3(-15, 12, -40),
      title: 'Secret Heart Galaxy',
      body: 'A majestic deep space spiral galaxy hidden beyond visible light. Its spiral arms shine with 1,200 glowing starlight particles created from eternal love for Yangiee.',
      icon: '🌌',
      catalog: 'CATALOG: HY-2026 • 12,000 LIGHT YEARS',
    },
    {
      id: 'planet_yangiee',
      pos: new THREE.Vector3(18, -10, -45),
      title: 'Planet Yangiee',
      body: 'An otherworldly celestial world with glowing teal oceans and violet rings, reflecting Yangiee’s radiant aura.',
      icon: '🪐',
      catalog: 'CATALOG: PY-8090 • 4,800 LIGHT YEARS',
    },
    {
      id: 'heart_constellation',
      pos: new THREE.Vector3(0, 22, -35),
      title: 'Constellation of Eternal Love',
      body: 'An ancient star cluster shaped like a heart, pulsing with starlight across the galaxy whenever Patrick thinks of Yangiee.',
      icon: '💖',
      catalog: 'CATALOG: LC-1024 • 8,500 LIGHT YEARS',
    },
  ], []);

  useFrame((_, delta) => {
    if (!isTelescopeActive) return;
    if (galaxyRef.current) {
      galaxyRef.current.rotation.y += delta * 0.15;
    }

    const panVec = new THREE.Vector3(-telescopePan.x * 0.05, -telescopePan.y * 0.05, 0);
    let nearest = null;
    let minDist = 3.5;

    targets.forEach(t => {
      const dist = panVec.distanceTo(new THREE.Vector3(t.pos.x * 0.2, t.pos.y * 0.2, 0));
      if (dist < minDist) {
        minDist = dist;
        nearest = t;
      }
    });

    setLockedTarget(nearest);
  });

  if (!isTelescopeActive) return null;

  return (
    <group>
      {/* 1. Spiral Galaxy */}
      <group position={[-15, 12, -40]} ref={galaxyRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[galaxyParticles.pos, 3]} />
            <bufferAttribute attach="attributes-color" args={[galaxyParticles.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.6} vertexColors transparent opacity={0.95} />
        </points>
      </group>

      {/* 2. Planet Yangiee */}
      <group position={[18, -10, -45]}>
        <mesh>
          <sphereGeometry args={[3.2, 32, 32]} />
          <meshStandardMaterial color="#94E2D5" emissive="#114444" roughness={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <ringGeometry args={[4.2, 6.5, 32]} />
          <meshBasicMaterial color="#CBA6F7" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 3. Constellation of Hearts */}
      <group position={[0, 22, -35]}>
        <mesh>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial color="#F5C2E7" />
        </mesh>
      </group>
    </group>
  );
}

// ─── Scene Lighting by Time-of-Day ────────────────────────────────────────────
const LIGHTING = {
  morning:   { ambient: '#FFD580', ambientI: 0.7,  sun: '#FFC060', sunI: 2.8,  accent: '#FF8844', accentI: 0.6 },
  afternoon: { ambient: '#E8F4FF', ambientI: 0.9,  sun: '#FFFFFF', sunI: 3.2,  accent: '#88BBFF', accentI: 0.4 },
  evening:   { ambient: '#FF8C44', ambientI: 0.6,  sun: '#FF6633', sunI: 2.0,  accent: '#CC44AA', accentI: 0.7 },
  night:     { ambient: '#8B9DC3', ambientI: 0.2,  sun: '#C8D6F0', sunI: 0.8,  accent: '#6677CC', accentI: 0.4 },
};

// ─── Main Sanctuary Scene ─────────────────────────────────────────────────────
export default function SanctuaryScene({ timeOfDay, onPlanetClick, isKiroMode }) {
  const lt = LIGHTING[timeOfDay] ?? LIGHTING.night;
  const showStars = timeOfDay === 'evening' || timeOfDay === 'night';

  return (
    <div className="r3f-canvas-wrap">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.5, 14], fov: 55 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          const bgColors = {
            morning:   '#0E1825',
            afternoon: '#080E1A',
            evening:   '#120818',
            night:     '#0A0B16',
          };
          gl.setClearColor(new THREE.Color(bgColors[timeOfDay] ?? '#0A0B16'));
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        }}
      >
        <PerformanceMonitor>
          <AdaptiveDpr pixelated />
        </PerformanceMonitor>

        <ambientLight color={lt.ambient}  intensity={lt.ambientI} />
        <directionalLight color={lt.sun}  intensity={lt.sunI}    position={[5, 8, 3]} castShadow />
        <pointLight       color={lt.accent} intensity={lt.accentI} position={[-6, 3, 2]} />

        {/* Stars background */}
        {showStars && (
          <Stars
            radius={60}
            depth={30}
            count={2500}
            factor={3.5}
            saturation={0.3}
            fade
            speed={0.4}
          />
        )}
        <Stars
          radius={100}
          depth={10}
          count={800}
          factor={2}
          saturation={0}
          fade
          speed={0.2}
        />

        {/* Constellation Star Nodes */}
        <ConstellationNodes />

        {/* Multi-directional Comets */}
        <CometSystem />

        {/* Earth-like Celestial Planet */}
        <Suspense fallback={null}>
          <CelestialPlanet timeOfDay={timeOfDay} onClick={onPlanetClick} />
        </Suspense>

        {/* Deep Space Telescope Objects */}
        <TelescopeGroup />

        {/* Camera Drift + Zoom Rig */}
        <CameraRig isKiroMode={isKiroMode} />
      </Canvas>
    </div>
  );
}
