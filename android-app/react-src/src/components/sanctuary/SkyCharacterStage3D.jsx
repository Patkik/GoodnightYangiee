import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../../store/appStore.js';

export default function SkyCharacterStage3D() {
  const containerRef = useRef(null);
  const onboardingPhase = useAppStore(s => s.onboardingPhase);
  const hoveredPersona = useAppStore(s => s.hoveredPersona);

  useEffect(() => {
    if (onboardingPhase !== 5) return;

    const container = containerRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene, Camera, WebGL Renderer (Sky: Children of the Light Style)
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x110f1d, 0.08);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 7.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', resize);

    // 2. Soft Ambient & Ethereal Rim Lights
    const ambientLight = new THREE.AmbientLight(0xd0e8ff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    sunLight.position.set(3, 8, 5);
    scene.add(sunLight);

    // Pat Amber Light
    const patLight = new THREE.PointLight(0xf9e2af, 3.5, 12);
    patLight.position.set(-2.2, 2, 3);
    scene.add(patLight);

    // Yang Teal Light
    const yangLight = new THREE.PointLight(0x94e2d5, 3.5, 12);
    yangLight.position.set(2.2, 2, 3);
    scene.add(yangLight);

    // 3. Ground Celestial Horizon Disk (Sky: Children of Light starry altar)
    const altarGeo = new THREE.CylinderGeometry(4.5, 4.8, 0.3, 64);
    const altarMat = new THREE.MeshStandardMaterial({
      color: 0x1b192a,
      roughness: 0.4,
      metalness: 0.3,
      emissive: 0x110f1d,
    });
    const altar = new THREE.Mesh(altarGeo, altarMat);
    altar.position.y = -1.0;
    scene.add(altar);

    // Glowing Altar Edge Ring
    const edgeRingGeo = new THREE.TorusGeometry(4.52, 0.05, 16, 64);
    const edgeRingMat = new THREE.MeshBasicMaterial({ color: 0xf9e2af, transparent: true, opacity: 0.6 });
    const edgeRing = new THREE.Mesh(edgeRingGeo, edgeRingMat);
    edgeRing.rotation.x = Math.PI / 2;
    edgeRing.position.y = -0.85;
    scene.add(edgeRing);

    // Star-dust particles floating up from altar
    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 8;
      positions[i + 1] = Math.random() * 5 - 1;
      positions[i + 2] = (Math.random() - 0.5) * 8;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0xf5c2e7,
      size: 0.08,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const starParticles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(starParticles);

    // ─── 4. PAT 3D AVATAR (THE ANCHOR - Warm Amber Star Cloak) ────────────────
    const patGroup = new THREE.Group();
    patGroup.position.set(-1.8, -0.7, 0);

    // Head
    const patHeadGeo = new THREE.SphereGeometry(0.55, 32, 32);
    patHeadGeo.scale(1, 1.15, 0.95);
    const patHeadMesh = new THREE.Mesh(patHeadGeo, new THREE.MeshStandardMaterial({ color: 0x8d5b4c, roughness: 0.5 }));
    patHeadMesh.position.y = 1.6;
    patGroup.add(patHeadMesh);

    // Hair (Textured Fringe)
    const patHairGroup = new THREE.Group();
    const patHairMat = new THREE.MeshStandardMaterial({ color: 0x30221c, roughness: 0.7 });
    for (let i = 0; i < 12; i++) {
      const strand = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 8), patHairMat);
      const angle = (i / 12) * Math.PI * 0.8 - Math.PI * 0.4;
      strand.position.set(Math.sin(angle) * 0.5, 2.05 - Math.abs(angle) * 0.15, Math.cos(angle) * 0.4);
      strand.rotation.z = -angle * 0.5;
      patHairGroup.add(strand);
    }
    patGroup.add(patHairGroup);

    // Sky Style Star Cloak / Torso (Terracotta & Amber)
    const patCloakGeo = new THREE.ConeGeometry(0.85, 1.8, 32);
    const patCloakMat = new THREE.MeshStandardMaterial({
      color: 0xc97b4b,
      roughness: 0.4,
      metalness: 0.1,
    });
    const patCloak = new THREE.Mesh(patCloakGeo, patCloakMat);
    patCloak.position.y = 0.7;
    patGroup.add(patCloak);

    // Amber Star Halo Ring around Pat
    const patHaloGeo = new THREE.TorusGeometry(1.0, 0.03, 16, 48);
    const patHaloMat = new THREE.MeshBasicMaterial({ color: 0xf9e2af, transparent: true, opacity: 0.8 });
    const patHalo = new THREE.Mesh(patHaloGeo, patHaloMat);
    patHalo.rotation.x = Math.PI / 2;
    patHalo.position.y = 0.1;
    patGroup.add(patHalo);

    scene.add(patGroup);

    // ─── 5. YANG 3D AVATAR (THE CATALYST - Ethereal Wings & Glowing Tattoos) ───
    const yangGroup = new THREE.Group();
    yangGroup.position.set(1.8, -0.7, 0);

    // Head (Pale porcelain)
    const yangHeadGeo = new THREE.SphereGeometry(0.53, 32, 32);
    yangHeadGeo.scale(1, 1.18, 0.92);
    const yangHeadMesh = new THREE.Mesh(yangHeadGeo, new THREE.MeshStandardMaterial({ color: 0xf5e6e0, roughness: 0.3 }));
    yangHeadMesh.position.y = 1.6;
    yangGroup.add(yangHeadMesh);

    // Hair (Bleached copper-orange w/ dark roots)
    const yangHairGroup = new THREE.Group();
    const copperMat = new THREE.MeshStandardMaterial({ color: 0xe08d47, roughness: 0.4 });
    const darkRootMat = new THREE.MeshStandardMaterial({ color: 0x181825, roughness: 0.6 });

    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.56, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.45), darkRootMat);
    crown.position.y = 1.65;
    yangHairGroup.add(crown);

    for (let i = 0; i < 14; i++) {
      const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.6, 8), copperMat);
      const angle = (i / 14) * Math.PI * 1.1 - Math.PI * 0.55;
      strand.position.set(Math.sin(angle) * 0.52, 1.7 - Math.abs(angle) * 0.12, Math.cos(angle) * 0.38);
      strand.rotation.z = -angle * 0.4;
      yangHairGroup.add(strand);
    }
    yangGroup.add(yangHairGroup);

    // Glasses Frame
    const glassesMat = new THREE.MeshStandardMaterial({ color: 0xcdd6f4, metalness: 0.9, roughness: 0.1 });
    const lensMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.85, opacity: 0.4, transparent: true });

    [-0.2, 0.2].forEach(x => {
      const frame = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.14, 24), glassesMat);
      frame.position.set(x, 1.62, 0.5);
      yangGroup.add(frame);

      const pane = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24), lensMat);
      pane.position.set(x, 1.62, 0.5);
      yangGroup.add(pane);
    });

    // Sky Style Celestial Star Wings / Cape (Aurora Teal)
    const yangCloakGeo = new THREE.ConeGeometry(0.8, 1.8, 32);
    const yangCloakMat = new THREE.MeshStandardMaterial({
      color: 0x181825,
      roughness: 0.3,
      metalness: 0.2,
    });
    const yangCloak = new THREE.Mesh(yangCloakGeo, yangCloakMat);
    yangCloak.position.y = 0.7;
    yangGroup.add(yangCloak);

    // Glowing Bioluminescent Arm Tattoo Bands
    const tattooMaterials = [];
    [-0.55, 0.55].forEach(x => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.8, 16), new THREE.MeshStandardMaterial({ color: 0xf5e6e0 }));
      arm.position.set(x, 0.8, 0.1);
      arm.rotation.z = x < 0 ? 0.3 : -0.3;
      yangGroup.add(arm);

      for (let b = 0; b < 3; b++) {
        const mat = new THREE.MeshStandardMaterial({
          color: 0x94e2d5,
          emissive: 0x94e2d5,
          emissiveIntensity: 1.5,
        });
        tattooMaterials.push(mat);
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 12, 24), mat);
        band.rotation.x = Math.PI / 2;
        band.position.set(x, 0.85 - b * 0.15, 0.1);
        yangGroup.add(band);
      }
    });

    // Teal Star Halo Ring
    const yangHaloGeo = new THREE.TorusGeometry(1.0, 0.03, 16, 48);
    const yangHaloMat = new THREE.MeshBasicMaterial({ color: 0x94e2d5, transparent: true, opacity: 0.8 });
    const yangHalo = new THREE.Mesh(yangHaloGeo, yangHaloMat);
    yangHalo.rotation.x = Math.PI / 2;
    yangHalo.position.y = 0.1;
    yangGroup.add(yangHalo);

    scene.add(yangGroup);

    // ─── 6. ANIMATION LOOP & HERO STANCE INTERACTION ────────────────────────
    let animFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();

      // Floating star-dust upward movement
      const pos = particlesGeo.attributes.position.array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        pos[i] += 0.008;
        if (pos[i] > 4) pos[i] = -1;
      }
      particlesGeo.attributes.position.needsUpdate = true;

      // Base gentle breathing sways
      patGroup.position.y = -0.7 + Math.sin(time * 1.5) * 0.04;
      yangGroup.position.y = -0.7 + Math.sin(time * 1.5 + 1) * 0.04;

      patHalo.rotation.z = time * 0.4;
      yangHalo.rotation.z = -time * 0.4;

      // Hero Stance Hover Responses
      if (hoveredPersona === 'pat') {
        // Pat steps forward with warm glow gesture
        patGroup.position.z = THREE.MathUtils.lerp(patGroup.position.z, 0.8, 0.08);
        patGroup.position.x = THREE.MathUtils.lerp(patGroup.position.x, -1.2, 0.08);
        patGroup.scale.lerp(new THREE.Vector3(1.15, 1.15, 1.15), 0.08);
        patLight.intensity = THREE.MathUtils.lerp(patLight.intensity, 6.0, 0.08);

        // Yang steps back into supportive posture
        yangGroup.position.z = THREE.MathUtils.lerp(yangGroup.position.z, -0.6, 0.08);
        yangGroup.position.x = THREE.MathUtils.lerp(yangGroup.position.x, 2.2, 0.08);
        yangGroup.scale.lerp(new THREE.Vector3(0.9, 0.9, 0.9), 0.08);
        yangLight.intensity = THREE.MathUtils.lerp(yangLight.intensity, 2.0, 0.08);

      } else if (hoveredPersona === 'yang') {
        // Yang steps forward while arm tattoos illuminate intensely
        yangGroup.position.z = THREE.MathUtils.lerp(yangGroup.position.z, 0.8, 0.08);
        yangGroup.position.x = THREE.MathUtils.lerp(yangGroup.position.x, 1.2, 0.08);
        yangGroup.scale.lerp(new THREE.Vector3(1.15, 1.15, 1.15), 0.08);
        yangLight.intensity = THREE.MathUtils.lerp(yangLight.intensity, 6.0, 0.08);

        // Tattoo intensity pulse
        tattooMaterials.forEach(m => {
          m.emissiveIntensity = 2.5 + Math.sin(time * 6) * 1.2;
        });

        // Pat steps back into supportive posture
        patGroup.position.z = THREE.MathUtils.lerp(patGroup.position.z, -0.6, 0.08);
        patGroup.position.x = THREE.MathUtils.lerp(patGroup.position.x, -2.2, 0.08);
        patGroup.scale.lerp(new THREE.Vector3(0.9, 0.9, 0.9), 0.08);
        patLight.intensity = THREE.MathUtils.lerp(patLight.intensity, 2.0, 0.08);

      } else {
        // Balanced Neutral Stance
        patGroup.position.z = THREE.MathUtils.lerp(patGroup.position.z, 0, 0.08);
        patGroup.position.x = THREE.MathUtils.lerp(patGroup.position.x, -1.8, 0.08);
        patGroup.scale.lerp(new THREE.Vector3(1, 1, 1), 0.08);
        patLight.intensity = THREE.MathUtils.lerp(patLight.intensity, 3.5, 0.08);

        yangGroup.position.z = THREE.MathUtils.lerp(yangGroup.position.z, 0, 0.08);
        yangGroup.position.x = THREE.MathUtils.lerp(yangGroup.position.x, 1.8, 0.08);
        yangGroup.scale.lerp(new THREE.Vector3(1, 1, 1), 0.08);
        yangLight.intensity = THREE.MathUtils.lerp(yangLight.intensity, 3.5, 0.08);

        tattooMaterials.forEach(m => {
          m.emissiveIntensity = 1.5;
        });
      }

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onboardingPhase, hoveredPersona]);

  if (onboardingPhase !== 5) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        pointerEvents: 'none',
      }}
    />
  );
}
