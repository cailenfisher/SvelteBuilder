import { defineConfig, devices } from '@playwright/test';

// Runs against a production build served by `vite preview`, not the dev server: what is
// audited is the markup a scaffold would ship, and a build fails fast on anything the dev
// server would only warn about.
const PORT = 4174;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  // Three engines: the color tokens rely on CSS relative color syntax, and focus, overlay and
  // keyboard behaviour differ between them. CI runs one engine per job (--project).
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // axe runs several times slower in Firefox and WebKit; 30s timed out on whichever large pages
    // a busy run happened to schedule together.
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, timeout: 60_000 },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, timeout: 60_000 },
  ],
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
