"use client";

import React, { useEffect } from 'react';

interface StabilizedQuantumLayoutProps {
  children: React.ReactNode;
  enableQuantumEffects?: boolean;
  autoStartConsciousness?: boolean; // kept for parity, not used here
  consciousnessLevel?: number; // kept for parity, not used here
}

export default function StabilizedQuantumLayout({
  children,
  enableQuantumEffects = true,
}: StabilizedQuantumLayoutProps) {
  useEffect(() => {
    const resetGlobalTransformations = () => {
      try {
        document.documentElement.style.transform = 'none';
        document.body.style.transform = 'none';
        document.body.style.transformStyle = 'flat';
        document.body.style.perspective = 'none';
        document.body.style.overflowX = 'hidden';
      } catch {}
    };

    resetGlobalTransformations();

    const addStabilizationButton = () => {
      if (document.getElementById('emergency-stabilize')) return;
      const button = document.createElement('button');
      button.id = 'emergency-stabilize';
      button.textContent = '⚡ Stabilize';
      Object.assign(button.style, {
        position: 'fixed', top: '20px', right: '20px', zIndex: '10000',
        background: '#ff4444', color: '#fff', padding: '8px 12px',
        borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', border: 'none'
      } as CSSStyleDeclaration);
      button.onclick = () => {
        resetGlobalTransformations();
        try { window.dispatchEvent(new CustomEvent('quantum-stabilize')); } catch {}
      };
      document.body.appendChild(button);
    };

    addStabilizationButton();
    return () => {
      const el = document.getElementById('emergency-stabilize');
      if (el) try { el.remove(); } catch {}
    };
  }, []);

  return (
    <div className="quantum-layout-stabilized">
      <div className="content-container" style={{ position: 'relative', zIndex: 10, overflow: 'hidden' as const }}>
        {children}
      </div>
      {enableQuantumEffects && (
        <div className="quantum-effects-container" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, isolation: 'isolate' as const }} />
      )}
    </div>
  );
}

