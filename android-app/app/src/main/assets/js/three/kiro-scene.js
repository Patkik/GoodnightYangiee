/**
 * kiro-scene.js
 * The Immersive 3D Pet Scene (Procedural Three.js Meshes & Animations)
 * Object-oriented KiroScene controller handling 3D modeling, lighting, idle bobbing,
 * interactive petting animations, mood-based dynamics, and particle star systems.
 */

class KiroScene {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement || document.getElementById('kiro-canvas');
    this.options = Object.assign({
      onPet: null,
      initialWellbeing: 75,
      isSleeping: false,
      wellRested: false
    }, options);

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Groups & Meshes
    this.kiroGroup = null;
    this.bodyMesh = null;
    this.bellyMesh = null;
    this.snoutMesh = null;
    this.leftFlipper = null;
    this.rightFlipper = null;
    this.capGroup = null;
    this.auraMesh = null;
    this.sparkles = null;
    this.pedestal = null;
    this.heartParticles = [];

    // State & Dynamics
    this.animTime = 0;
    this.wellbeing = this.options.initialWellbeing;
    this.isSleeping = this.options.isSleeping;
    this.isWellRested = this.options.wellRested;
    this.isPetting = false;
    this.isChewing = false;
    this.moodTier = 'happy';

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.init();
  }

  init() {
    if (!this.canvas || typeof THREE === 'undefined') {
      console.warn('KiroScene: Canvas or THREE.js not found');
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    this.camera.position.set(0, 1.2, 6.0);

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(width, height);

    // 3. Lighting (Soft Twilight & Starlight Palette)
    const ambLight = new THREE.AmbientLight(0x94E2D5, 0.9);
    this.scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xFFF5D0, 1.8);
    dirLight.position.set(4, 8, 4);
    this.scene.add(dirLight);

    const ptLight = new THREE.PointLight(0xF5C2E7, 1.3, 12);
    ptLight.position.set(-2, 3, 2);
    this.scene.add(ptLight);

    // 4. Build Procedural Kiro & Environment
    this.buildKiroModel();
    this.buildPedestal();
    this.buildSparkles();

    // 5. Event Listeners
    this.setupInteractions();

    // 6. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildKiroModel() {
    this.kiroGroup = new THREE.Group();
    this.kiroGroup.position.set(0, 0.1, 0);

    // Body: Soft Mint-Teal Sphere
    const bodyGeo = new THREE.SphereGeometry(1.0, 32, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x4EC9B0,
      roughness: 0.85,
      metalness: 0.05
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.scale.set(1, 0.92, 1);
    this.kiroGroup.add(this.bodyMesh);

    // Belly: Creamy Off-White Front Patch
    const bellyGeo = new THREE.SphereGeometry(0.55, 24, 24);
    const bellyMat = new THREE.MeshStandardMaterial({
      color: 0xF0EDE8,
      roughness: 0.9
    });
    this.bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
    this.bellyMesh.position.set(0, -0.15, 0.72);
    this.bellyMesh.scale.set(1, 1, 0.35);
    this.kiroGroup.add(this.bellyMesh);

    // Eyes: Glossy Obsidian Spheres with Starlight Highlights
    const eyeGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1A3A3A, roughness: 0.2 });
    const hlGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

    [-0.28, 0.28].forEach(x => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(x, 0.22, 0.92);
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      const hl = new THREE.Mesh(hlGeo, hlMat);
      hl.position.set(0.03, 0.04, 0.07);
      eyeGroup.add(eye);
      eyeGroup.add(hl);
      this.kiroGroup.add(eyeGroup);
    });

    // Snout / Nose: Pastel Pink Button
    const snoutGeo = new THREE.SphereGeometry(0.055, 12, 12);
    const snoutMat = new THREE.MeshStandardMaterial({ color: 0xF5B7C0, roughness: 0.9 });
    this.snoutMesh = new THREE.Mesh(snoutGeo, snoutMat);
    this.snoutMesh.position.set(0, 0.04, 0.99);
    this.kiroGroup.add(this.snoutMesh);

    // Cheeks: Translucent Blush Discs
    const cheekGeo = new THREE.CircleGeometry(0.18, 16);
    const cheekMat = new THREE.MeshBasicMaterial({
      color: 0xFFB6C1,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    [-0.55, 0.55].forEach((x, i) => {
      const cheek = new THREE.Mesh(cheekGeo, cheekMat);
      cheek.position.set(x, -0.02, 0.86);
      cheek.rotation.y = i === 0 ? -0.4 : 0.4;
      this.kiroGroup.add(cheek);
    });

    // Flippers / Paws
    const flipperGeo = new THREE.SphereGeometry(0.24, 12, 12);
    const flipperMat = new THREE.MeshStandardMaterial({ color: 0x4EC9B0, roughness: 0.85 });

    this.leftFlipper = new THREE.Mesh(flipperGeo, flipperMat);
    this.leftFlipper.position.set(-1.0, -0.24, 0.28);
    this.leftFlipper.scale.set(0.55, 0.45, 0.45);
    this.leftFlipper.rotation.set(0.1, 0, 0.45);
    this.kiroGroup.add(this.leftFlipper);

    this.rightFlipper = new THREE.Mesh(flipperGeo, flipperMat);
    this.rightFlipper.position.set(1.0, -0.24, 0.28);
    this.rightFlipper.scale.set(0.55, 0.45, 0.45);
    this.rightFlipper.rotation.set(0.1, 0, -0.45);
    this.kiroGroup.add(this.rightFlipper);

    // Sleeping Nightcap (Lavender cone with golden pompom)
    this.capGroup = new THREE.Group();
    this.capGroup.position.set(0, 0.85, 0);
    this.capGroup.rotation.z = 0.3;

    const coneGeo = new THREE.ConeGeometry(0.3, 0.65, 16);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xCBA6F7, roughness: 0.9 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    this.capGroup.add(cone);

    const pomGeo = new THREE.SphereGeometry(0.07, 10, 10);
    const pomMat = new THREE.MeshBasicMaterial({ color: 0xF9E2AF });
    const pom = new THREE.Mesh(pomGeo, pomMat);
    pom.position.set(0, 0.35, 0);
    this.capGroup.add(pom);

    this.capGroup.visible = this.isSleeping;
    this.kiroGroup.add(this.capGroup);

    // Well-Rested Golden Aura
    const auraGeo = new THREE.SphereGeometry(1.4, 20, 20);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xF9E2AF,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide
    });
    this.auraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.auraMesh.visible = this.isWellRested;
    this.kiroGroup.add(this.auraMesh);

    this.scene.add(this.kiroGroup);
  }

  buildPedestal() {
    const islandGeo = new THREE.CylinderGeometry(1.8, 1.2, 0.4, 28);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x1B2A38, roughness: 0.8 });
    this.pedestal = new THREE.Mesh(islandGeo, islandMat);
    this.pedestal.position.set(0, -1.2, 0);
    this.scene.add(this.pedestal);

    // Emerald Glowing Ring
    const ringGeo = new THREE.RingGeometry(0, 1.8, 28);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x94E2D5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, -1.0, 0);
    this.scene.add(ring);
  }

  buildSparkles() {
    const sparkCount = 35;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);

    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3] = (Math.random() - 0.5) * 6;
      sparkPos[i * 3 + 1] = Math.random() * 4 - 1;
      sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      size: 0.085,
      color: 0xF9E2AF,
      transparent: true,
      opacity: 0.75
    });
    this.sparkles = new THREE.Points(sparkGeo, sparkMat);
    this.scene.add(this.sparkles);
  }

  // ==========================================
  // INTERACTIVITY & PETTING ANIMATIONS
  // ==========================================

  setupInteractions() {
    const onPointerDown = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      if (clientX === undefined || clientY === undefined) return;

      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObject(this.kiroGroup, true);

      if (intersects.length > 0) {
        this.triggerPettingReaction();
      }
    };

    this.canvas.addEventListener('pointerdown', onPointerDown);
  }

  /**
   * Springy Petting Animation Chain:
   * Leaps into the air, does a cheerful 360° spin, squishes softly upon landing,
   * and bursts glowing pink heart stardust particles.
   */
  triggerPettingReaction() {
    if (this.isPetting || this.isSleeping) return;
    this.isPetting = true;

    // Sound effect
    if (window.synthEngine) {
      window.synthEngine.playStarlightChime();
    }

    // GSAP animation or procedural fallback
    if (typeof gsap !== 'undefined') {
      const startScale = this.kiroGroup.scale.x;
      const tl = gsap.timeline({
        onComplete: () => {
          this.isPetting = false;
        }
      });

      // Leap & Spin
      tl.to(this.kiroGroup.position, { y: 0.65, duration: 0.28, ease: 'power2.out' })
        .to(this.kiroGroup.rotation, { y: this.kiroGroup.rotation.y + Math.PI * 2, duration: 0.45, ease: 'power1.inOut' }, 0)
        .to(this.leftFlipper.rotation, { z: 0.9, duration: 0.2, yoyo: true, repeat: 2 }, 0)
        .to(this.rightFlipper.rotation, { z: -0.9, duration: 0.2, yoyo: true, repeat: 2 }, 0)
        .to(this.kiroGroup.position, { y: 0.1, duration: 0.25, ease: 'bounce.out' })
        // Landing squish
        .to(this.kiroGroup.scale, { x: startScale * 1.15, y: startScale * 0.85, duration: 0.1 }, '-=0.15')
        .to(this.kiroGroup.scale, { x: startScale, y: startScale, duration: 0.2, ease: 'elastic.out(1, 0.4)' });
    } else {
      this.isPetting = false;
    }

    this.spawnHeartBurst();
    if (typeof this.options.onPet === 'function') {
      this.options.onPet();
    }
  }

  spawnHeartBurst() {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const heartGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const heartMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.4 ? 0xF5C2E7 : 0xF9E2AF,
        transparent: true,
        opacity: 0.9
      });
      const p = new THREE.Mesh(heartGeo, heartMat);
      p.position.set(
        (Math.random() - 0.5) * 0.6,
        0.3 + Math.random() * 0.4,
        0.8 + Math.random() * 0.4
      );
      p.userData = {
        vx: (Math.random() - 0.5) * 0.04,
        vy: 0.03 + Math.random() * 0.04,
        vz: (Math.random() - 0.5) * 0.04,
        life: 1.0
      };
      this.scene.add(p);
      this.heartParticles.push(p);
    }
  }

  // ==========================================
  // STATE SETTERS & MOOD DYNAMICS
  // ==========================================

  setWellbeing(score) {
    this.wellbeing = Math.max(0, Math.min(100, score));
    if (this.wellbeing >= 85) this.moodTier = 'thriving';
    else if (this.wellbeing >= 65) this.moodTier = 'happy';
    else if (this.wellbeing >= 40) this.moodTier = 'okay';
    else if (this.wellbeing >= 15) this.moodTier = 'low';
    else this.moodTier = 'critical';
  }

  setSleeping(sleeping) {
    this.isSleeping = !!sleeping;
    if (this.capGroup) this.capGroup.visible = this.isSleeping;
  }

  setWellRested(wellRested) {
    this.isWellRested = !!wellRested;
    if (this.auraMesh) this.auraMesh.visible = this.isWellRested;
  }

  getSnoutPosition() {
    const v = new THREE.Vector3();
    if (this.snoutMesh) {
      this.snoutMesh.getWorldPosition(v);
    } else {
      v.set(0, 0.15, 0.85);
    }
    return v;
  }

  getPedestalY() {
    return -1.0;
  }

  // ==========================================
  // RENDER LOOP
  // ==========================================

  animate() {
    if (!this.renderer || !this.scene) return;
    requestAnimationFrame(this.animate);

    this.animTime += 0.02;
    const t = this.animTime;

    // Mood-Reactive Idle Bobbing
    if (this.kiroGroup && !this.isPetting && !this.isChewing) {
      const targetScale = 0.4 + 0.7 * Math.pow(this.wellbeing / 100, 2);
      this.kiroGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);

      if (this.isSleeping) {
        // Deep, calm sleep breathing
        this.kiroGroup.position.y = 0.08 + Math.sin(t * 1.0) * 0.02;
        this.kiroGroup.rotation.z = Math.sin(t * 0.5) * 0.025;
      } else if (this.moodTier === 'thriving') {
        // High-energy bounce and wiggle
        this.kiroGroup.position.y = 0.15 + Math.sin(t * 3.2) * 0.12;
        this.kiroGroup.rotation.z = Math.sin(t * 2.2) * 0.045;
        this.kiroGroup.rotation.y = Math.sin(t * 1.2) * 0.15;
      } else if (this.moodTier === 'happy') {
        // Content rhythmic floating
        this.kiroGroup.position.y = 0.1 + Math.sin(t * 1.6) * 0.06;
        this.kiroGroup.rotation.y = Math.sin(t * 0.8) * 0.08;
      } else {
        // Sluggish low-energy breathing
        this.kiroGroup.position.y = 0.05 + Math.sin(t * 0.8) * 0.02;
      }
    }

    // Sparkles Rotation
    if (this.sparkles) {
      this.sparkles.rotation.y += 0.002;
      this.sparkles.rotation.x += 0.0005;
    }

    // Heart particles animation
    for (let i = this.heartParticles.length - 1; i >= 0; i--) {
      const p = this.heartParticles[i];
      p.position.x += p.userData.vx;
      p.position.y += p.userData.vy;
      p.position.z += p.userData.vz;
      p.userData.life -= 0.025;
      p.material.opacity = Math.max(0, p.userData.life);

      if (p.userData.life <= 0) {
        this.scene.remove(p);
        this.heartParticles.splice(i, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.KiroScene = KiroScene;
