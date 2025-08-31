import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RightContextPanel from '../RightContextPanel';

jest.mock('@/store/rightPanelStore', () => {
  const actual = jest.requireActual('@/store/rightPanelStore');
  return {
    ...actual,
    useRightPanelStore: (fn: any) => fn({
      tab: 'memory',
      setTab: jest.fn(),
      hydrate: jest.fn(),
      activeRunId: null,
      setActiveRun: jest.fn(),
    })
  };
});

jest.mock('@/store/agentEventBus', () => ({
  useAgentEventBus: (fn: any) => fn({ events: [] })
}));

// Ensure fetch is available
beforeEach(() => {
  (global.fetch as any) = jest.fn().mockResolvedValue({ json: async () => ({ episodes: [] }) });
});

it('renders Memory tab and controls', async () => {
  render(<RightContextPanel />);
  expect(await screen.findByText('Episodic memories')).toBeInTheDocument();
  expect(screen.getByTestId('memory-q-input')).toBeInTheDocument();
  expect(screen.getByTestId('memory-apply')).toBeInTheDocument();
});

