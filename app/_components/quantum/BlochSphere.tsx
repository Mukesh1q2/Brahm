"use client";
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type BlochSphereProps = {
  theta: number; // polar angle [0, pi]
  phi: number;   // azimuth [0, 2pi]
  omega?: number; // precession speed (rad/s)
  noise?: number; // 0..1 dephasing/scaling of Bloch vector length
};

export default function BlochSphere({ theta, phi, omega=0, noise=0 }: BlochSphereProps) {
  const mountRef = useRef<HTMLDivElement|null>(null);
  const vecRef = useRef<THREE.ArrowHelper|null>(null);
  const stateRef = useRef({ theta, phi, omega, noise });
  stateRef.current = { theta, phi, omega, noise };

  useEffect(() => {
    if (!mountRef.current) return;
    const width = 380, height = 360;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width/height, 0.1, 100);
    camera.position.set(0.8, 0.8, 1.6);
    camera.lookAt(0,0,0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Bloch sphere (wireframe)
    const sphereGeom = new THREE.SphereGeometry(0.9, 24, 24);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x4444aa, wireframe: true, transparent: true, opacity: 0.5 });
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    scene.add(sphere);

    // Axes
    const axes = new THREE.AxesHelper(1.1);
    scene.add(axes);

    // State vector
    const dir = new THREE.Vector3(0, 1, 0);
    const origin = new THREE.Vector3(0, 0, 0);
    const length = 0.9;
    const color = new THREE.Color(0x00e0ff);
    const arrow = new THREE.ArrowHelper(dir, origin, length, color.getHex(), 0.12, 0.06);
    vecRef.current = arrow;
    scene.add(arrow);

    let raf = 0; const t0 = performance.now();
    const animate = () => {
      const t = (performance.now() - t0)/1000;
      const { theta, phi, omega, noise } = stateRef.current;
      const lengthScale = Math.max(0, Math.min(1, 1 - (noise||0)));
      const ang = phi + (omega||0)*t;
      const x = Math.sin(theta) * Math.cos(ang);
      const y = Math.cos(theta);
      const z = Math.sin(theta) * Math.sin(ang);
      const v = new THREE.Vector3(x, y, z).normalize().multiplyScalar(length*lengthScale);
      if (vecRef.current) {
        vecRef.current.setDirection(v.clone().normalize());
        vecRef.current.setLength(v.length(), 0.12, 0.06);
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(raf); try { mountRef.current?.removeChild(renderer.domElement); } catch {}; renderer.dispose(); };
  }, []);

  return <div ref={mountRef} className="w-full" />;
}

