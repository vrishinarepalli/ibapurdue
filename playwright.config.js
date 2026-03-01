// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',

  // Run each test file sequentially — emulator state is shared
  fullyParallel: false,
  workers: 1,

  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Inject flag so firebase-config.js connects to emulators instead of production
    // (each test page also does page.addInitScript as a safety net)
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Serve the static files locally during tests
  webServer: {
    command: 'npx http-server . -p 8000 -c-1 --silent',
    port: 8000,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
});
