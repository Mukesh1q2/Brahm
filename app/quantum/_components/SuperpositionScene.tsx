"use client";

import React from 'react';

export default function SuperpositionScene({ theta, measurement }: { theta: number; measurement: { target: 0 | 1; t: number } | null }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const frameRef = React.useRef<number>(0);
  const materialsRef = React.useRef<{ m0: any; m1: any } | null>(null);
  const spheresRef = React.useRef<{ s0: any; s1: any } | null>(null);
  const stateRef = React.useRef<{ collapsed: 0 | 1 | null; measuring: boolean; start: number; duration: number; target: 0 | 1 | null }>({ collapsed: null, measuring: false, start: 0, duration: 800, target: null });

  // Update material opacity when theta changes (only when not collapsed/measuring)
  React.useEffect(() => {
    const mats = materialsRef.current;
    const st = stateRef.current;
    if (!mats) return;
    if (st.measuring || st.collapsed !== null) return;
    const a0 = Math.cos(theta);
    const a1 = Math.sin(theta);
    const p0 = a0 * a0;
    const p1 = a1 * a1;
    mats.m0.opacity = 0.2 + 0.8 * p0; // keep a minimum visibility
    mats.m1.opacity = 0.2 + 0.8 * p1;
  }, [theta]);

  // Trigger measurement collapse animation
  React.useEffect(() => {
    const st = stateRef.current;
    if (!measurement) return;
    if (st.measuring || st.collapsed !== null) return; // already active or collapsed
    st.measuring = true;
    st.target = measurement.target;
    st.start = performance.now();
  }, [measurement]);

  React.useEffect(() => {
    let cleanup: (() => void) | null = null;
    let mounted = true;

    (async () => {
      try {
        const t = await import('three');
        const {
          Scene,
          PerspectiveCamera,
          WebGLRenderer,
          Color,
          SphereGeometry,
          MeshBasicMaterial,
          Mesh,
          AmbientLight,
          DirectionalLight,
          Clock,
          AdditiveBlending,
        } = t;

        if (!mounted) return;
        const canvas = canvasRef.current!;
        const scene = new Scene();
        scene.background = new Color('#050507');

        const camera = new PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
        camera.position.set(0, 0.6, 2.2);

        const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);

        const ambient = new AmbientLight(0xffffff, 0.25);
        scene.add(ambient);
        const dir = new DirectionalLight(0xffffff, 0.6);
        dir.position.set(2, 2, 2);
        scene.add(dir);

        const geo = new SphereGeometry(0.7, 48, 48);
        const m0 = new MeshBasicMaterial({ color: 0x00d2ff, transparent: true, blending: AdditiveBlending, opacity: 0.7 });
        const m1 = new MeshBasicMaterial({ color: 0xa78bfa, transparent: true, blending: AdditiveBlending, opacity: 0.7 });
        const s0 = new Mesh(geo, m0);
        const s1 = new Mesh(geo, m1);
        // Slight spatial offset for visual separation while overlapping
        s0.position.set(-0.15, 0, 0);
        s1.position.set(0.15, 0, 0);
        scene.add(s0);
        scene.add(s1);

        // Save references for reactive updates
        materialsRef.current = { m0, m1 } as any;
        spheresRef.current = { s0, s1 } as any;

        const clock = new Clock();

        const onResize = () => {
          const width = canvas.clientWidth;
          const height = Math.max(1, canvas.clientHeight);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };
        const resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(canvas);
        onResize();

        const animate = () => {
          frameRef.current = requestAnimationFrame(animate);
          const t = clock.getElapsedTime();
          const wobble = 0.05 * Math.sin(t * 1.5);
          s0.position.x = -0.15 + wobble;
          s1.position.x = 0.15 - wobble;
          s0.rotation.y = t * 0.4;
          s1.rotation.y = -t * 0.4;

          // Handle measurement animation/collapse
          const st = stateRef.current;
          const mats = materialsRef.current!;
          if (st.measuring && st.target !== null) {
            const elapsed = performance.now() - st.start;
            const d = st.duration;
            const prog = Math.min(1, elapsed / d);
            const ease = 1 - Math.pow(1 - prog, 3); // easeOutCubic

            const winner = st.target === 0 ? s0 : s1;
            const loser = st.target === 0 ? s1 : s0;
            const winMat = st.target === 0 ? mats.m0 : mats.m1;
            const loseMat = st.target === 0 ? mats.m1 : mats.m0;

            const winScale = 1 + 0.15 * ease;
            const loseScale = 1 - 0.35 * ease;
            winner.scale.setScalar(winScale);
            loser.scale.setScalar(Math.max(0.6, loseScale));
            winMat.opacity = 0.6 + 0.4 * ease;
            loseMat.opacity = Math.max(0.1, 0.7 - 0.6 * ease);

            if (prog >= 1) {
              st.measuring = false;
              st.collapsed = st.target;
            }
          } else if (st.collapsed !== null) {
            // Maintain collapsed visuals with a gentle micro-pulse
            const pulse = 1 + 0.03 * Math.sin(t * 2.0);
            const win = st.collapsed === 0 ? s0 : s1;
            const lose = st.collapsed === 0 ? s1 : s0;
            const mats2 = materialsRef.current!;
            win.scale.setScalar(pulse);
            lose.scale.setScalar(0.65);
            (st.collapsed === 0 ? mats2.m0 : mats2.m1).opacity = 1.0;
            (st.collapsed === 0 ? mats2.m1 : mats2.m0).opacity = 0.12;
          }

          renderer.render(scene, camera);
        };
        animate();

        cleanup = () => {
          cancelAnimationFrame(frameRef.current);
          resizeObserver.disconnect();
          geo.dispose();
          m0.dispose();
          m1.dispose();
          renderer.dispose();
        };
      } catch (e) {
        cleanup = () => {};
      }
    })();

    return () => {
      mounted = false;
      try { cleanup?.(); } catch {}
    };
  }, []);

  return (
    <div className="w-full h-[360px] rounded-xl overflow-hidden border border-white/10 bg-black/40">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

