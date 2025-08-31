"use client";

import React from 'react';

export default function QuantumFieldBackground({ className = '' }: { className?: string }) {
  const ref = React.useRef<HTMLCanvasElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const reduced = React.useMemo(() => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);

    const particles: { x: number; y: number; vx: number; vy: number; p: number }[] = [];
    const N = Math.min(160, Math.floor((w * h) / 24000)); // density-based cap
    for (let i = 0; i < N; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        p: Math.random() * Math.PI * 2,
      });
    }

    const colorA = '#00F0FF';
    const colorB = '#AA6CFF';
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      // background gradient aura
      const g = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w * 0.3, h * 0.3, Math.max(w, h) * 0.9);
      g.addColorStop(0, 'rgba(0,240,255,0.06)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // links
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y; const d2 = dx * dx + dy * dy;
          if (d2 < 120 * 120) {
            const a2 = 1 - d2 / (120 * 120);
            ctx.globalAlpha = Math.max(0, a2 * 0.25);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // particles
      for (const p of particles) {
        // subtle quantum drift
        const k = reduced ? 0.3 : 1;
        p.x += p.vx * k; p.y += p.vy * k; p.p += 0.01 * k;
        if (p.x < 0) p.x += w; else if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h; else if (p.y > h) p.y -= h;
        const r = 1.2 + 0.8 * Math.sin(p.p + t * 0.0007);
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 6);
        grd.addColorStop(0, colorA + 'CC');
        grd.addColorStop(1, colorB + '00');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      }
    };

    const loop = (now: number) => {
      draw(now);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [reduced]);

  return <canvas ref={ref} className={`absolute inset-0 w-full h-full ${className}`} aria-hidden />;
}

