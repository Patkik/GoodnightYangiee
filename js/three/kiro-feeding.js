/**
 * kiro-feeding.js
 * Interactive 3D Feeding System for Kiro
 * Procedural treats, gravity physics, snout collision detection, chewing squash & stretch,
 * crumb bursts, floating "Yum!" bubbles, and Web Audio crunch/gulp synthesizer integration.
 */

class KiroFeeding {
  constructor(kiroScene, synthEngine) {
    this.kiroScene = kiroScene;
    this.synth = synthEngine || window.synthEngine;
    this.activeCandies = [];
    this.activeParticles = [];
    this.yumPhrases = [
      "Yum! ♥",
      "Oishi! ✨",
      "Nom Nom! 💕",
      "Sarap! 🍓",
      "Delicious! 🌟",
      "Sweet! 🍬"
    ];

    this.initLoop();
  }

  initLoop() {
    this.update = this.update.bind(this);
    requestAnimationFrame(this.update);
  }

  // ==========================================
  // PROCEDURAL 3D CANDY FACTORY
  // ==========================================

  createCandyMesh(type) {
    const group = new THREE.Group();
    let candyColor = 0xF9E2AF;

    if (type === 'star') {
      // Golden Star Candy: Sharp 5-pointed extruded star
      candyColor = 0xF9E2AF;
      const starShape = new THREE.Shape();
      const points = 5;
      const outerR = 0.22;
      const innerR = 0.10;

      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) starShape.moveTo(x, y);
        else starShape.lineTo(x, y);
      }
      starShape.closePath();

      const extrudeSettings = {
        depth: 0.08,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.02,
        bevelThickness: 0.02
      };

      const starGeo = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
      starGeo.center();
      const starMat = new THREE.MeshStandardMaterial({
        color: candyColor,
        roughness: 0.25,
        metalness: 0.8,
        emissive: 0x554400,
        emissiveIntensity: 0.25
      });
      const starMesh = new THREE.Mesh(starGeo, starMat);
      group.add(starMesh);

    } else if (type === 'donut') {
      // Pastel Strawberry Donut: Ring torus with 6 procedural white sprinkles
      candyColor = 0xFFB6C1;
      const torusGeo = new THREE.TorusGeometry(0.18, 0.09, 16, 28);
      const torusMat = new THREE.MeshStandardMaterial({
        color: candyColor,
        roughness: 0.45,
        metalness: 0.1
      });
      const donutMesh = new THREE.Mesh(torusGeo, torusMat);
      group.add(donutMesh);

      // Sprinkles
      for (let s = 0; s < 6; s++) {
        const sprGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.05, 6);
        const sprMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const spr = new THREE.Mesh(sprGeo, sprMat);
        const angle = (s / 6) * Math.PI * 2;
        spr.position.set(Math.cos(angle) * 0.18, Math.sin(angle) * 0.18, 0.09);
        spr.rotation.z = Math.random() * Math.PI;
        group.add(spr);
      }

    } else {
      // Glowing Mint Gummy: Glossy translucent capsule
      candyColor = 0x94E2D5;
      const capGeo = new THREE.SphereGeometry(0.16, 16, 16);
      const capMat = new THREE.MeshPhysicalMaterial({
        color: candyColor,
        roughness: 0.1,
        transmission: 0.75,
        thickness: 0.5,
        transparent: true,
        opacity: 0.88,
        ior: 1.4
      });
      const gummyMesh = new THREE.Mesh(capGeo, capMat);
      gummyMesh.scale.set(0.9, 1.2, 0.9);
      group.add(gummyMesh);
    }

    group.userData = {
      type: type,
      color: candyColor,
      vy: -0.015,
      vx: (Math.random() - 0.5) * 0.01,
      vz: (Math.random() - 0.5) * 0.01,
      rotX: (Math.random() - 0.5) * 0.08,
      rotY: (Math.random() - 0.5) * 0.08,
      rotZ: (Math.random() - 0.5) * 0.08,
      state: 'falling' // 'falling', 'eaten', 'splattered'
    };

    return group;
  }

  // ==========================================
  // CANDY SPAWN & PHYSICS
  // ==========================================

  dropCandy(type = 'star') {
    if (!this.kiroScene || !this.kiroScene.scene) return;

    const candy = this.createCandyMesh(type);
    // Spawn high above Kiro with organic offset
    const spawnX = (Math.random() - 0.5) * 0.4;
    const spawnY = 4.2;
    const spawnZ = 0.85 + (Math.random() - 0.5) * 0.2;

    candy.position.set(spawnX, spawnY, spawnZ);
    this.kiroScene.scene.add(candy);
    this.activeCandies.push(candy);
  }

  update() {
    requestAnimationFrame(this.update);

    if (!this.kiroScene || !this.kiroScene.scene) return;

    const snoutPos = this.kiroScene.getSnoutPosition();
    const pedestalY = this.kiroScene.getPedestalY();

    // 1. Update Falling Candies
    for (let i = this.activeCandies.length - 1; i >= 0; i--) {
      const candy = this.activeCandies[i];

      if (candy.userData.state === 'falling') {
        // Gravity acceleration
        candy.userData.vy -= 0.0055;
        candy.position.y += candy.userData.vy;
        candy.position.x += candy.userData.vx;
        candy.position.z += candy.userData.vz;

        // Rotational momentum
        candy.rotation.x += candy.userData.rotX;
        candy.rotation.y += candy.userData.rotY;
        candy.rotation.z += candy.userData.rotZ;

        // Snout Bounding Collision Check
        const distToSnout = candy.position.distanceTo(snoutPos);
        const canEat = !this.kiroScene.isSleeping;

        if (canEat && distToSnout < 0.42 && candy.position.y <= snoutPos.y + 0.35) {
          candy.userData.state = 'eaten';
          this.triggerEatingReaction(candy);
          this.kiroScene.scene.remove(candy);
          this.activeCandies.splice(i, 1);
          continue;
        }

        // Pedestal Splatter Check
        if (candy.position.y <= pedestalY + 0.05) {
          candy.userData.state = 'splattered';
          this.triggerSplatter(candy);
          this.activeCandies.splice(i, 1);
          continue;
        }
      }
    }

    // 2. Update Crumb Particles
    for (let j = this.activeParticles.length - 1; j >= 0; j--) {
      const p = this.activeParticles[j];
      p.position.x += p.userData.vx;
      p.position.y += p.userData.vy;
      p.position.z += p.userData.vz;
      p.userData.vy -= 0.004; // gravity
      p.userData.life -= 0.03;
      p.scale.multiplyScalar(0.95);

      if (p.material) {
        p.material.opacity = Math.max(0, p.userData.life);
      }

      if (p.userData.life <= 0) {
        this.kiroScene.scene.remove(p);
        this.activeParticles.splice(j, 1);
      }
    }
  }

  // ==========================================
  // EATING REACTION: CHEWING, CRUMBS & SFX
  // ==========================================

  triggerEatingReaction(candy) {
    const candyColor = candy.userData.color || 0xF9E2AF;
    const snoutPos = this.kiroScene.getSnoutPosition();

    // 1. Synthesize Procedural Audio SFX
    if (this.synth) {
      this.synth.playCrunch();
      setTimeout(() => {
        if (this.synth) this.synth.playGulp();
      }, 140);
    }

    // 2. GSAP Chewing Squash & Stretch Cycle
    if (typeof gsap !== 'undefined' && this.kiroScene.kiroGroup) {
      this.kiroScene.isChewing = true;
      const grp = this.kiroScene.kiroGroup;
      const baseScale = grp.scale.x;

      const tl = gsap.timeline({
        onComplete: () => {
          this.kiroScene.isChewing = false;
        }
      });

      tl.to(grp.scale, { x: baseScale * 1.18, y: baseScale * 0.82, z: baseScale * 1.15, duration: 0.12, ease: 'power2.out' })
        .to(grp.scale, { x: baseScale * 0.88, y: baseScale * 1.18, z: baseScale * 0.9, duration: 0.14, ease: 'power2.inOut' })
        .to(grp.scale, { x: baseScale * 1.1, y: baseScale * 0.92, z: baseScale * 1.08, duration: 0.1, ease: 'power2.inOut' })
        .to(grp.scale, { x: baseScale, y: baseScale, z: baseScale, duration: 0.18, ease: 'elastic.out(1, 0.4)' });

      if (this.kiroScene.leftFlipper && this.kiroScene.rightFlipper) {
        gsap.to(this.kiroScene.leftFlipper.rotation, { z: 0.8, duration: 0.12, yoyo: true, repeat: 3 });
        gsap.to(this.kiroScene.rightFlipper.rotation, { z: -0.8, duration: 0.12, yoyo: true, repeat: 3 });
      }
    }

    // 3. Crumb Burst Particles
    this.spawnCrumbBurst(snoutPos, candyColor);

    // 4. Floating "Yum!" Screen Sprites
    this.spawnFloatingYum(snoutPos);
  }

  spawnCrumbBurst(origin, color) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.035, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.95
      });
      const crumb = new THREE.Mesh(geo, mat);
      crumb.position.copy(origin);

      const angle = (i / count) * Math.PI * 2;
      const speed = 0.035 + Math.random() * 0.035;

      crumb.userData = {
        vx: Math.cos(angle) * speed,
        vy: 0.04 + Math.random() * 0.05,
        vz: Math.sin(angle) * speed + 0.02,
        life: 1.0
      };

      this.kiroScene.scene.add(crumb);
      this.activeParticles.push(crumb);
    }
  }

  spawnFloatingYum(pos3D) {
    if (!this.kiroScene.camera || !this.kiroScene.canvas) return;

    // Project 3D coordinate to 2D screen coordinate
    const vector = pos3D.clone();
    vector.y += 0.4;
    vector.project(this.kiroScene.camera);

    const rect = this.kiroScene.canvas.getBoundingClientRect();
    const screenX = ((vector.x + 1) / 2) * rect.width + rect.left;
    const screenY = (-(vector.y - 1) / 2) * rect.height + rect.top;

    const yumEl = document.createElement('div');
    yumEl.className = 'floating-yum-bubble';
    const text = this.yumPhrases[Math.floor(Math.random() * this.yumPhrases.length)];
    yumEl.textContent = text;
    yumEl.style.left = `${screenX}px`;
    yumEl.style.top = `${screenY}px`;

    document.body.appendChild(yumEl);

    setTimeout(() => {
      yumEl.classList.add('fade-up');
    }, 20);

    setTimeout(() => {
      if (yumEl.parentNode) yumEl.parentNode.removeChild(yumEl);
    }, 1100);
  }

  // ==========================================
  // MISSED / SPLATTER COLLISION
  // ==========================================

  triggerSplatter(candy) {
    if (typeof gsap !== 'undefined') {
      gsap.to(candy.scale, {
        x: 1.9,
        y: 0.03,
        z: 1.9,
        duration: 0.25,
        ease: 'power2.out'
      });
      gsap.to(candy.position, {
        y: this.kiroScene.getPedestalY() + 0.02,
        duration: 0.25
      });
      gsap.to(candy.rotation, {
        x: 0,
        z: 0,
        duration: 0.25
      });
      setTimeout(() => {
        if (candy.parent) candy.parent.remove(candy);
      }, 700);
    } else {
      if (candy.parent) candy.parent.remove(candy);
    }
  }
}

window.KiroFeeding = KiroFeeding;
