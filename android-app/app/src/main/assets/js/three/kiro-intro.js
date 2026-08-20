/**
 * Kiro Intro & Character Selection Module (kiro-intro.js)
 * Implements a 3D light-speed cosmic travel warp using Three.js particles, 
 * synced with cinematic Web Audio synthesizer swooshes, and displays a
 * high-fidelity SVG selection portal to choose between Pat and Yang.
 */

class KiroIntro {
    /**
     * @param {string|HTMLElement} parentId DOM container ID or HTMLElement where the intro mounts
     * @param {function} onComplete Callback invoked with 'pat' or 'yang' once selection is finalized
     */
    constructor(parentId, onComplete) {
        if (typeof parentId === 'string') {
            this.parent = document.getElementById(parentId) || document.body;
        } else if (parentId instanceof HTMLElement) {
            this.parent = parentId;
        } else {
            this.parent = document.body;
        }

        this.onComplete = onComplete;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.starField = null;
        this.starCount = 800;
        this.audioCtx = null;
        this.warpTimeline = null;

        // Space flight configuration
        this.warpSpeed = 0.05;
        this.isWarping = true;
        this.starsGeometry = null;

        this.init();
    }

    init() {
        // 1. Create HTML Elements (Overlay Layout structure)
        this.buildHTMLLayout();

        // 2. Setup Three.js 3D Starfield Warp Scene
        this.setupThreeScene();

        // 3. Audio Synth - Pre-initialize Audio Context
        this.initAudioContext();

        // 4. Trigger Widescreen Cinematic Sequence
        this.startCinematicSequence();
    }

    buildHTMLLayout() {
        // Main Screen Wrapper
        this.screenElement = document.createElement('div');
        this.screenElement.id = 'intro-screen';
        
        // 3D canvas backdrop container
        this.canvasContainer = document.createElement('div');
        this.canvasContainer.id = 'intro-canvas-container';
        this.screenElement.appendChild(this.canvasContainer);

        // Cinematic black bars (letterboxing)
        const topBar = document.createElement('div');
        topBar.className = 'cinematic-bar top';
        const bottomBar = document.createElement('div');
        bottomBar.className = 'cinematic-bar bottom';
        this.screenElement.appendChild(topBar);
        this.screenElement.appendChild(bottomBar);

        // Subtitles/Loglines overlay
        this.subtitles = document.createElement('div');
        this.subtitles.id = 'intro-subtitle';
        this.subtitles.innerText = "...Initiating Hyperdrive...";
        this.screenElement.appendChild(this.subtitles);

        // Character Selection Portals Layout (Fades in after warp slows down)
        this.selectionUI = document.createElement('div');
        this.selectionUI.id = 'selection-ui';
        this.selectionUI.innerHTML = `
            <h2 class="selection-title">CHOOSE YOUR <span>COMPANION PORTAL</span></h2>
            <div class="portals-grid">
                <!-- Patrick Portal -->
                <div class="portal-card pat" data-user="pat">
                    <div class="portal-glow"></div>
                    <div class="portal-icon-area">
                        <!-- Space Helmet Vector SVG -->
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="46" r="30" stroke="#4EC9B0" stroke-width="2.5" stroke-dasharray="4 2"/>
                            <!-- Visor outline -->
                            <path d="M26 48C26 34.7452 36.7452 24 50 24C63.2548 24 74 34.7452 74 48C74 53 71 61 68 64H32C29 61 26 53 26 48Z" fill="rgba(78,201,176,0.1)" stroke="#4EC9B0" stroke-width="3"/>
                            <!-- Visor Highlight -->
                            <path d="M34 34C40 29 48 28 54 30" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
                            <!-- Collar connection -->
                            <path d="M35 64V72H65V64" stroke="#4EC9B0" stroke-width="2.5" stroke-linejoin="round"/>
                            <rect x="30" y="72" width="40" height="6" rx="3" fill="rgba(78,201,176,0.2)" stroke="#4EC9B0" stroke-width="2"/>
                            <!-- Left/Right antennas -->
                            <line x1="18" y1="46" x2="25" y2="46" stroke="#4EC9B0" stroke-width="2.5"/>
                            <line x1="75" y1="46" x2="82" y2="46" stroke="#4EC9B0" stroke-width="2.5"/>
                            <circle cx="16" cy="46" r="2.5" fill="#4EC9B0"/>
                            <circle cx="84" cy="46" r="2.5" fill="#4EC9B0"/>
                        </svg>
                    </div>
                    <div class="portal-name">Patrick</div>
                    <div class="portal-role">Cosmic Explorer</div>
                </div>

                <!-- Yangiee Portal -->
                <div class="portal-card yang" data-user="yang">
                    <div class="portal-glow"></div>
                    <div class="portal-icon-area">
                        <!-- Sweet Neko/Cat Vector SVG -->
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <!-- Outter cosmic ring -->
                            <circle cx="50" cy="50" r="32" stroke="#FFB6C1" stroke-dasharray="6 3" stroke-width="2"/>
                            <!-- Cat Head Contour -->
                            <path d="M24 48C24 33.64 35.64 26 50 26C64.36 26 76 33.64 76 48C76 60 68 68 50 68C32 68 24 60 24 48Z" fill="rgba(255,182,193,0.1)" stroke="#FFB6C1" stroke-width="3"/>
                            <!-- Cat Ears -->
                            <path d="M26 31L40 33L31 16L26 31Z" fill="#FFB6C1" stroke="#FFB6C1" stroke-width="2.5" stroke-linejoin="round"/>
                            <path d="M74 31L60 33L69 16L74 31Z" fill="#FFB6C1" stroke="#FFB6C1" stroke-width="2.5" stroke-linejoin="round"/>
                            <!-- Whiskers -->
                            <path d="M16 48H28M18 54H27" stroke="#FFB6C1" stroke-width="2" stroke-linecap="round"/>
                            <path d="M84 48H72M82 54H73" stroke="#FFB6C1" stroke-width="2" stroke-linecap="round"/>
                            <!-- Sleepy cat eyelids -->
                            <path d="M37 46C37 48 41 48 41 46" stroke="#FFB6C1" stroke-width="2.5" stroke-linecap="round"/>
                            <path d="M59 46C59 48 63 48 63 46" stroke="#FFB6C1" stroke-width="2.5" stroke-linecap="round"/>
                            <!-- Little nose mouth -->
                            <path d="M47 52L50 54L53 52" stroke="#FFB6C1" stroke-width="2" stroke-linecap="round"/>
                            <path d="M48 57C49 57.5 50 57.5 51 57" stroke="#FFB6C1" stroke-width="1.5"/>
                        </svg>
                    </div>
                    <div class="portal-name">Yangiee</div>
                    <div class="portal-role">Celestial Dreamer</div>
                </div>
            </div>
        `;
        this.screenElement.appendChild(this.selectionUI);

        // Mount the whole screen component to the designated parent element
        this.parent.appendChild(this.screenElement);

        // Bind events
        this.selectionUI.querySelectorAll('.portal-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const selectedUser = e.currentTarget.getAttribute('data-user');
                this.triggerSelectionFinalize(selectedUser);
            });
            card.addEventListener('mouseenter', () => this.playSynthTone(card.classList.contains('pat') ? 329.63 : 440.00)); // E4 or A4 notes
        });
    }

    setupThreeScene() {
        const width = this.canvasContainer.clientWidth || window.innerWidth;
        const height = this.canvasContainer.clientHeight || window.innerHeight;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0A0F1D, 0.005);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.z = 5;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.canvasContainer.appendChild(this.renderer.domElement);

        // Build Particle Starfield
        this.starsGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.starCount * 3);
        const originalZ = []; // Cache initial depths for warping math

        for (let i = 0; i < this.starCount; i++) {
            // Radial distribution inside a star tunnel
            const angle = Math.random() * Math.PI * 2;
            const radius = 2.0 + Math.random() * 25; // wide tunnel clearance
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius;
            
            // Scatter widely along depth (Z) axis
            const depth = Math.random() * -300;
            positions[i * 3 + 2] = depth;
            originalZ.push(depth);
        }

        this.starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.starsGeometry.userData = { originalZ: originalZ };

        // Soft, high-contrast additive star dots
        const starMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.7,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.starField = new THREE.Points(this.starsGeometry, starMaterial);
        this.scene.add(this.starField);

        // Handle scaling
        this._resizeHandler = () => this.handleResize();
        window.addEventListener('resize', this._resizeHandler);

        // Kickoff Render Loop
        this.animate();
    }

    initAudioContext() {
        // Prepare context but don't start till user interaction or sequence trigger
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            this.audioCtx = new AudioCtx();
        }
    }

    playSynthTone(frequency) {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        // Create a dreamy glass sound on card hover
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
        // Overtones
        osc.frequency.exponentialRampToValueAtTime(frequency * 2, this.audioCtx.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.8);

        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.8);
    }

    playCinematicSwoosh() {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const bufferSize = this.audioCtx.sampleRate * 2.5; // 2.5 second swoop
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Populate pink noise-like characteristics
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11; // normalise volume
            b6 = white * 0.115926;
        }

        const noiseSource = this.audioCtx.createBufferSource();
        noiseSource.buffer = buffer;

        // Bandpass sweeps to create the hyperdrive dynamic whoosh
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 3.0;
        filter.frequency.setValueAtTime(100, this.audioCtx.currentTime);
        // Exponential sweep upwards to represent travel compression
        filter.frequency.exponentialRampToValueAtTime(1800, this.audioCtx.currentTime + 1.2);
        filter.frequency.exponentialRampToValueAtTime(80, this.audioCtx.currentTime + 2.5);

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, this.audioCtx.currentTime + 0.8);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 2.5);

        noiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        noiseSource.start();
    }

    startCinematicSequence() {
        if (typeof gsap === 'undefined') {
            console.warn("GSAP is required for KiroIntro animations.");
            return;
        }

        // Create an organic timeline sequence for subtitles & warp velocity edits
        this.warpTimeline = gsap.timeline();

        // Step 1: Reveal first subtitles
        this.warpTimeline.to(this.subtitles, {
            opacity: 1,
            duration: 1.2,
            onStart: () => {
                this.playCinematicSwoosh();
            }
        })
        .to(this.subtitles, {
            opacity: 0,
            duration: 1.0,
            delay: 1.0
        })
        // Step 2: Accelerate Starfield to high velocity (Warp speed!)
        .to(this, {
            warpSpeed: 3.8,
            duration: 1.5,
            ease: "power2.in",
            onStart: () => {
                this.subtitles.innerText = "Cruising the Celestial Veil...";
                gsap.to(this.subtitles, { opacity: 0.8, duration: 0.5 });
            }
        })
        // Step 3: Drift through the hyperspace tunnel
        .to(this, {
            warpSpeed: 4.5,
            duration: 1.5,
            delay: 0.5
        })
        .to(this.subtitles, {
            opacity: 0,
            duration: 0.8
        })
        // Step 4: Slam on the hyper-brakes (Decelerate smoothly)
        .to(this, {
            warpSpeed: 0.08,
            duration: 2.2,
            ease: "power4.out",
            onStart: () => {
                this.subtitles.innerText = "Arriving at Kiro's Coordinates...";
                gsap.to(this.subtitles, { opacity: 0.9, duration: 0.5 });
            }
        })
        // Step 5: Transition into the selection screen interface
        .to(this, {
            opacity: 0,
            duration: 0.8,
            onComplete: () => {
                this.isWarping = false; // Transition to slow orbital drift
                
                // Slide away the widescreen cinematic bars!
                const topBar = this.screenElement.querySelector('.cinematic-bar.top');
                const bottomBar = this.screenElement.querySelector('.cinematic-bar.bottom');
                if (topBar) topBar.classList.add('hide');
                if (bottomBar) bottomBar.classList.add('hide');

                // Fade in the selection cards portal
                if (this.selectionUI) this.selectionUI.classList.add('show');
            }
        });
    }

    triggerSelectionFinalize(user) {
        // Subdued sound on final portal select
        this.playSynthTone(user === 'pat' ? 440.00 : 523.25); // high note anchor

        if (typeof gsap === 'undefined') {
            this.destroy();
            if (this.onComplete) this.onComplete(user);
            return;
        }

        // Visual exit timeline
        const exitTl = gsap.timeline();
        
        // Hide selection layout
        exitTl.to(this.selectionUI, {
            opacity: 0,
            scale: 1.1,
            duration: 0.8,
            ease: "power3.in"
        })
        // Rapid particle burst sweep
        .to(this, {
            warpSpeed: 10.0,
            duration: 0.6,
            ease: "power2.in"
        }, 0)
        // Fade the screen overlay completely
        .to(this.screenElement, {
            opacity: 0,
            duration: 1.2,
            onComplete: () => {
                // Destroy the scene elements to free WebGL memory
                this.destroy();
                // Trigger client-side initialization
                if (this.onComplete) {
                    this.onComplete(user);
                }
            }
        });
    }

    handleResize() {
        if (!this.canvasContainer || !this.camera || !this.renderer) return;
        const width = this.canvasContainer.clientWidth || window.innerWidth;
        const height = this.canvasContainer.clientHeight || window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        if (this.renderer) {
            requestAnimationFrame(() => this.animate());
        } else {
            return; // Destroy loop on cleanup
        }

        const positions = this.starsGeometry.attributes.position.array;
        const count = positions.length / 3;

        for (let i = 0; i < count; i++) {
            // Apply forward velocity (along Z axis towards camera)
            positions[i * 3 + 2] += this.warpSpeed;

            // Warp Stretch Effect: If moving fast, pull coordinates slightly outward to simulate optical compression
            if (this.isWarping && this.warpSpeed > 1.0) {
                positions[i * 3] += (positions[i * 3] * 0.005);
                positions[i * 3 + 1] += (positions[i * 3 + 1] * 0.005);
            }

            // Recycle stars that pass the camera back into the deep background
            if (positions[i * 3 + 2] > 10) {
                positions[i * 3 + 2] = -300;
                
                // Distribute fresh coordinates randomly
                const angle = Math.random() * Math.PI * 2;
                const radius = 2.0 + Math.random() * 25;
                positions[i * 3] = Math.cos(angle) * radius;
                positions[i * 3 + 1] = Math.sin(angle) * radius;
            }
        }

        this.starsGeometry.attributes.position.needsUpdate = true;

        // Slow cinematic camera rotation for aesthetic movement
        const time = Date.now() * 0.0003;
        if (!this.isWarping && this.starField) {
            this.starField.rotation.z = time * 0.1;
            this.camera.position.x = Math.sin(time) * 0.5;
            this.camera.position.y = Math.cos(time) * 0.5;
        }

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        window.removeEventListener('resize', this._resizeHandler);

        // Terminate WebAudio to prevent channel leaks
        if (this.audioCtx) {
            try {
                this.audioCtx.close();
            } catch (e) {}
            this.audioCtx = null;
        }

        // Dispose ThreeJS memory safely
        if (this.starField && this.scene) {
            this.scene.remove(this.starField);
            if (this.starsGeometry) this.starsGeometry.dispose();
            if (this.starField.material) this.starField.material.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.remove();
            }
            this.renderer = null;
        }

        this.scene = null;
        this.camera = null;

        // Clean up DOM wrapper
        if (this.screenElement && this.screenElement.parentNode) {
            this.screenElement.parentNode.removeChild(this.screenElement);
        }
    }
}

// Global export
window.KiroIntro = KiroIntro;
