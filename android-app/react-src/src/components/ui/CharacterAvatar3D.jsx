import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function CharacterAvatar3D({ persona, isFocused }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 120;
    const height = container.clientHeight || 120;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 4.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientColor = persona === 'pat' ? 0xffe6cc : 0xd0f8f5;
    const ambientLight = new THREE.AmbientLight(ambientColor, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const rimColor = persona === 'pat' ? 0xf9e2af : 0x94e2d5;
    const rimLight = new THREE.PointLight(rimColor, 3.0, 8);
    rimLight.position.set(-2, 1, 2);
    scene.add(rimLight);

    // 3. Procedural 3D Character Mesh Group
    const charGroup = new THREE.Group();

    if (persona === 'pat') {
      // ─── PAT 3D MODEL ───────────────────────────────────────────────────
      // Head (Warm rich brown skin)
      const headGeo = new THREE.SphereGeometry(0.7, 32, 32);
      headGeo.scale(1, 1.15, 0.95);
      const skinMat = new THREE.MeshStandardMaterial({
        color: 0x8d5b4c,
        roughness: 0.5,
        metalness: 0.1,
      });
      const headMesh = new THREE.Mesh(headGeo, skinMat);
      headMesh.position.y = 0.6;
      charGroup.add(headMesh);

      // Hair (Classic textured fringe falling over forehead)
      const hairGroup = new THREE.Group();
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x30221c, roughness: 0.7 });
      for (let i = 0; i < 14; i++) {
        const strandGeo = new THREE.ConeGeometry(0.12, 0.5, 8);
        const strand = new THREE.Mesh(strandGeo, hairMat);
        const angle = (i / 14) * Math.PI * 0.9 - Math.PI * 0.45;
        strand.position.set(Math.sin(angle) * 0.62, 1.15 - Math.abs(angle) * 0.2, Math.cos(angle) * 0.5);
        strand.rotation.z = -angle * 0.5;
        strand.rotation.x = 0.3;
        hairGroup.add(strand);
      }
      charGroup.add(hairGroup);

      // Neck & Torso (Terracotta & Amber Jacket)
      const jacketGeo = new THREE.CylinderGeometry(0.55, 0.85, 1.2, 24);
      const jacketMat = new THREE.MeshStandardMaterial({
        color: 0xc97b4b,
        roughness: 0.4,
        metalness: 0.2,
      });
      const jacket = new THREE.Mesh(jacketGeo, jacketMat);
      jacket.position.y = -0.5;
      charGroup.add(jacket);

      // Collar trim (Deep Indigo)
      const trimGeo = new THREE.TorusGeometry(0.58, 0.08, 16, 32);
      const trimMat = new THREE.MeshStandardMaterial({ color: 0x1e1e2e });
      const trim = new THREE.Mesh(trimGeo, trimMat);
      trim.rotation.x = Math.PI / 2;
      trim.position.y = 0.05;
      charGroup.add(trim);

    } else {
      // ─── YANG 3D MODEL ──────────────────────────────────────────────────
      // Head (Pale porcelain skin)
      const headGeo = new THREE.SphereGeometry(0.68, 32, 32);
      headGeo.scale(1, 1.18, 0.92);
      const skinMat = new THREE.MeshStandardMaterial({
        color: 0xf5e6e0,
        roughness: 0.3,
        metalness: 0.05,
      });
      const headMesh = new THREE.Mesh(headGeo, skinMat);
      headMesh.position.y = 0.6;
      charGroup.add(headMesh);

      // Hair (Bleached copper-orange hair with dark grown-out roots at crown)
      const hairGroup = new THREE.Group();
      const copperMat = new THREE.MeshStandardMaterial({ color: 0xe08d47, roughness: 0.4 });
      const darkRootMat = new THREE.MeshStandardMaterial({ color: 0x181825, roughness: 0.6 });

      // Crown roots
      const crownGeo = new THREE.SphereGeometry(0.72, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.45);
      const crown = new THREE.Mesh(crownGeo, darkRootMat);
      crown.position.y = 0.65;
      hairGroup.add(crown);

      // Wavy copper strands & bangs
      for (let i = 0; i < 16; i++) {
        const strandGeo = new THREE.CylinderGeometry(0.06, 0.1, 0.7, 8);
        const strand = new THREE.Mesh(strandGeo, copperMat);
        const angle = (i / 16) * Math.PI * 1.2 - Math.PI * 0.6;
        strand.position.set(Math.sin(angle) * 0.65, 0.75 - Math.abs(angle) * 0.15, Math.cos(angle) * 0.45);
        strand.rotation.z = -angle * 0.4;
        strand.rotation.x = 0.2;
        hairGroup.add(strand);
      }
      charGroup.add(hairGroup);

      // Glasses Frame (Thin metallic wireframe)
      const glassesGroup = new THREE.Group();
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xcdd6f4, metalness: 0.9, roughness: 0.1 });
      const lensMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.85, opacity: 0.4, transparent: true });

      const eyeOffsets = [-0.26, 0.26];
      eyeOffsets.forEach((x) => {
        const lensGeo = new THREE.RingGeometry(0.14, 0.18, 24);
        const lensFrame = new THREE.Mesh(lensGeo, frameMat);
        lensFrame.position.set(x, 0.62, 0.64);
        glassesGroup.add(lensFrame);

        const glassPane = new THREE.Mesh(new THREE.CircleGeometry(0.14, 24), lensMat);
        glassPane.position.set(x, 0.62, 0.64);
        glassesGroup.add(glassPane);
      });
      // Bridge bar
      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22), frameMat);
      bridge.rotation.z = Math.PI / 2;
      bridge.position.set(0, 0.62, 0.64);
      glassesGroup.add(bridge);
      charGroup.add(glassesGroup);

      // Torso & Glowing Tribal Tattoo Arms
      const torsoGeo = new THREE.CylinderGeometry(0.5, 0.78, 1.2, 24);
      const torsoMat = new THREE.MeshStandardMaterial({ color: 0x181825, roughness: 0.3 });
      const torso = new THREE.Mesh(torsoGeo, torsoMat);
      torso.position.y = -0.5;
      charGroup.add(torso);

      // Arm Tattoo Bands (Bioluminescent Teal Glow)
      const armPositions = [-0.62, 0.62];
      armPositions.forEach((x) => {
        const armGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.9, 16);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xf5e6e0 });
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set(x, -0.4, 0.1);
        const rotZ = x < 0 ? 0.3 : -0.3;
        arm.rotation.z = rotZ;
        charGroup.add(arm);

        // Tattoo bands
        for (let b = 0; b < 3; b++) {
          const bandGeo = new THREE.TorusGeometry(0.17, 0.025, 12, 24);
          const bandMat = new THREE.MeshStandardMaterial({
            color: 0x94e2d5,
            emissive: 0x94e2d5,
            emissiveIntensity: 1.5,
          });
          const band = new THREE.Mesh(bandGeo, bandMat);
          band.rotation.x = Math.PI / 2;
          band.position.set(x, -0.3 - b * 0.18, 0.1);
          charGroup.add(band);
        }
      });
    }

    scene.add(charGroup);

    // 4. Energy Aura Ring
    const ringGeo = new THREE.TorusGeometry(1.6, 0.04, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: persona === 'pat' ? 0xf9e2af : 0x94e2d5,
      transparent: true,
      opacity: 0.7,
    });
    const auraRing = new THREE.Mesh(ringGeo, ringMat);
    auraRing.rotation.x = Math.PI / 2;
    auraRing.position.y = -0.8;
    scene.add(auraRing);

    // 5. Animation Loop
    let animFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Idle rotation & breathing sway
      charGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.15;
      charGroup.position.y = Math.sin(elapsedTime * 1.4) * 0.05;
      auraRing.rotation.z = elapsedTime * 0.5;

      if (isFocused) {
        charGroup.scale.lerp(new THREE.Vector3(1.15, 1.15, 1.15), 0.1);
        rimLight.intensity = THREE.MathUtils.lerp(rimLight.intensity, 5.0, 0.1);
      } else {
        charGroup.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        rimLight.intensity = THREE.MathUtils.lerp(rimLight.intensity, 3.0, 0.1);
      }

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [persona, isFocused]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
}
