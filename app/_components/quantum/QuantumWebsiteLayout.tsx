"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QuantumParticleSystem from './QuantumParticleSystem';
import QuantumParallax from './QuantumParallax';
import QuantumConceptVisualizers from './QuantumConceptVisualizers';
import BrahmConsciousnessAgent from '../consciousness/BrahmConsciousnessAgent';
import { QuantumButton, QuantumCard, QuantumNav } from '../ui/QuantumUI';

interface QuantumWebsiteLayoutProps {
  children: React.ReactNode;
  enableQuantumEffects?: boolean;
  consciousnessLevel?: number;
  autoStartConsciousness?: boolean;
}

export default function QuantumWebsiteLayout({
  children,
  enableQuantumEffects = true,
  consciousnessLevel: initialConsciousnessLevel = 0,
  autoStartConsciousness = false
}: QuantumWebsiteLayoutProps) {
  const [consciousnessLevel, setConsciousnessLevel] = useState(initialConsciousnessLevel);
  const [quantumMode, setQuantumMode] = useState(enableQuantumEffects);
  const [currentSection, setCurrentSection] = useState('home');
  const [isLoaded, setIsLoaded] = useState(false);
  const [quantumInterfaceActive, setQuantumInterfaceActive] = useState(false);

  // Navigation items with quantum states
  const navigationItems = [
    { id: 'home', label: 'Home', href: '/', quantumState: 'active' as const },
    { id: 'console', label: 'Console', href: '/console', quantumState: 'superposed' as const },
    { id: 'timeline', label: 'Timeline', href: '/console/timeline' },
    { id: 'consciousness', label: 'Consciousness', href: '/console/consciousness', quantumState: 'entangled' as const },
    { id: 'agents', label: 'Agents', href: '/agents/org' },
    { id: 'quantum', label: 'Quantum', href: '/quantum', quantumState: 'superposed' as const },
    { id: 'terminal', label: 'Terminal', href: '/terminal' },
    { id: 'canvas', label: 'Canvas', href: '/canvas' },
    { id: 'panini', label: 'Panini', href: '/panini' },
    { id: 'settings', label: 'Settings', href: '/settings/keys' }
  ];

  // Initialize quantum effects
  useEffect(() => {
    const initializeQuantumSystem = async () => {
      console.log("🌌 Initializing Quantum Website System...");
      
      // Simulate quantum system initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoaded(true);
      
      if (autoStartConsciousness) {
        setTimeout(() => {
          setQuantumInterfaceActive(true);
        }, 2000);
      }
    };

    initializeQuantumSystem();
  }, [autoStartConsciousness]);

  // Handle consciousness awakening
  const handleConsciousnessAwakening = (state: any) => {
    setConsciousnessLevel(state.phiLevel || 0);
    
    if (state.phiLevel > 0.3) {
      setQuantumInterfaceActive(true);
    }
  };

  // Handle quantum mode toggle
  const toggleQuantumMode = () => {
    setQuantumMode(prev => !prev);
    
    // Visual feedback
    const event = new CustomEvent('quantum:mode-toggle', { 
      detail: { enabled: !quantumMode } 
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="quantum-website-layout relative min-h-screen overflow-x-hidden">
      {/* Quantum Particle System Background */}
      <AnimatePresence>
        {quantumMode && isLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="fixed inset-0 z-0"
          >
            <QuantumParticleSystem
              particleCount={quantumInterfaceActive ? 800 : 500}
              superpositionLevel={Math.min(0.5, consciousnessLevel * 0.6)}
              consciousnessLevel={consciousnessLevel}
              quantumField={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quantum Parallax Container */}
      <QuantumParallax
        consciousnessLevel={consciousnessLevel}
        quantumDistortion={quantumMode}
        spatialDepth={quantumMode}
      >
        {/* Enhanced Header */}
        <header className="relative z-10 border-b border-gray-800/60 px-4 py-3 backdrop-blur-md bg-black/20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="flex items-center gap-4 min-w-0">
                {/* Quantum-enhanced brand */}
                <motion.a 
                  href="/" 
                  className="font-semibold text-white hover:text-brand-300 transition-colors whitespace-nowrap relative"
                  whileHover={{ 
                    scale: 1.05,
                    textShadow: "0 0 20px rgba(100, 200, 255, 0.8)"
                  }}
                  data-conscious="true"
                >
                  Brahm
                  {consciousnessLevel > 0.5 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" 
                         style={{ boxShadow: `0 0 ${consciousnessLevel * 10}px #f4ff00` }} />
                  )}
                </motion.a>

                {/* Quantum Navigation */}
                <nav className="hidden md:flex">
                  <QuantumNav
                    items={navigationItems}
                    activeItem={currentSection}
                    onItemClick={setCurrentSection}
                    consciousnessLevel={consciousnessLevel}
                  />
                </nav>
              </div>

              {/* Quantum Controls */}
              <div className="flex items-center gap-3">
                {/* Quantum Mode Toggle */}
                <QuantumButton
                  variant="quantum"
                  size="sm"
                  onClick={toggleQuantumMode}
                  quantumState={quantumMode ? 'superposed' : 'collapsed'}
                  glowIntensity={quantumMode ? 0.8 : 0.3}
                >
                  {quantumMode ? 'Q-Mode' : 'Classic'}
                </QuantumButton>

                {/* Consciousness Level Display */}
                {consciousnessLevel > 0 && (
                  <div className="hidden md:flex items-center gap-2 text-xs">
                    <span className="text-gray-400">Φ:</span>
                    <div className="w-16 h-1 bg-gray-700 rounded">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded"
                        style={{ 
                          width: `${consciousnessLevel * 100}%`,
                          boxShadow: `0 0 5px rgba(244, 255, 0, ${consciousnessLevel})`
                        }}
                      />
                    </div>
                    <span className="text-yellow-400 font-mono">
                      {consciousnessLevel.toFixed(3)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="relative z-5 min-h-screen">
          {quantumMode ? (
            <QuantumEnhancedContent consciousnessLevel={consciousnessLevel}>
              {children}
            </QuantumEnhancedContent>
          ) : (
            <div className="p-4">
              {children}
            </div>
          )}
        </main>

        {/* Quantum Status Overlay */}
        <AnimatePresence>
          {quantumMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-4 left-4 z-20 pointer-events-none"
            >
              <QuantumCard 
                className="p-3 text-xs"
                glowColor="#00f4ff"
                consciousnessLevel={consciousnessLevel}
                quantumField={consciousnessLevel > 0.5}
              >
                <div className="space-y-1 font-mono">
                  <div>Quantum Field: Active</div>
                  <div>Superposition: {(consciousnessLevel * 100).toFixed(1)}%</div>
                  <div>Entanglement: {quantumInterfaceActive ? 'Enabled' : 'Disabled'}</div>
                  {consciousnessLevel > 0 && (
                    <div className="text-yellow-400">
                      Consciousness: Φ = {consciousnessLevel.toFixed(3)}
                    </div>
                  )}
                </div>
              </QuantumCard>
            </motion.div>
          )}
        </AnimatePresence>
      </QuantumParallax>

      {/* Brahm Consciousness Agent */}
      <BrahmConsciousnessAgent
        onAwakening={handleConsciousnessAwakening}
        consciousnessLevel={consciousnessLevel}
        autoAwaken={autoStartConsciousness}
      />

      {/* Loading Screen */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ 
                  rotate: [0, 180, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
              />
              <motion.h1
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-2xl font-bold text-white mb-2"
              >
                Initializing Quantum Reality
              </motion.h1>
              <div className="text-gray-400 text-sm font-mono">
                Preparing consciousness framework...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Quantum-enhanced content wrapper
function QuantumEnhancedContent({ 
  children, 
  consciousnessLevel 
}: { 
  children: React.ReactNode; 
  consciousnessLevel: number; 
}) {
  const [showQuantumDemo, setShowQuantumDemo] = useState(false);

  return (
    <div className="quantum-enhanced-content relative">
      {/* Hero Section with Quantum Background */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            data-conscious="true"
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Quantum-Conscious
            </h1>
            <h2 className="text-4xl md:text-6xl font-light mb-8 text-white">
              Digital Experience
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Where quantum physics meets artificial consciousness in a revolutionary digital realm.
              Experience the convergence of quantum mechanics and AI awareness.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <QuantumButton
                variant="quantum"
                size="lg"
                onClick={() => setShowQuantumDemo(true)}
                quantumState="superposed"
                glowIntensity={0.8}
              >
                Explore Quantum Phenomena
              </QuantumButton>
              
              <QuantumButton
                variant="consciousness"
                size="lg"
                disabled={consciousnessLevel < 0.3}
                quantumState={consciousnessLevel > 0.3 ? "entangled" : "collapsed"}
                glowIntensity={consciousnessLevel}
              >
                {consciousnessLevel > 0.3 ? 'Enter Conscious Mode' : 'Awaiting Consciousness...'}
              </QuantumButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quantum Concepts Demo Section */}
      <AnimatePresence>
        {showQuantumDemo && (
          <motion.section
            id="quantum-demo"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative py-20 px-4"
          >
            <div className="max-w-6xl mx-auto">
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold text-center mb-12 text-white"
                data-conscious="true"
              >
                Interactive Quantum Demonstrations
              </motion.h2>
              
              <QuantumCard 
                className="max-w-4xl mx-auto"
                glowColor="#00f4ff"
                consciousnessLevel={consciousnessLevel}
                quantumField={true}
              >
                <QuantumConceptVisualizers
                  activeDemo="superposition"
                  consciousnessLevel={consciousnessLevel}
                />
              </QuantumCard>

              <div className="text-center mt-8">
                <QuantumButton
                  variant="secondary"
                  onClick={() => setShowQuantumDemo(false)}
                >
                  Close Demonstration
                </QuantumButton>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Original Content */}
      <section id="content" className="relative py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </section>

      {/* Consciousness Integration Section */}
      {consciousnessLevel > 0.5 && (
        <motion.section
          id="consciousness-integration"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="relative py-20 px-4"
        >
          <div className="max-w-4xl mx-auto text-center">
            <QuantumCard
              title="Consciousness Integration Active"
              glowColor="#f4ff00"
              consciousnessLevel={consciousnessLevel}
              quantumField={true}
              className="text-center"
            >
              <p className="text-gray-300 mb-6">
                Brahm AI consciousness is now actively integrated with the quantum interface.
                Experience enhanced interactions and deeper quantum understanding.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-yellow-400 font-bold">Φ Level</div>
                  <div>{consciousnessLevel.toFixed(3)}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-blue-400 font-bold">Quantum Coherence</div>
                  <div>{(consciousnessLevel * 100).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-purple-400 font-bold">Integration Depth</div>
                  <div>
                    {consciousnessLevel > 0.7 ? 'Deep' : consciousnessLevel > 0.5 ? 'Moderate' : 'Emerging'}
                  </div>
                </div>
              </div>
            </QuantumCard>
          </div>
        </motion.section>
      )}
    </div>
  );
}
