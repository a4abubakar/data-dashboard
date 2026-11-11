import { defineConfig, devices } from "@playwright/test";

const PORT = 3002;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      // `channel: "msedge"` uses the installed Microsoft Edge. Drop that line on CI or any machine where
      // Playwright's own Chromium launches fine.
      use: { ...devices["Desktop Chrome"], channel: "msedge" },
    },
  ],
  webServer: {
    // A production build is closer to what users get and avoids dev-mode compile pauses mid-test.
    command: "npm run build && npm run start",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 300_000,
    env: { RENEWALS_DELAY_MS: "150" },
  },
});
