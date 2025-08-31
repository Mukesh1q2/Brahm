"use client";

import React from 'react';

export default function EntanglementScene({ phi }: { phi: number }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const frameRef = React.useRef<number>(0);

  const beamRef = React.useRef<any>(null);
  const leftRef = React.useRef<any>(null);
  const rightRef = React.useRef<any>(null);
  const materialsRef = React.useRef<{ left: any; right: any; beam: any } | null>(null);

  React.useEffect(() => {
    // Update beam/sphere emphasis based on correlation E = cos(2phi)
    const mats = materialsRef.current;
    if (!mats) return;
    const E = Math.cos(2 * phi);
    const intensity = 0.3 + 0.6 * Math.abs(E);
    mats.beam.opacity = intensity;
    mats.left.opacity = 0.6 + 0.3 * Math.max(0, E);
    mats.right.opacity = 0.6 + 0.3 * Math.max(0, E);
  }, [phi]);

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
          CylinderGeometry,
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

        // Particles
        const sGeo = new SphereGeometry(0.45, 48, 48);
        const leftMat = new MeshBasicMaterial({ color: 0x00ffe0, transparent: true, blending: AdditiveBlending, opacity: 0.8 });
        const rightMat = new MeshBasicMaterial({ color: 0xff77ff, transparent: true, blending: AdditiveBlending, opacity: 0.8 });
        const left = new Mesh(sGeo, leftMat);
        const right = new Mesh(sGeo, rightMat);
        left.position.set(-0.8, 0, 0);
        right.position.set(0.8, 0, 0);
        scene.add(left);
        scene.add(right);
        leftRef.current = left;
        rightRef.current = right;

        // Beam linking the two
        const dist = left.position.distanceTo(right.position);
        const beamGeo = new CylinderGeometry(0.04, 0.04, dist, 20);
        const beamMat = new MeshBasicMaterial({ color: 0x66ccff, transparent: true, blending: AdditiveBlending, opacity: 0.6 });
        const beam = new Mesh(beamGeo, beamMat);
        // Align along X-axis
        beam.rotation.z = Math.PI / 2;
        beam.position.set((left.position.x + right.position.x) / 2, 0, 0);
        scene.add(beam);
        beamRef.current = beam;

        materialsRef.current = { left: leftMat, right: rightMat, beam: beamMat } as any;

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
          const tNow = clock.getElapsedTime();
          // Phase-synchronized rotations
          left.rotation.y = tNow * 0.7;
          right.rotation.y = tNow * 0.7 + phi; // offset by phi
          // Soft pulsation to indicate linkage strength
          const E = Math.cos(2 * phi);
          const pulse = 1 + 0.04 * Math.sin(tNow * 2.0 + (E >= 0 ? 0 : Math.PI));
          left.scale.setScalar(pulse);
          right.scale.setScalar(pulse);
          renderer.render(scene, camera);
        };
        animate();

        cleanup = () => {
          cancelAnimationFrame(frameRef.current);
          resizeObserver.disconnect();
          sGeo.dispose();
          beamGeo.dispose();
          beamMat.dispose();
          leftMat.dispose();
          rightMat.dispose();
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

