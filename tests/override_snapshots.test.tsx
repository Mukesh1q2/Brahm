import React from 'react';
import { render, screen } from '@testing-library/react';
import EditorPage from '../app/editor/page';
import CanvasPage from '../app/canvas/page';
import ConsolePage from '../app/console/page';
import { ModelProvider } from '../app/_components/ModelContext';

function Provider({ children }: { children: React.ReactNode }) {
  return <ModelProvider>{children}</ModelProvider>;
}

describe('Override UI snapshots', () => {
  it('Editor shows "Using global" by default', () => {
    const { asFragment } = render(<Provider><EditorPage /></Provider>);
    expect(screen.getByText(/Using global:/i)).toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });
  it('Canvas shows "Using global" by default', () => {
    const { asFragment } = render(<Provider><CanvasPage /></Provider>);
    expect(screen.getByText(/Using global:/i)).toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });
  it('Console renders model filter', () => {
    const { asFragment } = render(<Provider><ConsolePage /></Provider>);
    // At least one combobox (model selector)
    expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0);
    expect(asFragment()).toMatchSnapshot();
  });
});

