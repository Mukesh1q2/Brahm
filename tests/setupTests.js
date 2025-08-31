require('@testing-library/jest-dom');
// Ensure async/await (regenerator) works with ts-jest downleveling
try { require('regenerator-runtime/runtime'); } catch {}

// Ensure fetch exists in jsdom tests (ModelProvider patches fetch)
(function ensureFetch() {
  try {
    const makeStubResponse = () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      clone() { return this; },
      json: async () => ({}),
      text: async () => "",
    });
    if (typeof global.fetch !== 'function') {
      // eslint-disable-next-line no-undef
      global.fetch = jest.fn(async () => makeStubResponse());
    }
    if (typeof window !== 'undefined') {
      if (typeof window.fetch !== 'function') {
        // Bind to window to satisfy code that calls .bind(window)
        // eslint-disable-next-line no-undef
        window.fetch = (global.fetch || (async () => makeStubResponse())).bind(window);
      }
    }
  } catch {}
})();

// Polyfill TextEncoder/TextDecoder and WHATWG Request/Response if missing (Node < 20 or jest env)
(function polyfillTextEncoding(){
  try {
    if (typeof global.TextEncoder === 'undefined' || typeof global.TextDecoder === 'undefined') {
      const { TextEncoder, TextDecoder } = require('util');
      if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
      if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;
    }
  } catch {}
})();

// Polyfill WHATWG Request/Response for route tests (Node env)
(function polyfillFetchAPI(){
  try {
    if (typeof global.Request === 'undefined' || typeof global.Response === 'undefined') {
      const { Request, Response, Headers, fetch } = require('undici');
      if (typeof global.Request === 'undefined') global.Request = Request;
      if (typeof global.Response === 'undefined') global.Response = Response;
      if (typeof global.Headers === 'undefined') global.Headers = Headers;
      if (typeof global.fetch === 'undefined') global.fetch = fetch;
    }
  } catch {}
})();

// jsdom: stub canvas context used by QuantumGraph
(function stubCanvas(){
  try {
    const proto = window.HTMLCanvasElement && window.HTMLCanvasElement.prototype;
    if (proto) {
      Object.defineProperty(proto, 'getContext', {
        configurable: true,
        writable: true,
        value: jest.fn(() => ({
          // Minimal 2D context surface used by our component
          clearRect: jest.fn(),
          beginPath: jest.fn(),
          moveTo: jest.fn(),
          lineTo: jest.fn(),
          stroke: jest.fn(),
          arc: jest.fn(),
          fill: jest.fn(),
          // properties
          set strokeStyle(_v) {},
          set fillStyle(_v) {},
          set lineWidth(_v) {},
        })),
      });
    }
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
    }
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = (id) => clearTimeout(id);
    }
  } catch {}
})();
