"use client";

import React from 'react';

type Node = { x: number; y: number; vx: number; vy: number };

export default function QuantumGraph({ height = 140 }: { height?: number }) {
  const ref = React.useRef<HTMLCanvasElement | null>(null);
  const anim = React.useRef<number | null>(null);
  const nodesRef = React.useRef<Node[]>([]);

  React.useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(height * dpr);
    }
    resize();

    // init nodes based on width
    const count = Math.max(24, Math.floor((canvas.width / dpr) / 24));
    nodesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4 * dpr,
      vy: (Math.random() - 0.5) * 0.4 * dpr,
    }));

    function step() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // draw links
      for (let i = 0; i < nodesRef.current.length; i++) {
        const a = nodesRef.current[i];
        for (let j = i + 1; j < nodesRef.current.length; j++) {
          const b = nodesRef.current[j];
          const dx = a.x - b.x; const dy = a.y - b.y; const d2 = dx*dx + dy*dy;
          const dist = Math.sqrt(d2);
          if (dist < 120 * dpr) {
            const alpha = 1 - dist / (120 * dpr);
            ctx.strokeStyle = `rgba(170,108,255,${0.15 * alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }

      // update + draw nodes
      for (const n of nodesRef.current) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        ctx.fillStyle = 'rgba(124,58,237,0.9)'; // brand-600
        ctx.beginPath(); ctx.arc(n.x, n.y, 2.2 * dpr, 0, Math.PI * 2); ctx.fill();
      }

      anim.current = requestAnimationFrame(step);
    }

    anim.current = requestAnimationFrame(step);
    const onResize = () => { resize(); };
    window.addEventListener('resize', onResize);

    return () => {
      running = false;
      if (anim.current != null) cancelAnimationFrame(anim.current);
      window.removeEventListener('resize', onResize);
    };
  }, [height]);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="mb-2 text-xs text-neutral-400">Quantum Mind (animated)</div>
      <div className="h-[140px] w-full">
        <canvas ref={ref} className="h-full w-full" />
      </div>
    </div>
  );
}
