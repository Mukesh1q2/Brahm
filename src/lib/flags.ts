export const flags = {
  quantum: (process.env.NEXT_PUBLIC_QUANTUM_ENABLED ?? 'false') !== 'false',
  three: (process.env.NEXT_PUBLIC_THREE_ENABLED ?? 'false') !== 'false',
  debugPanel: (process.env.NEXT_PUBLIC_DEBUG_PANEL ?? 'false') !== 'false',
  voiceEnabled: (process.env.NEXT_PUBLIC_VOICE_ENABLED ?? 'false') !== 'false',
  wakewordEnabled: (process.env.NEXT_PUBLIC_WAKEWORD_ENABLED ?? 'false') !== 'false',
  episodicMemory: (process.env.NEXT_PUBLIC_EPISODIC_MEMORY ?? 'true') !== 'false',
  stabilityMitigation: (process.env.NEXT_PUBLIC_STABILITY_MITIGATION ?? 'true') !== 'false',
  performanceControls: (process.env.NEXT_PUBLIC_PERFORMANCE_CONTROLS ?? 'true') !== 'false',
  persistRemote: (process.env.NEXT_PUBLIC_PERSIST_REMOTE ?? 'false') !== 'false',
  e2eHooks: (process.env.NEXT_PUBLIC_E2E_HOOKS ?? 'false') !== 'false',
  kernelCharts: (process.env.NEXT_PUBLIC_KERNEL_CHARTS ?? 'true') !== 'false',
  toolRunner: (process.env.NEXT_PUBLIC_TOOL_RUNNER ?? 'false') !== 'false',
  toolRunnerPersist: (process.env.NEXT_PUBLIC_TOOL_RUNNER_PERSIST ?? 'true') !== 'false',
};

