"use client";
import React from 'react';
import dynamic from 'next/dynamic';

const CircuitPlayground = dynamic(()=> import('@/app/_components/quantum/CircuitPlayground'), { ssr: false });

export default function CircuitsPage() {
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Education • Circuit Playground</h1>
      <p className="text-sm text-gray-400">Build small circuits with H/X/Z, CNOT, and controlled phase. Run or step through and share your circuit.</p>
      <CircuitPlayground />
    </div>
  );
}

