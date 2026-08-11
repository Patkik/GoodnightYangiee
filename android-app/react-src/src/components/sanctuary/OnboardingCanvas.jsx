import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/appStore.js';

export default function OnboardingCanvas() {
  const canvasRef = useRef(null);
  const onboardingPhase = useAppStore(s => s.onboardingPhase);
  const setOnboardingPhase = useAppStore(s => s.setOnboardingPhase);
  const hoveredPersona = useAppStore(s => s.hoveredPersona);

  useEffect(() => {
    if (!onboardingPhase) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let startTime = Date.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Stars particle pool
    const numStars = 140;
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.8 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
    }));

    // Atmospheric light trails
    const numTrails = 40;
    const trails = Array.from({ length: numTrails }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      length: Math.random() * 120 + 80,
      speed: Math.random() * 12 + 10,
      alpha: Math.random() * 0.7 + 0.3,
      color: Math.random() > 0.5 ? 'rgba(249, 226, 175, ' : 'rgba(148, 226, 213, ',
    }));

    const render = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000; // seconds
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Automatic phase progression based on timeline
      if (elapsed < 4.5 && onboardingPhase !== 1) {
        setOnboardingPhase(1);
      } else if (elapsed >= 4.5 && elapsed < 8.5 && onboardingPhase === 1) {
        setOnboardingPhase(2);
      } else if (elapsed >= 8.5 && elapsed < 11.5 && onboardingPhase === 2) {
        setOnboardingPhase(3);
      } else if (elapsed >= 11.5 && onboardingPhase === 3) {
        setOnboardingPhase(5);
      }

      const currentPhase = onboardingPhase || (elapsed < 4.5 ? 1 : elapsed < 8.5 ? 2 : elapsed < 11.5 ? 3 : 5);

      // ─── 1. COSMIC BACKGROUND & NEBULA ──────────────────────────────────────
      const bgGrad = ctx.createRadialGradient(W / 2, H * 0.4, 10, W / 2, H / 2, Math.max(W, H));
      if (currentPhase === 1) {
        bgGrad.addColorStop(0, '#1E192C');
        bgGrad.addColorStop(0.5, '#13111E');
        bgGrad.addColorStop(1, '#09080F');
      } else if (currentPhase === 2) {
        // Deep space transitioning to atmospheric entry
        const progress = Math.min((elapsed - 4.5) / 4, 1);
        bgGrad.addColorStop(0, `rgba(37, 27, 56, ${1 - progress * 0.3})`);
        bgGrad.addColorStop(0.5, `rgba(23, 18, 38, ${1 - progress * 0.2})`);
        bgGrad.addColorStop(1, '#0C0A14');
      } else {
        // Phase 3, 4, 5: Grounded Planet Horizon Background
        bgGrad.addColorStop(0, '#1E1E2E');
        bgGrad.addColorStop(0.6, '#1B192A');
        bgGrad.addColorStop(1, '#110F1D');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Shifting nebulae
      const timeSec = elapsed * 0.5;
      const neb1X = W * 0.3 + Math.sin(timeSec) * 40;
      const neb1Y = H * 0.3 + Math.cos(timeSec * 0.8) * 30;
      const nebGrad1 = ctx.createRadialGradient(neb1X, neb1Y, 20, neb1X, neb1Y, 300);
      nebGrad1.addColorStop(0, 'rgba(249, 226, 175, 0.08)');
      nebGrad1.addColorStop(0.5, 'rgba(203, 166, 247, 0.05)');
      nebGrad1.addColorStop(1, 'transparent');
      ctx.fillStyle = nebGrad1;
      ctx.fillRect(0, 0, W, H);

      const neb2X = W * 0.7 + Math.cos(timeSec * 0.7) * 40;
      const neb2Y = H * 0.5 + Math.sin(timeSec * 0.9) * 30;
      const nebGrad2 = ctx.createRadialGradient(neb2X, neb2Y, 20, neb2X, neb2Y, 320);
      nebGrad2.addColorStop(0, 'rgba(148, 226, 213, 0.09)');
      nebGrad2.addColorStop(0.5, 'rgba(245, 194, 231, 0.04)');
      nebGrad2.addColorStop(1, 'transparent');
      ctx.fillStyle = nebGrad2;
      ctx.fillRect(0, 0, W, H);

      // ─── 2. STAR PARTICLES ──────────────────────────────────────────────────
      stars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.1) star.speed = -star.speed;
        
        if (currentPhase === 2) {
          // Accelerate downward during descent
          star.y += (star.radius * 3.5);
          if (star.y > H) star.y = 0;
        } else {
          star.x += star.vx;
          star.y += star.vy;
          if (star.x < 0) star.x = W;
          if (star.x > W) star.x = 0;
          if (star.y < 0) star.y = H;
          if (star.y > H) star.y = 0;
        }

        ctx.fillStyle = `rgba(239, 241, 245, ${star.alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // ─── 3. PHASE 2 LIGHT TRAILS ────────────────────────────────────────────
      if (currentPhase === 2) {
        trails.forEach(t => {
          t.y += t.speed;
          if (t.y > H + t.length) {
            t.y = -t.length;
            t.x = Math.random() * W;
          }
          const grad = ctx.createLinearGradient(t.x, t.y - t.length, t.x, t.y);
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(1, `${t.color}${t.alpha})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(t.x, t.y - t.length);
          ctx.lineTo(t.x, t.y);
          ctx.stroke();
        });
      }

      // ─── 4. CHARACTER POSITIONS & PHYSICS ──────────────────────────────────
      let patX = W * 0.38;
      let patY = H * 0.62;
      let yangX = W * 0.62;
      let yangY = H * 0.62;

      let patScale = 1;
      let yangScale = 1;

      if (currentPhase === 1) {
        // Phase 1: Cosmic Play — Floating orbital chase
        const t = elapsed * 1.4;
        patX = W * 0.42 + Math.cos(t) * 90;
        patY = H * 0.45 + Math.sin(t * 1.2) * 50;

        yangX = W * 0.58 + Math.cos(t + Math.PI) * 90;
        yangY = H * 0.45 + Math.sin(t * 1.2 + Math.PI * 0.5) * 50;
      } else if (currentPhase === 2) {
        // Phase 2: Atmospheric Descent — Tilt and plunge downward
        const prog = Math.min((elapsed - 4.5) / 4, 1);
        const easeProg = Math.pow(prog, 2);

        patX = W * 0.42 - (1 - easeProg) * 30;
        patY = H * 0.35 + easeProg * (H * 0.27);

        yangX = W * 0.58 + (1 - easeProg) * 30;
        yangY = H * 0.35 + easeProg * (H * 0.27);
      } else if (currentPhase === 3 || currentPhase === 4) {
        // Phase 3 & 4: Landing & Horizon lock
        const prog = Math.min((elapsed - 8.5) / 3, 1);
        patX = W * 0.38;
        patY = H * 0.62;
        yangX = W * 0.62;
        yangY = H * 0.62;

        // Shockwave ripple at landing
        if (prog < 0.4) {
          const ringR = prog * 280;
          ctx.strokeStyle = `rgba(249, 226, 175, ${0.4 - prog})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(W / 2, H * 0.72, ringR, ringR * 0.25, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // Phase 5: Selection Stage Idle with Hover Physics
        const idleWiggle = Math.sin(now / 700) * 4;
        const breathY = Math.sin(now / 1100) * 3;

        patX = W * 0.36;
        patY = H * 0.60 + breathY;

        yangX = W * 0.64;
        yangY = H * 0.60 + breathY + idleWiggle * 0.5;

        if (hoveredPersona === 'pat') {
          patX += 15;
          patScale = 1.08;
          yangScale = 0.94;
        } else if (hoveredPersona === 'yang') {
          yangX -= 15;
          yangScale = 1.08;
          patScale = 0.94;
        }
      }

      // ─── 5. PLANET HORIZON CANVAS LOCK (Phase 3+) ──────────────────────────
      if (currentPhase >= 3) {
        const horizonY = H * 0.72;
        const horizGrad = ctx.createLinearGradient(0, horizonY - 40, 0, H);
        horizGrad.addColorStop(0, 'rgba(27, 25, 42, 0)');
        horizGrad.addColorStop(0.2, 'rgba(30, 30, 46, 0.85)');
        horizGrad.addColorStop(1, 'rgba(15, 14, 25, 0.98)');
        ctx.fillStyle = horizGrad;
        ctx.fillRect(0, horizonY - 40, W, H - horizonY + 40);

        // Stylized horizon glow line
        const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
        lineGrad.addColorStop(0, 'transparent');
        lineGrad.addColorStop(0.35, 'rgba(249, 226, 175, 0.4)');
        lineGrad.addColorStop(0.5, 'rgba(245, 194, 231, 0.6)');
        lineGrad.addColorStop(0.65, 'rgba(148, 226, 213, 0.4)');
        lineGrad.addColorStop(1, 'transparent');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(W, horizonY);
        ctx.stroke();
      }

      // ─── 6. DRAW CHARACTER AURAS & PARTICLES ──────────────────────────────
      // Pat Aura (Warm Amber)
      const patGlow = ctx.createRadialGradient(patX, patY, 5, patX, patY, 80 * patScale);
      patGlow.addColorStop(0, hoveredPersona === 'pat' ? 'rgba(249, 226, 175, 0.45)' : 'rgba(249, 226, 175, 0.25)');
      patGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = patGlow;
      ctx.beginPath();
      ctx.arc(patX, patY, 80 * patScale, 0, Math.PI * 2);
      ctx.fill();

      // Yang Aura (Bioluminescent Teal & Aurora Violet)
      const yangGlow = ctx.createRadialGradient(yangX, yangY, 5, yangX, yangY, 80 * yangScale);
      yangGlow.addColorStop(0, hoveredPersona === 'yang' ? 'rgba(148, 226, 213, 0.5)' : 'rgba(148, 226, 213, 0.28)');
      yangGlow.addColorStop(0.6, 'rgba(203, 166, 247, 0.15)');
      yangGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = yangGlow;
      ctx.beginPath();
      ctx.arc(yangX, yangY, 80 * yangScale, 0, Math.PI * 2);
      ctx.fill();

      // Yang Glowing Arm Tattoos Effect (Pulsing Teal Light)
      const tattooPulse = (Math.sin(now / 400) + 1) / 2; // 0..1
      if (currentPhase === 5 || hoveredPersona === 'yang') {
        const armGlow = ctx.createRadialGradient(yangX - 12, yangY + 10, 2, yangX - 12, yangY + 10, 25);
        armGlow.addColorStop(0, `rgba(148, 226, 213, ${0.4 + tattooPulse * 0.4})`);
        armGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = armGlow;
        ctx.beginPath();
        ctx.arc(yangX - 12, yangY + 10, 25, 0, Math.PI * 2);
        ctx.fill();

        const armGlowR = ctx.createRadialGradient(yangX + 12, yangY + 10, 2, yangX + 12, yangY + 10, 25);
        armGlowR.addColorStop(0, `rgba(148, 226, 213, ${0.4 + tattooPulse * 0.4})`);
        armGlowR.addColorStop(1, 'transparent');
        ctx.fillStyle = armGlowR;
        ctx.beginPath();
        ctx.arc(yangX + 12, yangY + 10, 25, 0, Math.PI * 2);
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
