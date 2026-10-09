import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const basePath = process.env.BASE_PATH || '';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1,
  reporter: 'list', timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync(chrome) ? chrome : undefined) } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npm run preview -- --port 4173', url: `http://127.0.0.1:4173${basePath}/`, reuseExistingServer: !process.env.CI, timeout: 30000 }
});
