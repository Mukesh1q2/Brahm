import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Look for tests in both top-level e2e and tests/e2e
  testDir: '.',
  testMatch: [
    'e2e/**/*.ts',
    'e2e/**/*.tsx',
    'tests/e2e/**/*.ts',
    'tests/e2e/**/*.tsx',
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3020',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    testIdAttribute: 'data-testid',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3020',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_FUTURISTIC_UI: 'true',
      NEXT_PUBLIC_E2E_HOOKS: 'true',
      NEXT_PUBLIC_PERSIST_REMOTE: 'true',
      NEXT_PUBLIC_CHATGPT_UI: 'true',
      NEXT_PUBLIC_VOICE_ENABLED: 'true',
      NEXT_PUBLIC_WAKEWORD_ENABLED: 'true',
      PORT: '3020',
      TSC_COMPILE_ON_ERROR: 'true',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

