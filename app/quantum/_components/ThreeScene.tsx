"use client";

import React from 'react';

export default function ThreeScene() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const frameRef = React.useRef<number>(0);

  React.useEffect(() => {
    let cleanup: (() => void) | null = null;
    let mounted = true;

    (async () => {
      try {
        const [{ Scene, PerspectiveCamera, WebGLRenderer, Color, TorusKnotGeometry, MeshStandardMaterial, Mesh, AmbientLight, DirectionalLight, Clock }, THREE] = await Promise.all([
          import('three').then((m) => ({
            Scene: m.Scene,
            PerspectiveCamera: m.PerspectiveCamera,
            WebGLRenderer: m.WebGLRenderer,
            Color: m.Color,
            TorusKnotGeometry: m.TorusKnotGeometry,
            MeshStandardMaterial: m.MeshStandardMaterial,
            Mesh: m.Mesh,
            AmbientLight: m.AmbientLight,
            DirectionalLight: m.DirectionalLight,
            Clock: m.Clock,
          })),
          import('three')
        ]);

        if (!mounted) return;
        const canvas = canvasRef.current!;
        const scene = new Scene();
        scene.background = new Color('#050507');

        const camera = new PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
        camera.position.set(0, 0.6, 2.2);

        const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);

        const ambient = new AmbientLight(0xffffff, 0.4);
        scene.add(ambient);
        const dir = new DirectionalLight(0x88aaff, 1.0);
        dir.position.set(2, 2, 2);
        scene.add(dir);

        const geo = new TorusKnotGeometry(0.6, 0.22, 128, 32);
        const mat = new MeshStandardMaterial({ color: 0x88ccff, roughness: 0.2, metalness: 0.7 });
        const mesh = new Mesh(geo, mat);
        scene.add(mesh);

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
          mesh.rotation.x = t * 0.4;
          mesh.rotation.y = t * 0.6;
          renderer.render(scene, camera);
        };
        animate();

        cleanup = () => {
          cancelAnimationFrame(frameRef.current);
          resizeObserver.disconnect();
          geo.dispose();
          mat.dispose();
          renderer.dispose();
        };
      } catch (e) {
        // If three fails to load, ignore; parent component will show fallback
        cleanup = () => {};
      }
    })();

    return () => {
      mounted = false;
      try { cleanup?.(); } catch {}
    };
  }, []);

  return (
    <div className="w-full h-[280px] rounded-xl overflow-hidden border border-white/10 bg-black/40">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

