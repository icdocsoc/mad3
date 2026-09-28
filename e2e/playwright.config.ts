import { defineConfig, devices } from '@playwright/test';

// One database and one dev server are shared by every test, so tests run one at a time.
export default defineConfig({
  testDir: './tests',
  globalSetup: './setup/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  outputDir: '../test-results',
  reporter: [['list'], ['json', { outputFile: '.run/results.json' }]],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } }
  ]
});
