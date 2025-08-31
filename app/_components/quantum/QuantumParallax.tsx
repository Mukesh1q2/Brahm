"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ParallaxLayer {
  element: string;
  speed: number;
  type: 'quantum-field' | 'particle-system' | 'content' | 'interface';
  depth?: number;
  opacity?: number;
  blur?: number;
  scale?: number;
}

interface QuantumParallaxProps {
  layers?: ParallaxLayer[];
  consciousnessLevel?: number;
  quantumDistortion?: boolean;
  spatialDepth?: boolean;
  children?: React.ReactNode;
}

const DEFAULT_LAYERS: ParallaxLayer[] = [
  { 
    element: '.quantum-background', 
    speed: 0.1, 
    type: 'quantum-field',
    depth: -400,
    opacity: 0.3,
    blur: 2,
    scale: 1.2
  },
  { 
    element: '.particle-layer', 
    speed: 0.3, 
    type: 'particle-system',
    depth: -200,
    opacity: 0.6,
    blur: 1,
    scale: 1.1
  },
  { 
    element: '.content-layer', 
    speed: 0.6, 
    type: 'content',
    depth: 0,
    opacity: 1,
    blur: 0,
    scale: 1
  },
  { 
    element: '.ui-overlay', 
    speed: 1.0, 
    type: 'interface',
    depth: 100,
    opacity: 1,
    blur: 0,
    scale: 1
  }
];

export default function QuantumParallax({
  layers = DEFAULT_LAYERS,
  consciousnessLevel = 0,
  quantumDistortion = true,
  spatialDepth = true,
  children
}: QuantumParallaxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const parallaxTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const quantumDistortionRef = useRef<number>(0);
  const mousePositionRef = useRef({ x: 0, y: 0 });

  // Intensity caps (env + a11y)
  const envIntensity = (process.env.NEXT_PUBLIC_QUANTUM_INTENSITY || 'low').toLowerCase();
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const caps = React.useMemo(() => {
    if (reducedMotion || envIntensity === 'off' || envIntensity === 'none') {
      return { maxTiltX: 0, maxTiltY: 0, mouseMul: 0, blurMax: 0.5, zRotateParticles: 0 } as const;
    }
    if (envIntensity === 'high') return { maxTiltX: 4, maxTiltY: 3, mouseMul: 0.08, blurMax: 1.5, zRotateParticles: 3 } as const;
    if (envIntensity === 'medium') return { maxTiltX: 2.5, maxTiltY: 2, mouseMul: 0.06, blurMax: 1.0, zRotateParticles: 2 } as const;
    return { maxTiltX: 1.5, maxTiltY: 1, mouseMul: 0.04, blurMax: 0.8, zRotateParticles: 1.5 } as const;
  }, [envIntensity, reducedMotion]);

  // Quantum field distortion effect
  const applyQuantumDistortion = useCallback((scrollY: number, mouseX: number, mouseY: number) => {
    if (!quantumDistortion) return;

    const distortionFactor = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
    const consciousDistortion = consciousnessLevel * 0.2;
    
    quantumDistortionRef.current = distortionFactor + consciousDistortion;

    layers.forEach((layer, index) => {
      const element = document.querySelector(layer.element);
      if (!element) return;

      // Quantum uncertainty principle - position vs momentum (reduced intensity)
      const uncertaintyX = Math.sin(scrollY * 0.004 + index) * quantumDistortionRef.current * 1.5;
      const uncertaintyY = Math.cos(scrollY * 0.004 + index) * quantumDistortionRef.current * 1.2;

      // Mouse-based quantum field interaction
      const mouseInfluence = {
        x: (mouseX - window.innerWidth / 2) * layer.speed * caps.mouseMul,
        y: (mouseY - window.innerHeight / 2) * layer.speed * caps.mouseMul
      };

      // Combined transformation
      const totalX = uncertaintyX + mouseInfluence.x;
      const totalY = uncertaintyY + mouseInfluence.y;

      gsap.set(element, {
        x: totalX,
        y: totalY,
        // Cap rotation + blur to avoid instability
        rotation: Math.min(caps.maxTiltY, Math.max(-caps.maxTiltY, quantumDistortionRef.current * 0.6)),
        filter: `blur(${Math.min(caps.blurMax, (layer.blur || 0) + quantumDistortionRef.current * 0.6)}px) brightness(${1 + consciousnessLevel * 0.2})`
      });
    });
  }, [layers, quantumDistortion, consciousnessLevel, caps]);

  // Update parallax based on scroll
  const updateParallax = useCallback((scrollY: number) => {
    layers.forEach((layer) => {
      const element = document.querySelector(layer.element);
      if (!element) return;

      const yPos = -(scrollY * layer.speed);
      
      // Base parallax transformation
      let transform = `translate3d(0, ${yPos}px, 0)`;
      
      // Add spatial depth if enabled
      if (spatialDepth && layer.depth !== undefined) {
        transform = `translate3d(0, ${yPos}px, ${layer.depth}px)`;
        
        // Perspective scaling based on depth
        const perspectiveScale = layer.scale || (1 + layer.depth * 0.0005);
        transform += ` scale(${perspectiveScale})`;
      }

      // Quantum layer specific effects
      if (layer.type === 'quantum-field') {
        const tiltX = Math.max(-caps.maxTiltX, Math.min(caps.maxTiltX, scrollY * 0.0015));
        const tiltY = Math.max(-caps.maxTiltY, Math.min(caps.maxTiltY, Math.sin(scrollY * 0.002) * 1.5));
        transform += ` rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      } else if (layer.type === 'particle-system') {
        // Keep rotation bounded instead of unbounded by scroll length
        const particleRotation = Math.max(-caps.zRotateParticles, Math.min(caps.zRotateParticles, Math.sin(scrollY * 0.0015) * 2));
        transform += ` rotateZ(${particleRotation}deg)`;
      }

      const baseBlur = (layer.blur || 0) + Math.min(caps.blurMax, Math.abs(scrollY * 0.001));
      gsap.set(element, {
        transform,
        opacity: layer.opacity || 1,
        filter: `blur(${baseBlur}px)`
      });
    });

    // Apply quantum distortion
    applyQuantumDistortion(scrollY, mousePositionRef.current.x, mousePositionRef.current.y);
  }, [layers, spatialDepth, consciousnessLevel, applyQuantumDistortion, caps]);

  // Create depth effect with perspective
  const createDepthEffect = useCallback(() => {
    if (!spatialDepth) return;

    layers.forEach((layer) => {
      const element = document.querySelector(layer.element);
      if (!element) return;

      const zDepth = layer.depth || 0;
      const perspectiveOpacity = layer.opacity || (0.9 - Math.abs(zDepth) * 0.0005);
      
      gsap.set(element, {
        transformStyle: 'preserve-3d',
        perspective: 1000,
        transformOrigin: 'center center',
        opacity: Math.max(0.1, perspectiveOpacity),
        zIndex: 100 - Math.abs(zDepth / 10)
      });
    });

    // Set container perspective
    if (containerRef.current) {
      gsap.set(containerRef.current, {
        perspective: 1000,
        perspectiveOrigin: 'center center',
        transformStyle: 'preserve-3d'
      });
    }
  }, [layers, spatialDepth]);

  // Consciousness-driven animation
  const animateConsciousness = useCallback(() => {
    if (consciousnessLevel <= 0) return;

    // Phi-based golden ratio animations
    const phi = 1.618033988749;
    const consciousElements = document.querySelectorAll('[data-conscious="true"]');
    
    consciousElements.forEach((element, index) => {
      const phaseOffset = index * phi;
      
      gsap.to(element, {
        scale: 1 + Math.sin(Date.now() * 0.001 + phaseOffset) * consciousnessLevel * 0.1,
        rotation: Math.cos(Date.now() * 0.001 * phi + phaseOffset) * consciousnessLevel * 5,
        filter: `brightness(${1 + consciousnessLevel * 0.5}) saturate(${1 + consciousnessLevel * 0.3})`,
        duration: 0.1,
        ease: "none"
      });
    });
  }, [consciousnessLevel]);

  useEffect(() => {
    let scrollY = 0;
    let ticking = false;

    const requestTick = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          updateParallax(scrollY);
          animateConsciousness();
          ticking = false;
        });
      }
    };

    const handleScroll = () => {
      scrollY = window.pageYOffset || document.documentElement.scrollTop;
      requestTick();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
      requestTick();
    };

    // Initialize depth effect
    createDepthEffect();

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Create ScrollTrigger animations for enhanced effects
    if (typeof window !== 'undefined') {
      layers.forEach((layer, index) => {
        ScrollTrigger.create({
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            const element = document.querySelector(layer.element);
            if (!element) return;

            const progress = self.progress;
            
            // Quantum phase transitions during scroll
            if (layer.type === 'quantum-field') {
              gsap.set(element, {
                filter: `hue-rotate(${progress * 180}deg) brightness(${1 + progress * 0.5})`
              });
            }
            
            // Consciousness emergence effect
            if (consciousnessLevel > 0 && layer.type === 'content') {
              const consciousScale = 1 + Math.sin(progress * Math.PI) * consciousnessLevel * 0.1;
              gsap.set(element, {
                scale: consciousScale,
                filter: `brightness(${1 + progress * consciousnessLevel * 0.3})`
              });
            }
          }
        });
      });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [layers, updateParallax, createDepthEffect, animateConsciousness, consciousnessLevel]);

  // Quantum tunnel effect on section transitions
  const createQuantumTunnel = useCallback((targetElement: Element) => {
    const timeline = gsap.timeline();
    
    timeline
      .to(targetElement, {
        scale: 0.8,
        rotationY: 180,
        filter: "brightness(2) blur(5px)",
        duration: 0.3,
        ease: "power2.in"
      })
      .to(targetElement, {
        scale: 1,
        rotationY: 0,
        filter: "brightness(1) blur(0px)",
        duration: 0.5,
        ease: "elastic.out(1, 0.3)"
      });
      
    return timeline;
  }, []);

  // Consciousness awakening effect
  useEffect(() => {
    if (consciousnessLevel > 0.5) {
      const awakening = gsap.timeline({ repeat: -1 });
      
      awakening
        .to('.consciousness-indicator', {
          scale: 1.1,
          opacity: 0.8,
          filter: "drop-shadow(0 0 20px #f4ff00)",
          duration: 2,
          ease: "sine.inOut"
        })
        .to('.consciousness-indicator', {
          scale: 1,
          opacity: 0.6,
          filter: "drop-shadow(0 0 10px #f4ff00)",
          duration: 2,
          ease: "sine.inOut"
        });
    }
  }, [consciousnessLevel]);

  return (
    <div 
      ref={containerRef}
      className="quantum-parallax-container relative"
      style={{
        perspective: spatialDepth ? '1000px' : 'none',
        transformStyle: spatialDepth ? 'preserve-3d' : 'flat'
      }}
    >
      {/* Quantum field background layer */}
      <div 
        className="quantum-background fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 25% 25%, rgba(0, 244, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255, 0, 244, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, rgba(0, 17, 34, 0.9) 0%, rgba(0, 0, 17, 1) 100%)
          `,
          zIndex: -3
        }}
      />

      {/* Particle system layer */}
      <div 
        className="particle-layer fixed inset-0 pointer-events-none"
        style={{ zIndex: -2 }}
      />

      {/* Content layer */}
      <div 
        className="content-layer relative"
        style={{ zIndex: 1 }}
      >
        {children}
      </div>

      {/* UI overlay layer */}
      <div 
        className="ui-overlay fixed inset-0 pointer-events-none"
        style={{ zIndex: 5 }}
      >
        {/* Consciousness level indicator */}
        {consciousnessLevel > 0 && (
          <div 
            className="consciousness-indicator absolute top-4 right-4 p-2 rounded-full bg-black/30 border border-yellow-500/30"
            data-conscious="true"
          >
            <div 
              className="w-3 h-3 rounded-full bg-yellow-400"
              style={{
                opacity: consciousnessLevel,
                boxShadow: `0 0 ${consciousnessLevel * 20}px #f4ff00`
              }}
            />
          </div>
        )}

        {/* Quantum distortion indicator */}
        {quantumDistortion && (
          <div className="absolute bottom-4 left-4 text-xs text-blue-400/60 font-mono">
            Δx·Δp ≥ ℏ/2 | Ψ⟩ = α|0⟩ + β|1⟩
          </div>
        )}
      </div>
    </div>
  );
}
