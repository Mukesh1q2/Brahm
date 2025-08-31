"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';

// Quantum Superposition Visualizer
export function QuantumSuperpositionDemo({ 
  isActive = false, 
  onStateChange 
}: { 
  isActive?: boolean; 
  onStateChange?: (state: 'superposition' | 'collapsed') => void; 
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [quantumState, setQuantumState] = useState<'superposition' | 'collapsed'>('superposition');
  const [superpositionLevel, setSuperpositionLevel] = useState(1.0);

  useEffect(() => {
    if (!mountRef.current || !isActive) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 400 / 300, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(400, 300);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Create quantum sphere showing superposition
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float time;
        uniform float superpositionLevel;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          
          vec3 pos = position;
          // Superposition creates multiple probable positions
          pos += sin(time * 2.0) * superpositionLevel * 0.3 * normal;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float superpositionLevel;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          // Probability wave coloring
          float wave = sin(vPosition.x * 5.0 + time * 2.0) * 0.5 + 0.5;
          vec3 color1 = vec3(0.0, 0.5, 1.0); // State |0⟩
          vec3 color2 = vec3(1.0, 0.0, 0.5); // State |1⟩
          
          vec3 finalColor = mix(color1, color2, wave);
          float alpha = superpositionLevel * 0.7;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      uniforms: {
        time: { value: 0 },
        superpositionLevel: { value: superpositionLevel }
      },
      transparent: true,
      side: THREE.DoubleSide
    });

    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    // Add probability cloud particles
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00aaff,
      size: 2,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const probabilityCloud = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(probabilityCloud);

    camera.position.z = 5;

    const animate = () => {
      const time = Date.now() * 0.001;
      
      sphereMaterial.uniforms.time.value = time;
      sphereMaterial.uniforms.superpositionLevel.value = superpositionLevel;
      
      sphere.rotation.x = time * 0.5;
      sphere.rotation.y = time * 0.3;
      
      probabilityCloud.rotation.x = time * 0.1;
      probabilityCloud.rotation.y = time * 0.2;
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isActive, superpositionLevel]);

  const collapseWaveFunction = () => {
    const newState = Math.random() > 0.5 ? 'collapsed' : 'superposition';
    setQuantumState(newState);
    setSuperpositionLevel(newState === 'collapsed' ? 0.1 : 1.0);
    onStateChange?.(newState);
    
    // Visual collapse effect
    gsap.timeline()
      .to('.superposition-sphere', {
        scale: 0.5,
        duration: 0.3,
        ease: "power2.in"
      })
      .to('.superposition-sphere', {
        scale: 1,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)"
      });
  };

  return (
    <div className="quantum-superposition-demo p-6 bg-black/20 rounded-lg border border-blue-500/30">
      <h3 className="text-xl font-bold mb-4 text-blue-400">Quantum Superposition</h3>
      <div ref={mountRef} className="superposition-sphere mb-4" />
      
      <div className="controls space-y-3">
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Superposition Level: {superpositionLevel.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={superpositionLevel}
            onChange={(e) => setSuperpositionLevel(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <button
          onClick={collapseWaveFunction}
          className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/50 rounded transition-colors"
        >
          Measure (Collapse Wave Function)
        </button>
        
        <div className="text-xs text-gray-400 font-mono">
          |Ψ⟩ = α|0⟩ + β|1⟩<br />
          State: {quantumState === 'superposition' ? 'Superposed' : 'Collapsed'}
        </div>
      </div>
    </div>
  );
}

// Quantum Entanglement Visualizer
export function QuantumEntanglementDemo({ 
  isActive = false 
}: { 
  isActive?: boolean; 
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [entangled, setEntangled] = useState(false);
  const [aliceState, setAliceState] = useState(0);
  const [bobState, setBobState] = useState(0);

  const createEntanglement = () => {
    setEntangled(true);
    const initialState = Math.random() > 0.5 ? 1 : 0;
    setAliceState(initialState);
    setBobState(1 - initialState); // Entangled particles have opposite states
  };

  const measureAlice = () => {
    if (!entangled) return;
    const newState = Math.random() > 0.5 ? 1 : 0;
    setAliceState(newState);
    setBobState(1 - newState); // Instantaneous correlation
  };

  return (
    <div className="quantum-entanglement-demo p-6 bg-black/20 rounded-lg border border-purple-500/30">
      <h3 className="text-xl font-bold mb-4 text-purple-400">Quantum Entanglement</h3>
      
      <div className="flex justify-between items-center mb-6">
        <div className="particle-alice text-center">
          <div 
            className={`w-16 h-16 rounded-full border-2 mx-auto mb-2 ${
              aliceState === 1 ? 'bg-red-500 border-red-400' : 'bg-blue-500 border-blue-400'
            }`}
            style={{
              boxShadow: entangled ? '0 0 20px currentColor' : 'none'
            }}
          />
          <div className="text-sm text-gray-300">Alice</div>
          <div className="text-xs text-gray-400">Spin: {aliceState === 1 ? '↑' : '↓'}</div>
        </div>

        <div className="entanglement-beam relative">
          <AnimatePresence>
            {entangled && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500"
                style={{
                  boxShadow: '0 0 10px #a855f7'
                }}
              />
            )}
          </AnimatePresence>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs text-purple-400">
            {entangled ? 'Entangled' : 'Separated'}
          </div>
        </div>

        <div className="particle-bob text-center">
          <div 
            className={`w-16 h-16 rounded-full border-2 mx-auto mb-2 ${
              bobState === 1 ? 'bg-red-500 border-red-400' : 'bg-blue-500 border-blue-400'
            }`}
            style={{
              boxShadow: entangled ? '0 0 20px currentColor' : 'none'
            }}
          />
          <div className="text-sm text-gray-300">Bob</div>
          <div className="text-xs text-gray-400">Spin: {bobState === 1 ? '↑' : '↓'}</div>
        </div>
      </div>

      <div className="controls space-y-3">
        <button
          onClick={createEntanglement}
          className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/50 rounded transition-colors mr-3"
        >
          Create Entanglement
        </button>
        
        <button
          onClick={measureAlice}
          disabled={!entangled}
          className="px-4 py-2 bg-pink-600/30 hover:bg-pink-600/50 border border-pink-400/50 rounded transition-colors disabled:opacity-50"
        >
          Measure Alice
        </button>
        
        <div className="text-xs text-gray-400 font-mono mt-4">
          |Ψ⟩ = (1/√2)(|↑↓⟩ - |↓↑⟩)<br />
          Correlation: {entangled ? 'Instantaneous' : 'None'}
        </div>
      </div>
    </div>
  );
}

// Quantum Tunneling Visualizer
export function QuantumTunnelingDemo({ 
  isActive = false 
}: { 
  isActive?: boolean; 
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [barrierHeight, setBarrierHeight] = useState(5);
  const [particleEnergy, setParticleEnergy] = useState(3);
  const [tunnelingProbability, setTunnelingProbability] = useState(0);
  const [tunneling, setTunneling] = useState(false);

  useEffect(() => {
    // Calculate tunneling probability based on barrier height and particle energy
    const probability = Math.exp(-(barrierHeight - particleEnergy) * 0.5);
    setTunnelingProbability(Math.max(0, Math.min(1, probability)));
  }, [barrierHeight, particleEnergy]);

  const demonstrateTunneling = () => {
    setTunneling(true);
    
    // Quantum tunneling animation
    gsap.timeline()
      .to('.particle', {
        x: 150,
        duration: 1,
        ease: "none"
      })
      .to('.particle', {
        opacity: 0.3,
        scale: 0.7,
        duration: 0.5,
        ease: "power2.inOut"
      }, 1)
      .to('.particle', {
        opacity: Math.random() < tunnelingProbability ? 1 : 0.1,
        scale: Math.random() < tunnelingProbability ? 1 : 0.3,
        x: 300,
        duration: 0.5,
        ease: "power2.inOut"
      })
      .call(() => setTunneling(false));
  };

  const resetDemo = () => {
    gsap.set('.particle', { x: 0, opacity: 1, scale: 1 });
  };

  return (
    <div className="quantum-tunneling-demo p-6 bg-black/20 rounded-lg border border-green-500/30">
      <h3 className="text-xl font-bold mb-4 text-green-400">Quantum Tunneling</h3>
      
      <div className="tunneling-visualization relative h-32 mb-6 bg-gray-900/30 rounded">
        {/* Particle */}
        <div 
          className="particle absolute top-12 w-8 h-8 rounded-full bg-blue-500"
          style={{
            boxShadow: '0 0 15px #3b82f6'
          }}
        />
        
        {/* Energy Barrier */}
        <div 
          className="barrier absolute left-32 bg-red-500/50 border-2 border-red-400"
          style={{
            width: '20px',
            height: `${barrierHeight * 10}px`,
            bottom: '20px'
          }}
        />
        
        {/* Wave function visualization */}
        <div className="wave-function absolute inset-0 pointer-events-none">
          <svg className="w-full h-full">
            <path
              d={`M 0,80 Q 80,${80 - particleEnergy * 5} 120,${80 - particleEnergy * 5} Q 160,${80 - particleEnergy * 5} 200,80 Q 240,${80 + (barrierHeight - particleEnergy) * 3} 280,80 Q 320,80 360,80`}
              stroke="#00ff88"
              strokeWidth="2"
              fill="none"
              opacity="0.7"
            />
          </svg>
        </div>
      </div>

      <div className="controls grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Barrier Height: {barrierHeight}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={barrierHeight}
            onChange={(e) => setBarrierHeight(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Particle Energy: {particleEnergy}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={particleEnergy}
            onChange={(e) => setParticleEnergy(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-300 mb-2">
          Tunneling Probability: {(tunnelingProbability * 100).toFixed(1)}%
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className="bg-green-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${tunnelingProbability * 100}%` }}
          />
        </div>
      </div>

      <div className="controls space-x-3">
        <button
          onClick={demonstrateTunneling}
          disabled={tunneling}
          className="px-4 py-2 bg-green-600/30 hover:bg-green-600/50 border border-green-400/50 rounded transition-colors disabled:opacity-50"
        >
          Demonstrate Tunneling
        </button>
        
        <button
          onClick={resetDemo}
          className="px-4 py-2 bg-gray-600/30 hover:bg-gray-600/50 border border-gray-400/50 rounded transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="text-xs text-gray-400 font-mono mt-4">
        T = e^(-2κa) where κ = √(2m(V-E)/ℏ²)<br />
        Classical: {particleEnergy >= barrierHeight ? 'Pass' : 'Blocked'} | 
        Quantum: {tunnelingProbability > 0.5 ? 'Likely' : 'Unlikely'} to tunnel
      </div>
    </div>
  );
}

// Uncertainty Principle Visualizer
export function UncertaintyPrincipleDemo({ 
  isActive = false 
}: { 
  isActive?: boolean; 
}) {
  const [positionPrecision, setPositionPrecision] = useState(0.5);
  const [momentumUncertainty, setMomentumUncertainty] = useState(0.5);

  useEffect(() => {
    // Heisenberg uncertainty principle: Δx * Δp ≥ ℏ/2
    const hbar = 1; // normalized
    setMomentumUncertainty(Math.max(0.1, hbar / (2 * positionPrecision + 0.1)));
  }, [positionPrecision]);

  return (
    <div className="uncertainty-principle-demo p-6 bg-black/20 rounded-lg border border-yellow-500/30">
      <h3 className="text-xl font-bold mb-4 text-yellow-400">Heisenberg Uncertainty Principle</h3>
      
      <div className="visualization grid grid-cols-2 gap-6 mb-6">
        <div className="position-measurement text-center">
          <h4 className="text-lg font-semibold mb-3 text-blue-300">Position (Δx)</h4>
          <div 
            className="measurement-indicator mx-auto bg-blue-500/30 rounded"
            style={{
              width: `${100 - positionPrecision * 80}px`,
              height: '60px',
              filter: `blur(${(1 - positionPrecision) * 10}px)`,
              border: `2px solid rgba(59, 130, 246, ${positionPrecision})`
            }}
          />
          <div className="mt-2 text-sm text-gray-300">
            Uncertainty: {(1 - positionPrecision).toFixed(2)}
          </div>
        </div>

        <div className="momentum-measurement text-center">
          <h4 className="text-lg font-semibold mb-3 text-red-300">Momentum (Δp)</h4>
          <div 
            className="measurement-indicator mx-auto bg-red-500/30 rounded"
            style={{
              width: `${20 + momentumUncertainty * 60}px`,
              height: '60px',
              filter: `blur(${momentumUncertainty * 10}px)`,
              border: `2px solid rgba(239, 68, 68, ${1 - momentumUncertainty})`
            }}
          />
          <div className="mt-2 text-sm text-gray-300">
            Uncertainty: {momentumUncertainty.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="controls mb-4">
        <label className="block text-sm text-gray-300 mb-2">
          Position Measurement Precision: {positionPrecision.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={positionPrecision}
          onChange={(e) => setPositionPrecision(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="uncertainty-product mb-4 p-3 bg-gray-900/50 rounded border border-gray-700">
        <div className="text-sm text-gray-300">
          Uncertainty Product: Δx × Δp = {((1 - positionPrecision) * momentumUncertainty).toFixed(3)}
        </div>
        <div className="text-xs text-yellow-400 mt-1">
          Minimum allowed (ℏ/2): 0.500
        </div>
      </div>

      <div className="text-xs text-gray-400 font-mono">
        Δx · Δp ≥ ℏ/2<br />
        The more precisely we know position, the less precisely we know momentum
      </div>
    </div>
  );
}

// Main Quantum Concepts Container
export default function QuantumConceptVisualizers({ 
  activeDemo = 'superposition',
  consciousnessLevel = 0 
}: { 
  activeDemo?: 'superposition' | 'entanglement' | 'tunneling' | 'uncertainty';
  consciousnessLevel?: number;
}) {
  const [currentDemo, setCurrentDemo] = useState(activeDemo);

  const demos = [
    { id: 'superposition', name: 'Superposition', component: QuantumSuperpositionDemo },
    { id: 'entanglement', name: 'Entanglement', component: QuantumEntanglementDemo },
    { id: 'tunneling', name: 'Tunneling', component: QuantumTunnelingDemo },
    { id: 'uncertainty', name: 'Uncertainty', component: UncertaintyPrincipleDemo }
  ];

  return (
    <div className="quantum-concept-visualizers" data-conscious="true">
      <div className="demo-selector flex flex-wrap gap-2 mb-6 justify-center">
        {demos.map((demo) => (
          <button
            key={demo.id}
            onClick={() => setCurrentDemo(demo.id as any)}
            className={`px-4 py-2 rounded transition-all ${
              currentDemo === demo.id
                ? 'bg-blue-600/50 border-2 border-blue-400 text-white'
                : 'bg-gray-800/30 border border-gray-600 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            {demo.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentDemo}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentDemo === 'superposition' && <QuantumSuperpositionDemo isActive={true} />}
          {currentDemo === 'entanglement' && <QuantumEntanglementDemo isActive={true} />}
          {currentDemo === 'tunneling' && <QuantumTunnelingDemo isActive={true} />}
          {currentDemo === 'uncertainty' && <UncertaintyPrincipleDemo isActive={true} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
