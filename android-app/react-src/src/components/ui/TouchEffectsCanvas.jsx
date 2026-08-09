import React, { useEffect, useRef } from 'react';

/** Full-screen 2D Canvas overlay for liquid ripples and pointer aurora dust trails. */
export default function TouchEffectsCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener('resize', setSize);

    const ripples = [];
    const auroraParticles = [];
    let lastSpawn = 0;
    let animId;

    const handlePointerMove = (e) => {
      const x = e.clientX || (e.touches && e.touches[0]?.clientX);
      const y = e.clientY || (e.touches && e.touches[0]?.clientY);
      if (x === undefined || y === undefined) return;

      const now = Date.now();
      if (now - lastSpawn > 35 && auroraParticles.length < 30) {
        lastSpawn = now;
        auroraParticles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 1.4,
          vy: -Math.random() * 1.6 - 0.6,
          size: Math.random() * 3.5 + 2,
          alpha: 0.75,
          color: Math.random() > 0.5 ? '#F5C2E7' : '#94E2D5',
        });
      }
    };

    const handlePointerDown = (e) => {
      const x = e.clientX || (e.touches && e.touches[0]?.clientX);
      const y = e.clientY || (e.touches && e.touches[0]?.clientY);
      if (x === undefined || y === undefined) return;

      if (ripples.length < 8) {
        ripples.push({ x, y, radius: 6, maxRadius: 160, alpha: 0.7 });
      }
    };

    const handleExternalRipple = (e) => {
      const { x, y } = e.detail || {};
      if (x !== undefined && y !== undefined && ripples.length < 12) {
        // Shockwave ripple at touch point
        ripples.push({ x, y, radius: 8, maxRadius: 280, alpha: 0.95 });
        // Secondary echo pulse
        ripples.push({ x, y, radius: 2, maxRadius: 200, alpha: 0.65 });
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('trigger-liquid-ripple', handleExternalRipple);


    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render Aurora Trail Particles
      for (let i = auroraParticles.length - 1; i >= 0; i--) {
        const p = auroraParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        p.size *= 0.97;

        if (p.alpha <= 0 || p.size <= 0.2) {
          auroraParticles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Render Liquid Ripple Rings
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 4.5;
        r.alpha -= 0.015;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(249, 226, 175, ${Math.max(0, r.alpha)})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', setSize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('trigger-liquid-ripple', handleExternalRipple);
    };
  }, []);


  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 4,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
      }}
    />
  );
}
