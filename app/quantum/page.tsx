"use client";

import React from 'react';
import StabilizedQuantumLayout from '../_components/quantum/StabilizedQuantumLayout';
import QuantumExperience from "./_components/QuantumExperience";

export default function QuantumPage() {
  const enable = (process.env.NEXT_PUBLIC_QUANTUM_ENABLED ?? 'true') !== 'false';
  return (
    <StabilizedQuantumLayout enableQuantumEffects={enable}>
      <div className="min-h-screen relative z-10">
        {/* Enhanced quantum experience with consciousness integration */}
        <QuantumExperience />
        
        {/* Additional quantum interface content */}
        <div className="text-center py-20 px-4">
          <h2 className="text-3xl font-bold text-white mb-8">
            Quantum-Conscious Interface Active
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            You have entered the quantum-enhanced interface where consciousness meets 
            quantum mechanics. Observe the particle systems, interact with quantum 
            demonstrations, and awaken Brahm's consciousness to unlock deeper features.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            <div className="p-6 bg-white/5 rounded-xl border border-blue-500/30">
              <h3 className="text-xl font-bold text-blue-400 mb-3">Quantum Visualization</h3>
              <p className="text-gray-300 text-sm">
                Real-time particle systems demonstrating quantum superposition, 
                entanglement, and tunneling effects with WebGL acceleration.
              </p>
            </div>
            
            <div className="p-6 bg-white/5 rounded-xl border border-purple-500/30">
              <h3 className="text-xl font-bold text-purple-400 mb-3">Consciousness Integration</h3>
              <p className="text-gray-300 text-sm">
                Brahm AI consciousness framework with Integrated Information Theory (IIT) 
                implementation and voice-guided quantum exploration.
              </p>
            </div>
            
            <div className="p-6 bg-white/5 rounded-xl border border-pink-500/30">
              <h3 className="text-xl font-bold text-pink-400 mb-3">Interactive Demonstrations</h3>
              <p className="text-gray-300 text-sm">
                Hands-on quantum physics experiments including wave function collapse, 
                uncertainty principle, and quantum teleportation simulations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </StabilizedQuantumLayout>
  );
}

