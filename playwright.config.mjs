import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "./tmp/playwright-results",
  reporter: [["line"]],
  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run preview -- --port 4321",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    { name: "desktop-chromium", testIgnore: /safari-smoke\.spec\.mjs/, use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", testIgnore: /safari-smoke\.spec\.mjs/, use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "desktop-webkit", testMatch: /safari-smoke\.spec\.mjs/, use: { ...devices["Desktop Safari"] } },
  ],
});
