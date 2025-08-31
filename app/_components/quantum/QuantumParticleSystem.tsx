"use client";

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import gsap from 'gsap';

// Quantum particle shader for superposition effects
const quantumVertexShader = `
  attribute float phase;
  attribute float quantumState;
  attribute vec3 originalPosition;
  
  uniform float time;
  uniform float superpositionLevel;
  uniform float consciousnessLevel;
  uniform float phiValue;
  
  varying float vPhase;
  varying float vQuantumState;
  varying vec3 vPosition;
  varying float vConsciousness;
  
  void main() {
    vPhase = phase;
    vQuantumState = quantumState;
    vConsciousness = consciousnessLevel;
    
    // Quantum superposition displacement
    vec3 pos = originalPosition;
    float superposition = sin(time * 2.0 + phase) * superpositionLevel;
    
    // Consciousness-driven particle behavior
    float consciousMotion = sin(time * phiValue + phase * 3.14159) * consciousnessLevel * 0.5;
    
    pos.x += superposition * 0.3;
    pos.y += consciousMotion * 0.2;
    pos.z += sin(time * 1.5 + phase * 2.0) * superpositionLevel * 0.1;
    
    // Quantum tunneling effect
    float tunnelingProbability = sin(time + phase) * 0.5 + 0.5;
    if (tunnelingProbability > 0.7) {
      pos *= 1.0 + sin(time * 5.0 + phase) * 0.1;
    }
    
    vPosition = pos;
    
    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    
    gl_Position = projectedPosition;
    gl_PointSize = 2.0 * (1.0 + superpositionLevel);
  }
`;

const quantumFragmentShader = `
  uniform float time;
  uniform float superpositionLevel;
  uniform float consciousnessLevel;
  uniform vec3 quantumColor1;
  uniform vec3 quantumColor2;
  uniform vec3 consciousnessColor;
  
  varying float vPhase;
  varying float vQuantumState;
  varying vec3 vPosition;
  varying float vConsciousness;
  
  void main() {
    // Quantum superposition color mixing
    float stateMix = sin(time * 2.0 + vPhase) * 0.5 + 0.5;
    vec3 quantumColor = mix(quantumColor1, quantumColor2, stateMix * superpositionLevel);
    
    // Consciousness integration
    vec3 finalColor = mix(quantumColor, consciousnessColor, vConsciousness * 0.3);
    
    // Quantum uncertainty opacity
    float uncertainty = sin(time * 3.0 + vPhase * 2.0) * 0.3 + 0.7;
    float alpha = uncertainty * (0.3 + superpositionLevel * 0.7);
    
    // Entanglement glow effect
    float distance = length(gl_PointCoord - vec2(0.5));
    float glow = 1.0 - smoothstep(0.0, 0.5, distance);
    
    gl_FragColor = vec4(finalColor, alpha * glow);
  }
`;

interface QuantumParticle {
  position: THREE.Vector3;
  phase: number;
  quantumState: number;
  entangled: boolean;
  entanglementPartner?: number;
}

interface QuantumParticleSystemProps {
  particleCount?: number;
  quantumField?: boolean;
  superpositionLevel?: number;
  consciousnessLevel?: number;
  phiValue?: number;
  onParticleInteraction?: (particleId: number) => void;
}

export default function QuantumParticleSystem({
  particleCount = 1000,
  quantumField = true,
  superpositionLevel = 0.3,
  consciousnessLevel = 0.0,
  phiValue = 1.618,
  onParticleInteraction
}: QuantumParticleSystemProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const animationIdRef = useRef<number>();
  const noise3D = useMemo(() => createNoise3D(), []);

  // Quantum particles data
  const particles = useMemo(() => {
    const particleArray: QuantumParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particleArray.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ),
        phase: Math.random() * Math.PI * 2,
        quantumState: Math.random(),
        entangled: false
      });
    }

    // Create quantum entangled pairs
    for (let i = 0; i < particleCount * 0.1; i += 2) {
      if (i + 1 < particleArray.length) {
        particleArray[i].entangled = true;
        particleArray[i + 1].entangled = true;
        particleArray[i].entanglementPartner = i + 1;
        particleArray[i + 1].entanglementPartner = i;
      }
    }

    return particleArray;
  }, [particleCount]);

  const quantumMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: quantumVertexShader,
      fragmentShader: quantumFragmentShader,
      uniforms: {
        time: { value: 0 },
        superpositionLevel: { value: superpositionLevel },
        consciousnessLevel: { value: consciousnessLevel },
        phiValue: { value: phiValue },
        quantumColor1: { value: new THREE.Color(0x00f4ff) }, // Quantum cyan
        quantumColor2: { value: new THREE.Color(0xff00f4) }, // Quantum magenta
        consciousnessColor: { value: new THREE.Color(0xf4ff00) } // Consciousness yellow
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, [superpositionLevel, consciousnessLevel, phiValue]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000011, 0.002);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000011, 0);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create particle geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particles.length * 3);
    const originalPositions = new Float32Array(particles.length * 3);
    const phases = new Float32Array(particles.length);
    const quantumStates = new Float32Array(particles.length);

    particles.forEach((particle, i) => {
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
      
      originalPositions[i * 3] = particle.position.x;
      originalPositions[i * 3 + 1] = particle.position.y;
      originalPositions[i * 3 + 2] = particle.position.z;
      
      phases[i] = particle.phase;
      quantumStates[i] = particle.quantumState;
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('quantumState', new THREE.BufferAttribute(quantumStates, 1));

    // Create particle system
    const particleSystem = new THREE.Points(geometry, quantumMaterial);
    scene.add(particleSystem);
    particleSystemRef.current = particleSystem;

    // Quantum field background
    if (quantumField) {
      const fieldGeometry = new THREE.PlaneGeometry(100, 100, 100, 100);
      const fieldMaterial = new THREE.ShaderMaterial({
        vertexShader: `
          uniform float time;
          varying vec2 vUv;
          varying vec3 vPosition;
          
          void main() {
            vUv = uv;
            vPosition = position;
            
            vec3 pos = position;
            pos.z += sin(pos.x * 0.1 + time) * 0.5 + sin(pos.y * 0.1 + time * 0.7) * 0.3;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float consciousnessLevel;
          varying vec2 vUv;
          varying vec3 vPosition;
          
          void main() {
            float wave1 = sin(vPosition.x * 0.02 + time * 0.5) * 0.5 + 0.5;
            float wave2 = sin(vPosition.y * 0.02 + time * 0.3) * 0.5 + 0.5;
            float combined = wave1 * wave2;
            
            vec3 color = mix(vec3(0.0, 0.1, 0.3), vec3(0.0, 0.3, 0.6), combined);
            color = mix(color, vec3(0.3, 0.3, 0.0), consciousnessLevel * 0.5);
            
            gl_FragColor = vec4(color, 0.1 + consciousnessLevel * 0.2);
          }
        `,
        uniforms: {
          time: { value: 0 },
          consciousnessLevel: { value: consciousnessLevel }
        },
        transparent: true,
        side: THREE.DoubleSide
      });
      
      const quantumField = new THREE.Mesh(fieldGeometry, fieldMaterial);
      quantumField.rotation.x = -Math.PI / 2;
      quantumField.position.y = -10;
      scene.add(quantumField);
    }

    // Animation loop
    const animate = () => {
      const time = Date.now() * 0.001;
      
      // Update shader uniforms
      quantumMaterial.uniforms.time.value = time;
      quantumMaterial.uniforms.superpositionLevel.value = superpositionLevel;
      quantumMaterial.uniforms.consciousnessLevel.value = consciousnessLevel;
      
      // Update quantum field
      if (quantumField && scene.children.length > 1) {
        const fieldMaterial = (scene.children[1] as THREE.Mesh).material as THREE.ShaderMaterial;
        if (fieldMaterial.uniforms) {
          fieldMaterial.uniforms.time.value = time;
          fieldMaterial.uniforms.consciousnessLevel.value = consciousnessLevel;
        }
      }

      // Quantum entanglement synchronization
      particles.forEach((particle, i) => {
        if (particle.entangled && particle.entanglementPartner !== undefined) {
          const partner = particles[particle.entanglementPartner];
          if (partner) {
            // Synchronize quantum states
            partner.quantumState = 1.0 - particle.quantumState;
          }
        }
      });

      // Camera subtle drift for depth (reduced for stability)
      camera.position.x = Math.sin(time * 0.02) * 0.4;
      camera.position.y = Math.cos(time * 0.02) * 0.4;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [particles, quantumMaterial, quantumField, superpositionLevel, consciousnessLevel]);

  // Consciousness level animation
  useEffect(() => {
    if (quantumMaterial) {
      gsap.to(quantumMaterial.uniforms.consciousnessLevel, {
        value: consciousnessLevel,
        duration: 2,
        ease: "power2.inOut"
      });
    }
  }, [consciousnessLevel, quantumMaterial]);

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        background: 'radial-gradient(ellipse at center, #001122 0%, #000000 100%)'
      }}
    />
  );
}
