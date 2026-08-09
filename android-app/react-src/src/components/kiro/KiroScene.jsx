import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
// No external spring lib — smooth lerp via useFrame for zero extra deps
import { useKiroStore, calcWellbeing, calcScale, wellbeingTier } from '../../store/kiroStore.js';

// ─── Dynamic Sky Background ───────────────────────────────────────────────────
function DynamicSky({ timeOfDay }) {
  const meshRef = useRef();
  const colors = useMemo(() => {
    const map = {
      morning:   ['#1a3a5c', '#2a6a8a', '#f9c58a'],
      afternoon: ['#1a4060', '#2a7a9a', '#89dceb'],
      evening:   ['#2a1a3a', '#4a2a5a', '#f5a070'],
      night:     ['#0a0a1e', '#0d1535', '#1a1535'],
    };
    return map[timeOfDay] || map.night;
  }, [timeOfDay]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime() * 0.05;
    meshRef.current.material.uniforms.time.value = t;
  });

  const skyShader = useMemo(() => ({
    uniforms: {
      colorTop: { value: new THREE.Color(colors[0]) },
      colorMid: { value: new THREE.Color(colors[1]) },
      colorBot: { value: new THREE.Color(colors[2]) },
      time: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: `
      uniform vec3 colorTop;
      uniform vec3 colorMid;
      uniform vec3 colorBot;
      uniform float time;
      varying vec2 vUv;
      void main() {
        vec3 col = mix(colorBot, colorMid, smoothstep(0.0, 0.5, vUv.y));
        col = mix(col, colorTop, smoothstep(0.5, 1.0, vUv.y));
        float wave = sin(vUv.x * 4.0 + time) * 0.015;
        col += vec3(wave * 0.05);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  }), [colors]);

  return (
    <mesh ref={meshRef} position={[0, 0, -20]} scale={[60, 40, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial args={[skyShader]} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Floating Island Terrain ──────────────────────────────────────────────────
function FloatingIsland({ wellbeing }) {
  const grassColor = useMemo(() => {
    const t = Math.max(0, Math.min(1, wellbeing / 100));
    // Low → desaturated grey-green; High → vibrant emerald
    return new THREE.Color().lerpColors(
      new THREE.Color('#3a4a3a'),
      new THREE.Color('#4ade80'),
      t * t
    );
  }, [wellbeing]);

  return (
    <group>
      {/* Main island body */}
      <mesh position={[0, -1.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.5, 2.5, 1.4, 8, 1]} />
        <meshStandardMaterial color="#5a3e28" roughness={0.9} />
      </mesh>
      {/* Grass top */}
      <mesh position={[0, -0.52, 0]} receiveShadow>
        <cylinderGeometry args={[3.5, 3.5, 0.25, 8, 1]} />
        <meshStandardMaterial color={grassColor} roughness={0.85} />
      </mesh>
      {/* Dirt underside layers */}
      <mesh position={[0, -1.95, 0]}>
        <cylinderGeometry args={[2.5, 1.8, 0.6, 8, 1]} />
        <meshStandardMaterial color="#3d2a18" roughness={1.0} />
      </mesh>
      {/* Hanging roots */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 1.5, -2.4, Math.sin(angle) * 1.5]}>
            <cylinderGeometry args={[0.04, 0.02, 0.6 + Math.random() * 0.4, 4, 1]} />
            <meshStandardMaterial color="#2d1f0f" roughness={1} />
          </mesh>
        );
      })}
      {/* Trees */}
      {wellbeing > 30 && [[-1.8, 0], [1.5, 0.8], [-0.5, -1.5]].map(([tx, tz], i) => (
        <group key={i} position={[tx, -0.2, tz]}>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 0.8, 5, 1]} />
            <meshStandardMaterial color="#5a3e28" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.0, 0]}>
            <coneGeometry args={[0.5, 1.0, 6, 1]} />
            <meshStandardMaterial color={wellbeing > 60 ? '#4ade80' : '#3a6040'} roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* Tiny bed */}
      <group position={[1.0, -0.35, 0.8]}>
        <mesh>
          <boxGeometry args={[0.9, 0.15, 0.6]} />
          <meshStandardMaterial color="#5a3e28" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <boxGeometry args={[0.85, 0.12, 0.55]} />
          <meshStandardMaterial color="#F5C2E7" roughness={0.95} />
        </mesh>
        <mesh position={[0.35, 0.22, 0]}>
          <boxGeometry args={[0.12, 0.2, 0.5]} />
          <meshStandardMaterial color="#CDD6F4" roughness={0.95} />
        </mesh>
      </group>
      {/* Water bowl */}
      <group position={[-0.8, -0.35, 0.9]}>
        <mesh>
          <cylinderGeometry args={[0.22, 0.16, 0.18, 12, 1]} />
          <meshStandardMaterial color="#89DCEB" roughness={0.1} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.19, 0.19, 0.04, 12, 1]} />
          <meshStandardMaterial color="#74C7EC" roughness={0.05} transparent opacity={0.85} />
        </mesh>
      </group>
      {/* Floating lanterns (night/evening) */}
      {[[-1.2, 1.5, -0.5], [0.8, 2.0, -1.0], [-0.2, 1.8, 1.2]].map(([lx, ly, lz], i) => (
        <group key={i} position={[lx, ly, lz]}>
          <mesh>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshStandardMaterial color="#F9E2AF" emissive="#F9E2AF" emissiveIntensity={1.2} />
          </mesh>
          <pointLight color="#F9E2AF" intensity={0.4} distance={2.5} />
        </group>
      ))}
    </group>
  );
}

// ─── Kiro Character (Squishmallow-style) ─────────────────────────────────────
function KiroMesh({ wellbeing, isSleeping, isWellRested }) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const targetScaleRef = useRef(calcScale(wellbeing));
  const currentScaleRef = useRef(calcScale(wellbeing));

  const tier = wellbeingTier(wellbeing);

  // Smooth scale via lerp in useFrame — no extra lib
  const targetScale = useMemo(() => calcScale(wellbeing), [wellbeing]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current) return;
    // Smooth scale lerp
    const cur = groupRef.current.scale.x;
    const next = THREE.MathUtils.lerp(cur, targetScale, delta * 4.0);
    groupRef.current.scale.setScalar(next);

    if (isSleeping) {
      // Sleeping animation: gentle breathing
      groupRef.current.position.y = -0.35 + Math.sin(t * 1.0) * 0.015;
      groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.02;
    } else if (tier === 'thriving') {
      // Energetic bounce
      groupRef.current.position.y = Math.sin(t * 2.2) * 0.12 + 0.1;
      groupRef.current.rotation.z = Math.sin(t * 1.5) * 0.04;
    } else if (tier === 'happy') {
      // Calm idle
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.06 + 0.05;
      groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.06;
    } else if (tier === 'okay') {
      // Slow, occasional yawn effect
      groupRef.current.position.y = Math.sin(t * 0.7) * 0.04;
    } else if (tier === 'low') {
      // Droopy, slight lean
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.02 - 0.05;
      groupRef.current.rotation.z = Math.sin(t * 0.3) * 0.06;
    } else {
      // Critical — barely moves
      groupRef.current.position.y = Math.sin(t * 0.3) * 0.01 - 0.08;
    }
  });

  const bodyColor = tier === 'critical' ? '#6aa8a0' : tier === 'low' ? '#5bbda8' : '#4EC9B0';

  return (
    <group ref={groupRef} position={[0, 0.1, 0]}>
      {/* Well-rested golden aura */}
      {isWellRested && (
        <mesh>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial color="#F9E2AF" transparent opacity={0.06} side={THREE.BackSide} />
        </mesh>
      )}

      {/* Body — main Squishmallow sphere */}
      <mesh ref={bodyRef} castShadow scale={[1, 0.92, 1]}>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshStandardMaterial color={bodyColor} roughness={0.88} metalness={0.0} />
      </mesh>

      {/* Belly — cream white */}
      <mesh position={[0, -0.15, 0.72]} scale={[1, 1, 0.35]}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshStandardMaterial color="#F0EDE8" roughness={0.9} />
      </mesh>

      {/* Eyes */}
      {[-0.28, 0.28].map((x, i) => (
        <group key={i} position={[x, 0.22, 0.92]}>
          <mesh>
            <sphereGeometry args={[0.1, 14, 14]} />
            <meshStandardMaterial color="#1A3A3A" roughness={0.2} />
          </mesh>
          {/* White specular highlight */}
          <mesh position={[0.03, 0.04, 0.07]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1.5} />
          </mesh>
        </group>
      ))}

      {/* Nose — pink */}
      <mesh position={[0, 0.04, 0.99]}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshStandardMaterial color="#F5B7C0" roughness={0.9} />
      </mesh>

      {/* Cheek blushes */}
      {[-0.55, 0.55].map((x, i) => (
        <mesh
          key={i}
          position={[x, -0.02, 0.86]}
          rotation={[0, i === 0 ? -0.4 : 0.4, 0]}
        >
          <circleGeometry args={[0.18, 16]} />
          <meshBasicMaterial color="#FFB6C1" transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Arms — stubby flattened spheres */}
      {[-1.0, 1.0].map((x, i) => (
        <mesh
          key={i}
          position={[x, -0.24, 0.28]}
          scale={[0.55, 0.45, 0.45]}
          rotation={[0.1, 0, i === 0 ? 0.45 : -0.45]}
        >
          <sphereGeometry args={[0.24, 10, 10]} />
          <meshStandardMaterial color={bodyColor} roughness={0.88} />
        </mesh>
      ))}

      {/* Sleeping: nightcap */}
      {isSleeping && (
        <group position={[0, 0.85, 0]} rotation={[0, 0, 0.3]}>
          <mesh>
            <coneGeometry args={[0.3, 0.65, 8, 1]} />
            <meshStandardMaterial color="#CBA6F7" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.28, 0]}>
            <torusGeometry args={[0.3, 0.06, 8, 20]} />
            <meshStandardMaterial color="#F5C2E7" roughness={0.9} />
          </mesh>
          {/* Star on cap */}
          <mesh position={[0, 0.32, 0]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color="#F9E2AF" emissive="#F9E2AF" emissiveIntensity={1.5} />
          </mesh>
        </group>
      )}

      {/* Critical tier: leaf blanket */}
      {tier === 'critical' && (
        <mesh position={[0, -0.5, 0.5]} rotation={[0.5, 0, 0]}>
          <planeGeometry args={[1.4, 0.9]} />
          <meshStandardMaterial color="#4ade80" transparent opacity={0.7} side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
      )}
    </group>
  );
}

// ─── Haven Particles ──────────────────────────────────────────────────────────
function HavenParticles({ wellbeing }) {
  if (wellbeing < 65) return null;
  return (
    <Sparkles
      count={wellbeing > 85 ? 40 : 20}
      scale={6}
      size={wellbeing > 85 ? 4 : 2}
      speed={0.4}
      color={wellbeing > 85 ? '#F9E2AF' : '#94E2D5'}
      opacity={0.7}
      position={[0, 0.5, 0]}
    />
  );
}

// ─── Kiro Scene (inner R3F canvas) ──────────────────────────────────────────
function KiroSceneContents({ timeOfDay }) {
  const stats = useKiroStore(s => s.stats);
  const sleepMode = useKiroStore(s => s.sleepMode);
  const wellRestedUntil = useKiroStore(s => s.wellRestedUntil);
  const W = calcWellbeing(stats.food, stats.water, stats.energy);
  const isWellRested = wellRestedUntil && Date.now() < wellRestedUntil;
  const isSleeping = sleepMode?.is_sleeping;

  const lightTheme = useMemo(() => {
    const themes = {
      morning:   { amb: '#e8d5b0', ambI: 0.8, dir: '#ffd580', dirI: 1.8 },
      afternoon: { amb: '#b0d5e8', ambI: 0.9, dir: '#ffffff',  dirI: 2.0 },
      evening:   { amb: '#c0a0c8', ambI: 0.5, dir: '#f09060',  dirI: 1.2 },
      night:     { amb: '#6070a8', ambI: 0.3, dir: '#8090d0',  dirI: 0.7 },
    };
    return themes[timeOfDay] || themes.night;
  }, [timeOfDay]);

  return (
    <>
      <PerformanceMonitor><AdaptiveDpr pixelated /></PerformanceMonitor>
      <ambientLight color={lightTheme.amb} intensity={lightTheme.ambI} />
      <directionalLight
        color={lightTheme.dir}
        intensity={lightTheme.dirI}
        position={[4, 8, 4]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight color="#CBA6F7" intensity={0.3} position={[-3, 2, 2]} />

      {/* Sky gradient */}
      <DynamicSky timeOfDay={isSleeping ? 'night' : timeOfDay} />

      {/* Floating island with gentle bob */}
      <Float floatIntensity={0.4} rotationIntensity={0.06} speed={1.2}>
        <FloatingIsland wellbeing={W} />
      </Float>

      {/* Kiro character */}
      <KiroMesh wellbeing={W} isSleeping={isSleeping} isWellRested={isWellRested} />

      {/* Ambient particles */}
      <HavenParticles wellbeing={W} />

      {/* Stars in night sky */}
      {(timeOfDay === 'night' || isSleeping) && (
        <Sparkles count={60} scale={[20, 14, 10]} size={1.5} speed={0.1} color="#CDD6F4" opacity={0.5} position={[0, 5, -10]} />
      )}
    </>
  );
}

export default function KiroScene({ timeOfDay }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.5, 6.5], fov: 50 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      shadows
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color('#0a1a2e'));
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <Suspense fallback={null}>
        <KiroSceneContents timeOfDay={timeOfDay} />
      </Suspense>
    </Canvas>
  );
}
