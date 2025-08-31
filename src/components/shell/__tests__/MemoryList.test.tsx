import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryList } from '../RightContextPanel';

// Simple helper to get last fetch URL
const lastFetchUrl = () => (global.fetch as jest.Mock).mock.calls.at(-1)?.[0] as string | undefined;

describe('MemoryList', () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn(async (url: string) => {
      if (String(url).includes('/api/persistence/status')) {
        return { json: async () => ({ ok: false }) } as any;
      }
      if (String(url).includes('/api/agents/memory')) {
        return { json: async () => ({
          episodes: [
            {
              id: 'ep_1',
              experience: {
                timestamp: Date.now(),
                main_content: 'Test episode 1',
                phi_level: 4.2,
              },
            },
          ],
        }) } as any;
      }
      return { json: async () => ({ episodes: [] }) } as any;
    });
    // Reset URL to a clean state for each test
    try { window.history.replaceState({}, '', '/'); } catch {}
  });

  it('loads episodes and opens the detail drawer', async () => {
    render(<MemoryList />);

    // Fetches happen (status + memory)
    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(0));
    expect((global.fetch as jest.Mock).mock.calls.some(c => String(c[0]).includes('/api/agents/memory?limit=50'))).toBe(true);

    // Episode renders
    const episode = await screen.findByTestId('memory-episode');
    expect(episode).toHaveTextContent('Test episode 1');

    // Open drawer
    fireEvent.click(episode);
    const drawer = await screen.findByTestId('memory-drawer');
    expect(drawer).toBeInTheDocument();
  });

  it('applies filters, updates URL, and refetches', async () => {
    render(<MemoryList />);
    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(0));

    fireEvent.change(screen.getByTestId('memory-q-input'), { target: { value: 'hello' } });
    fireEvent.change(screen.getByTestId('memory-phi-min'), { target: { value: '3' } });
    fireEvent.change(screen.getByTestId('memory-mins'), { target: { value: '5' } });
    const before = (global.fetch as jest.Mock).mock.calls.length;
    fireEvent.click(screen.getByTestId('memory-apply'));

    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(before));
    const url = lastFetchUrl()!;
    expect(url).toContain('/api/agents/memory?');
    expect(url).toContain('q=hello');
    expect(url).toContain('phi_min=3');
    expect(url).toContain('since=');

    // URL persisted in location.search
    expect(window.location.search).toContain('mem_q=hello');
    expect(window.location.search).toContain('mem_phi_min=3');
    expect(window.location.search).toContain('mem_mins=5');
  });

  it('loads more episodes and increases limit', async () => {
    // Mock per URL to account for persistence status + memory calls
    (global.fetch as any) = jest.fn(async (url: string) => {
      if (String(url).includes('/api/persistence/status')) {
        return { json: async () => ({ ok: false }) } as any;
      }
      if (String(url).includes('/api/agents/memory?limit=50')) {
        return { json: async () => ({
          episodes: Array.from({ length: 50 }, (_, i) => ({
            id: `ep_${i+1}`,
            experience: { timestamp: Date.now(), main_content: `Episode ${i+1}`, phi_level: 4 }
          }))
        }) } as any;
      }
      if (String(url).includes('/api/agents/memory?') && String(url).includes('limit=100')) {
        return { json: async () => ({ episodes: [] }) } as any;
      }
      return { json: async () => ({ episodes: [] }) } as any;
    });

    render(<MemoryList />);
    // Wait until the episodes are loaded (button appears)
    const btn = await screen.findByTestId('memory-load-more');
    fireEvent.click(btn);

    await waitFor(() => expect(lastFetchUrl()!).toContain('limit=100'));
  });
});

