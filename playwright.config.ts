import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests against a real build.
 *
 * Every bug that reached a tester so far lived in the click path:
 * a screen stuck on "listening back", answers silently lost, taps
 * landing on the wrong control after a reflow, the page not scrolling
 * to what you just asked for. None of it is visible from the server
 * side, which is why it kept shipping.
 *
 * Chromium comes from @sparticuz/chromium because Playwright's own
 * download host is not reachable from this environment.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3210",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH ?? "/tmp/chromium",
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        // Grant the microphone without a prompt, and feed it a
        // synthetic tone so recording can be exercised headlessly.
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
    },
    permissions: ["microphone"],
  },
  // Build and serve the real app, rather than testing a dev server that
  // behaves differently from production.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start -- -p 3210",
        port: 3210,
        timeout: 180_000,
        reuseExistingServer: true,
      },

  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
