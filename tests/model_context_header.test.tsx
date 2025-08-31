import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ModelProvider } from '../app/_components/ModelContext';
import { SiteHeader } from '../app/layout';

function Provider({ children }: { children: React.ReactNode }) {
  return <ModelProvider>{children}</ModelProvider>;
}

describe('ModelContext and SiteHeader', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults model to auto and hides global selector for novices', () => {
    const { container } = render(
      <Provider>
        <SiteHeader />
      </Provider>
    );
    // expert off initially -> only Expert toggle is visible, no Model select
    const expertToggle = screen.getByLabelText(/Expert/i);
    expect(expertToggle).toBeInTheDocument();
    // No "Model" label yet
    expect(screen.queryByText('Model')).not.toBeInTheDocument();
  });

  it('shows global selector in Expert mode and persists model change', () => {
    const { unmount } = render(
      <Provider>
        <SiteHeader />
      </Provider>
    );
    const expertToggle = screen.getByLabelText(/Expert/i);
    fireEvent.click(expertToggle);
    // header model label visible
    expect(screen.getAllByText('Model').length).toBeGreaterThan(0);
    const select = screen.getByDisplayValue('auto') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'gpt-4o' } });
    expect((screen.getByDisplayValue('gpt-4o') as HTMLSelectElement).value).toBe('gpt-4o');
    // reload simulated by unmount + mount
    unmount();
    cleanup();
    render(
      <Provider>
        <SiteHeader />
      </Provider>
    );
    const expert2 = screen.getByLabelText(/Expert/i) as HTMLInputElement;
    if (!screen.queryByText('Model')) {
      if (!expert2.checked) fireEvent.click(expert2);
    }
    const select2 = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
    expect(select2.value).toBe('gpt-4o');
  });
});

