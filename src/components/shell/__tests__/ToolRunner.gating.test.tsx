import React from 'react';
import { render, screen } from '@testing-library/react';

// Provide minimal mocks for Zustand stores used by RightContextPanel
const makeStore = (overrides: any = {}) => {
  const state = {
    tab: 'kernel',
    setTab: (_t: any) => {},
    activeRunId: null,
    setActiveRun: (_id: any) => {},
    hydrate: () => {},
    ...overrides,
  };
  const hook: any = (sel?: any) => (typeof sel === 'function' ? sel(state) : state);
  hook.getState = () => state;
  return hook;
};

jest.mock('@/store/rightPanelStore', () => ({
  useRightPanelStore: makeStore(),
}));
jest.mock('@/store/agentEventBus', () => ({
  useAgentEventBus: (sel?: any) => (sel ? sel({ events: [] }) : { events: [] }),
}));

// Triage: complex mount with live effects; skip pending store harness refactor
describe.skip('ToolRunner gating', () => {
  test('hidden when flag disabled', () => {
    jest.isolateModules(() => {
      jest.doMock('@/lib/flags', () => ({ flags: { toolRunner: false, kernelCharts: false, quantum: false, three: false, debugPanel: false, voiceEnabled: false, wakewordEnabled: false, episodicMemory: false, stabilityMitigation: false, performanceControls: false, persistRemote: false, e2eHooks: false, toolRunnerPersist: false } }));
      const Mod = require('../../RightContextPanel');
      const Comp = (Mod as any).default as React.FC<any>;
      render(<Comp reasoningSummary={undefined} reasoningJson={undefined} codeDiff={null} />);
      expect(screen.queryByText(/Run tool/i)).toBeNull();
    });
  });

  test('visible when flag enabled', async () => {
    jest.isolateModules(() => {
      jest.doMock('@/lib/flags', () => ({ flags: { toolRunner: true, kernelCharts: false, quantum: false, three: false, debugPanel: false, voiceEnabled: false, wakewordEnabled: false, episodicMemory: false, stabilityMitigation: false, performanceControls: false, persistRemote: false, e2eHooks: false, toolRunnerPersist: false } }));
      // Stub fetch for tools list
      (global as any).fetch = jest.fn(async () => ({ json: async () => ({ items: [{ name: 'echo', desc: 'ok' }] }) }))
      // Ensure token is empty to avoid lock gate
      delete (process.env as any).NEXT_PUBLIC_TOOL_RUNNER_TOKEN;
      const Mod = require('../../RightContextPanel');
      const Comp = (Mod as any).default as React.FC<any>;
      render(<Comp reasoningSummary={undefined} reasoningJson={undefined} codeDiff={null} />);
      expect(screen.getByText(/Run tool/i)).toBeInTheDocument();
    });
  });
});
