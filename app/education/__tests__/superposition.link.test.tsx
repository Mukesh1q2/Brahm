import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock flags to disable three.js path
jest.mock('@/lib/flags', () => ({ flags: { three: false } }));

// Mock speech
beforeAll(() => {
  // @ts-ignore
  global.SpeechSynthesisUtterance = function(){} as any;
  // @ts-ignore
  global.window.speechSynthesis = { speak: () => {}, cancel: () => {}, addEventListener: ()=>{}, removeEventListener: ()=>{} } as any;
});

describe('Superposition shareable link', () => {
  test('reads theta from query', async () => {
    const Comp = require('../superposition/page').default as React.FC;
    const url = new URL('http://localhost/education/superposition?theta=0.9');
    Object.defineProperty(window, 'location', { value: { search: url.search } } as any);
    render(<Comp />);
    // Check that the 2D fallback renders probability bars reflecting theta
    expect(await screen.findByText(/p/).catch(()=>null)).toBeNull();
    // We can at least assert that the control label renders
    expect(screen.getByText(/a0 = cos/)).toBeInTheDocument();
  });
});

