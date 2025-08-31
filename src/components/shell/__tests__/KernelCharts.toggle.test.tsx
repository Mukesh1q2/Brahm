import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

describe('Kernel tab charts toggle', () => {
  test('shows and hides charts with toggle', async () => {
    jest.doMock('@/lib/flags', () => ({ flags: { toolRunner: false, kernelCharts: true, quantum: false, three: false, debugPanel: false, voiceEnabled: false, wakewordEnabled: false, episodicMemory: false, stabilityMitigation: false, performanceControls: false, persistRemote: false, e2eHooks: false } }));
    const Mod = await import('../../RightContextPanel');
    const Comp = (Mod as any).default as React.FC<any>;
    render(<Comp reasoningSummary={undefined} reasoningJson={undefined} codeDiff={null} />);
    // Tab default to kernel via mocked store; click for parity
    const kernelTab = screen.getByTestId('right-panel-tab-kernel');
    await userEvent.click(kernelTab);
    // Charts enabled badge should be present
    expect(screen.getByText(/charts:on/i)).toBeInTheDocument();
    // Phi trend label present when enabled
    expect(screen.getByText(/Phi trend/i)).toBeInTheDocument();
    // Disable charts via checkbox
    const toggle = screen.getByLabelText(/Enable charts/i) as HTMLInputElement;
    await userEvent.click(toggle);
    // Badge updates and chart label disappears
    expect(screen.getByText(/charts:off/i)).toBeInTheDocument();
    expect(screen.queryByText(/Phi trend/i)).toBeNull();
    jest.dontMock('@/lib/flags');
  });
});
