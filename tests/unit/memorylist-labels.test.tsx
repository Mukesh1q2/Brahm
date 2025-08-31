import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryList } from '@/components/shell/RightContextPanel';

describe('MemoryList labels integration (persist remote)', () => {
  const ORIGS = { ...process.env } as any;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGS, NEXT_PUBLIC_PERSIST_REMOTE: 'true' } as any;
    (global.fetch as any) = jest.fn(async (url: string) => {
      if (String(url).includes('/api/persistence/status')) {
        return { json: async () => ({ ok: true }) } as any;
      }
      if (String(url).includes('/api/memory/episodes')) {
        return { json: async () => ({ items: [] }) } as any;
      }
      // fallback
      return { json: async () => ({ items: [] }) } as any;
    });
    try { window.history.replaceState({}, '', '/'); } catch {}
  });
  afterAll(() => { process.env = ORIGS as any; });

  it('adds label query params when applying filters', async () => {
    render(<MemoryList />);
    // Wait until DB-backed fetch has occurred at least once (persistRemoteOk === true and reload effect ran)
    await waitFor(() => (global.fetch as any).mock.calls.some((c: any[]) => String(c[0]).includes('/api/memory/episodes?limit=')));

    // Type a label and press Enter
    const input = screen.getByPlaceholderText('Add label (Enter)');
    fireEvent.change(input, { target: { value: 'safety' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    fireEvent.click(screen.getByTestId('memory-apply'));

    // URL search params reflect labels regardless of network timing
    await waitFor(() => expect(window.location.search).toContain('mem_label=safety'));
  });
});

