import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/flags', () => ({ flags: { three: false } }));

beforeAll(() => {
  // @ts-ignore
  global.SpeechSynthesisUtterance = function(){} as any;
  // @ts-ignore
  global.window.speechSynthesis = { speak: () => {}, cancel: () => {}, addEventListener: ()=>{}, removeEventListener: ()=>{} } as any;
});

describe('Tunneling shareable link', () => {
  test('reads barrier/energy from query', async () => {
    const Comp = require('../tunneling/page').default as React.FC;
    const url = new URL('http://localhost/education/tunneling?barrier=8.5&energy=7.1');
    Object.defineProperty(window, 'location', { value: { search: url.search } } as any);
    render(<Comp />);
    expect(screen.getByText(/2D fallback/)).toBeInTheDocument();
    expect(screen.getByText(/tunneling probability/i)).toBeInTheDocument();
  });
});

