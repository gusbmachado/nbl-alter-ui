import { defineConfig, devices } from '@playwright/test';
const devURL = process.env.NBL_TEST_BASE_URL;
const development = process.env.NBL_TEST_DEV === '1';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  use: { baseURL: devURL || 'http://127.0.0.1:4329', trace: 'retain-on-failure' },
  webServer: devURL ? undefined : { command: development ? 'node scripts/test-dev-server.mjs' : 'pnpm build && pnpm preview --port 4329', url: 'http://127.0.0.1:4329', reuseExistingServer: false, timeout: 120_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
});
