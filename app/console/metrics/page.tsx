"use client";

import React from "react";
import QuantumMetricsDashboard from "../../quantum/_components/QuantumMetricsDashboard";

export default function ConsoleMetricsPage() {
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-3">
      <h1 className="text-xl font-semibold">Metrics</h1>
      <p className="text-sm text-gray-400">Global workspace metrics across quantum demos.</p>
      <QuantumMetricsDashboard />
    </div>
  );
}

