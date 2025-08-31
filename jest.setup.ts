import '@testing-library/jest-dom';

// Stable request id for tests when code tries to use crypto.randomUUID
if (!(global as any).crypto) {
  (global as any).crypto = {} as any;
}
if (!(global as any).crypto.randomUUID) {
  (global as any).crypto.randomUUID = () => '00000000-0000-4000-8000-000000000000';
}

// Mock fetch by default to avoid network calls in unit tests
if (!(global as any).fetch) {
  (global as any).fetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({ total: 0, entries: [] })
  })) as any;
}

