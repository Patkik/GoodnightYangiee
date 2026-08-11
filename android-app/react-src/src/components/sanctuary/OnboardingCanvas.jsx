import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/appStore.js';

export default function OnboardingCanvas() {
  const canvasRef = useRef(null);
  const onboardingPhase = useAppStore(s => s.onboardingPhase);
  const setOnboardingPhase = useAppStore(s => s.setOnboardingPhase);
  const hoveredPersona = useAppStore(s => s.hoveredPersona);

  const startTimeRef = useRef(null);
  const lastPhaseRef = useRef(null);

  // Preloaded character images
  const patImgRef = useRef(null);
  const yangImgRef = useRef(null);

  useEffect(() => {
    // Preload 3D character images
    const patImg = new Image();
    patImg.src = 'pat_3d.png';
    patImgRef.current = patImg;

    const yangImg = new Image();
    yangImg.src = 'yang_3d.png';
    yangImgRef.current = yangImg;
  }, []);

  useEffect(() => {
    if (!onboardingPhase) {
      startTimeRef.current = null;
      lastPhaseRef.current = null;
      return;
    }

    if (startTimeRef.current === null || (onboardingPhase === 1 && lastPhaseRef.current !== 1)) {
      startTimeRef.current = Date.now();
    }
    lastPhaseRef.current = onboardingPhase;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Stars particle pool
    const numStars = 160;
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.006,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
    }));

    // Atmospheric descent reentry plasma trails
    const numTrails = 60;
    const trails = Array.from({ length: numTrails }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      length: Math.random() * 160 + 100,
      speed: Math.random() * 18 + 12,
      alpha: Math.random() * 0.85 + 0.2,
      width: Math.random() * 2.5 + 1.2,
      color: Math.random() > 0.5 ? 'rgba(249, 226, 175, ' : (Math.random() > 0.5 ? 'rgba(148, 226, 213, ' : 'rgba(245, 194, 231, '),
    }));

    // Landing spark burst particles
    const sparks = Array.from({ length: 40 }, () => ({
      x: 0,
      y: 0,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.5) * 10 - 4,
      alpha: 1,
      size: Math.random() * 3 + 1.5,
      color: Math.random() > 0.5 ? '#F9E2AF' : '#94E2D5',
    }));

    const render = () => {
      const now = Date.now();
      const elapsed = (now - (startTimeRef.current || now)) / 1000;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Phase timeline mapping
      let targetPhase = 1;
      if (elapsed >= 3.5 && elapsed < 7.0) {
        targetPhase = 2;
      } else if (elapsed >= 7.0 && elapsed < 9.5) {
        targetPhase = 3;
      } else if (elapsed >= 9.5) {
        targetPhase = 5;
      }

      if (onboardingPhase !== targetPhase && onboardingPhase !== 5) {
        setOnboardingPhase(targetPhase);
      }

      const currentPhase = onboardingPhase || targetPhase;

      // ─── 1. DYNAMIC COSMIC BACKGROUND & NEBULA ─────────────────────────────
      const bgGrad = ctx.createRadialGradient(W / 2, H * 0.4, 10, W / 2, H / 2, Math.max(W, H));
      if (currentPhase === 1) {
        bgGrad.addColorStop(0, '#1E192C');
        bgGrad.addColorStop(0.5, '#13111E');
        bgGrad.addColorStop(1, '#09080F');
      } else if (currentPhase === 2) {
        const progress = Math.min((elapsed - 3.5) / 3.5, 1);
        bgGrad.addColorStop(0, `rgba(45, 30, 65, ${1 - progress * 0.25})`);
        bgGrad.addColorStop(0.5, `rgba(28, 20, 42, ${1 - progress * 0.15})`);
        bgGrad.addColorStop(1, '#0D0B18');
      } else {
        bgGrad.addColorStop(0, '#1E1E2E');
        bgGrad.addColorStop(0.6, '#1B192A');
        bgGrad.addColorStop(1, '#110F1D');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Nebulae clouds
      const timeSec = elapsed * 0.6;
      const neb1X = W * 0.3 + Math.sin(timeSec) * 40;
      const neb1Y = H * 0.3 + Math.cos(timeSec * 0.8) * 30;
      const nebGrad1 = ctx.createRadialGradient(neb1X, neb1Y, 20, neb1X, neb1Y, 340);
      nebGrad1.addColorStop(0, 'rgba(249, 226, 175, 0.1)');
      nebGrad1.addColorStop(0.5, 'rgba(203, 166, 247, 0.05)');
      nebGrad1.addColorStop(1, 'transparent');
      ctx.fillStyle = nebGrad1;
      ctx.fillRect(0, 0, W, H);

      const neb2X = W * 0.7 + Math.cos(timeSec * 0.7) * 40;
      const neb2Y = H * 0.5 + Math.sin(timeSec * 0.9) * 30;
      const nebGrad2 = ctx.createRadialGradient(neb2X, neb2Y, 20, neb2X, neb2Y, 360);
      nebGrad2.addColorStop(0, 'rgba(148, 226, 213, 0.11)');
      nebGrad2.addColorStop(0.5, 'rgba(245, 194, 231, 0.04)');
      nebGrad2.addColorStop(1, 'transparent');
      ctx.fillStyle = nebGrad2;
      ctx.fillRect(0, 0, W, H);

      // ─── 2. STAR PARTICLES ──────────────────────────────────────────────────
      stars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.1) star.speed = -star.speed;
        
        if (currentPhase === 2) {
          star.y += (star.radius * 5.5);
          if (star.y > H) star.y = 0;
        } else {
          star.x += star.vx;
          star.y += star.vy;
          if (star.x < 0) star.x = W;
          if (star.x > W) star.x = 0;
          if (star.y < 0) star.y = H;
          if (star.y > H) star.y = 0;
        }

        ctx.fillStyle = `rgba(239, 241, 245, ${star.alpha * 0.88})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // ─── 3. PHASE 2 SPECTACULAR DESCENT REENTRY TRAILS & FRICTION AURA ──────
      if (currentPhase === 2) {
        // High speed reentry light trails
        trails.forEach(t => {
          t.y += t.speed;
          if (t.y > H + t.length) {
            t.y = -t.length;
            t.x = Math.random() * W;
          }
          const grad = ctx.createLinearGradient(t.x, t.y - t.length, t.x, t.y);
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(0.7, `${t.color}${t.alpha * 0.6})`);
          grad.addColorStop(1, `${t.color}${t.alpha})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = t.width;
          ctx.beginPath();
          ctx.moveTo(t.x, t.y - t.length);
          ctx.lineTo(t.x, t.y);
          ctx.stroke();
        });

        // Atmospheric entry friction glow core
        const frictionGlow = ctx.createRadialGradient(W / 2, H * 0.5, 20, W / 2, H * 0.5, 280);
        frictionGlow.addColorStop(0, 'rgba(249, 226, 175, 0.18)');
        frictionGlow.addColorStop(0.5, 'rgba(245, 194, 231, 0.12)');
        frictionGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = frictionGlow;
        ctx.fillRect(0, 0, W, H);
      }

      // ─── 4. CHARACTER POSITIONS & 3D AVATAR RENDERING ──────────────────────
      let patX = W * 0.35;
      let patY = H * 0.58;
      let yangX = W * 0.65;
      let yangY = H * 0.58;

      let patScale = 1;
      let yangScale = 1;
      let jitterX = 0;
      let jitterY = 0;

      if (currentPhase === 1) {
        // Phase 1: Cosmic Play — Floating orbital chase
        const t = elapsed * 1.5;
        patX = W * 0.40 + Math.cos(t) * 110;
        patY = H * 0.44 + Math.sin(t * 1.2) * 60;

        yangX = W * 0.60 + Math.cos(t + Math.PI) * 110;
        yangY = H * 0.44 + Math.sin(t * 1.2 + Math.PI * 0.5) * 60;
      } else if (currentPhase === 2) {
        // Phase 2: Atmospheric Descent — Plunge downward with speed jitter
        const prog = Math.min((elapsed - 3.5) / 3.5, 1);
        const easeProg = Math.pow(prog, 2);

        jitterX = (Math.random() - 0.5) * 4;
        jitterY = (Math.random() - 0.5) * 4;

        patX = W * 0.40 - (1 - easeProg) * 40 + jitterX;
        patY = H * 0.30 + easeProg * (H * 0.28) + jitterY;

        yangX = W * 0.60 + (1 - easeProg) * 40 + jitterX;
        yangY = H * 0.30 + easeProg * (H * 0.28) + jitterY;

        // Friction burn ring behind character descent
        [ { x: patX, c: 'rgba(249, 226, 175, 0.4)' }, { x: yangX, c: 'rgba(148, 226, 213, 0.4)' } ].forEach(char => {
          const burnGlow = ctx.createRadialGradient(char.x, patY - 20, 5, char.x, patY - 20, 60);
          burnGlow.addColorStop(0, char.c);
          burnGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = burnGlow;
          ctx.beginPath();
          ctx.arc(char.x, patY - 20, 60, 0, Math.PI * 2);
          ctx.fill();
        });

      } else if (currentPhase === 3 || currentPhase === 4) {
        // Phase 3 & 4: Touchdown & Sonic shockwave ripple
        const prog = Math.min((elapsed - 7.0) / 2.5, 1);
        patX = W * 0.34;
        patY = H * 0.58;
        yangX = W * 0.66;
        yangY = H * 0.58;

        // Shockwave ripple at landing
        if (prog < 0.6) {
          const ringR = prog * 360;
          ctx.strokeStyle = `rgba(249, 226, 175, ${0.6 - prog})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(W / 2, H * 0.72, ringR, ringR * 0.25, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Spark particles
          if (prog < 0.3) {
            sparks.forEach(s => {
              if (s.x === 0) { s.x = W / 2; s.y = H * 0.72; }
              s.x += s.vx;
              s.y += s.vy;
              s.alpha -= 0.03;
              if (s.alpha > 0) {
                ctx.fillStyle = s.color;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
              }
            });
          }
        }
      } else {
        // Phase 5: Selection Stage Idle with Hover Physics
        const idleWiggle = Math.sin(now / 700) * 4;
        const breathY = Math.sin(now / 1100) * 3;

        patX = W * 0.32;
        patY = H * 0.56 + breathY;

        yangX = W * 0.68;
        yangY = H * 0.56 + breathY + idleWiggle * 0.5;

        if (hoveredPersona === 'pat') {
          patX += 20;
          patScale = 1.12;
          yangScale = 0.90;
        } else if (hoveredPersona === 'yang') {
          yangX -= 20;
          yangScale = 1.12;
          patScale = 0.90;
        }
      }

      // ─── 5. PLANET HORIZON CANVAS LOCK (Phase 3+) ──────────────────────────
      if (currentPhase >= 3) {
        const horizonY = H * 0.72;
        const horizGrad = ctx.createLinearGradient(0, horizonY - 40, 0, H);
        horizGrad.addColorStop(0, 'rgba(27, 25, 42, 0)');
        horizGrad.addColorStop(0.2, 'rgba(30, 30, 46, 0.88)');
        horizGrad.addColorStop(1, 'rgba(15, 14, 25, 0.98)');
        ctx.fillStyle = horizGrad;
        ctx.fillRect(0, horizonY - 40, W, H - horizonY + 40);

        // Horizon glow line
        const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
        lineGrad.addColorStop(0, 'transparent');
        lineGrad.addColorStop(0.35, 'rgba(249, 226, 175, 0.45)');
        lineGrad.addColorStop(0.5, 'rgba(245, 194, 231, 0.65)');
        lineGrad.addColorStop(0.65, 'rgba(148, 226, 213, 0.45)');
        lineGrad.addColorStop(1, 'transparent');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(W, horizonY);
        ctx.stroke();
      }

      // ─── 6. DRAW 3D CHARACTER AVATAR MODELS & AURAS ────────────────────────
      const avatarSize = Math.min(W * 0.28, 140);

      // PAT 3D Character Avatar
      const patGlow = ctx.createRadialGradient(patX, patY, 5, patX, patY, (avatarSize * 0.7) * patScale);
      patGlow.addColorStop(0, hoveredPersona === 'pat' ? 'rgba(249, 226, 175, 0.55)' : 'rgba(249, 226, 175, 0.3)');
      patGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = patGlow;
      ctx.beginPath();
      ctx.arc(patX, patY, (avatarSize * 0.7) * patScale, 0, Math.PI * 2);
      ctx.fill();

      if (patImgRef.current && patImgRef.current.complete && patImgRef.current.naturalWidth > 0) {
        ctx.save();
        ctx.translate(patX, patY);
        ctx.scale(patScale, patScale);
        ctx.beginPath();
        ctx.arc(0, 0, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(patImgRef.current, -avatarSize / 2, -avatarSize / 2, avatarSize, avatarSize);
        ctx.restore();

        // Avatar ring border
        ctx.strokeStyle = 'rgba(249, 226, 175, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(patX, patY, (avatarSize / 2) * patScale, 0, Math.PI * 2);
        ctx.stroke();
      }

      // YANG 3D Character Avatar
      const yangGlow = ctx.createRadialGradient(yangX, yangY, 5, yangX, yangY, (avatarSize * 0.7) * yangScale);
      yangGlow.addColorStop(0, hoveredPersona === 'yang' ? 'rgba(148, 226, 213, 0.6)' : 'rgba(148, 226, 213, 0.32)');
      yangGlow.addColorStop(0.6, 'rgba(203, 166, 247, 0.2)');
      yangGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = yangGlow;
      ctx.beginPath();
      ctx.arc(yangX, yangY, (avatarSize * 0.7) * yangScale, 0, Math.PI * 2);
      ctx.fill();

      if (yangImgRef.current && yangImgRef.current.complete && yangImgRef.current.naturalWidth > 0) {
        ctx.save();
        ctx.translate(yangX, yangY);
        ctx.scale(yangScale, yangScale);
        ctx.beginPath();
        ctx.arc(0, 0, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(yangImgRef.current, -avatarSize / 2, -avatarSize / 2, avatarSize, avatarSize);
        ctx.restore();

        // Avatar ring border
        ctx.strokeStyle = 'rgba(148, 226, 213, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(yangX, yangY, (avatarSize / 2) * yangScale, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Yang Glowing Arm Tattoos Pulse Effect
      const tattooPulse = (Math.sin(now / 400) + 1) / 2;
      if (currentPhase === 5 || hoveredPersona === 'yang') {
        const armGlowL = ctx.createRadialGradient(yangX - avatarSize * 0.3, yangY + avatarSize * 0.2, 2, yangX - avatarSize * 0.3, yangY + avatarSize * 0.2, 30);
        armGlowL.addColorStop(0, `rgba(148, 226, 213, ${0.5 + tattooPulse * 0.45})`);
        armGlowL.addColorStop(1, 'transparent');
        ctx.fillStyle = armGlowL;
        ctx.beginPath();
        ctx.arc(yangX - avatarSize * 0.3, yangY + avatarSize * 0.2, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onboardingPhase, setOnboardingPhase, hoveredPersona]);

  if (!onboardingPhase) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        pointerEvents: 'none',
        transition: 'opacity 0.6s ease',
      }}
    />
  );
}
