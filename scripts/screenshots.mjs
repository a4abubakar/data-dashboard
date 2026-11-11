// Generates the README screenshots against a running server (default http://localhost:3002).
//   npm run dev   (in one terminal)   then   npm run screenshots
// Uses Microsoft Edge (channel "msedge"); remove the `channel` option if Playwright's own Chromium works for you.
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3002";
const outDir = new URL("../docs/screenshots/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "msedge" });

const shots = [
  { name: "desktop-light", scheme: "light", viewport: { width: 1440, height: 900 } },
  { name: "desktop-dark", scheme: "dark", viewport: { width: 1440, height: 900 } },
  { name: "mobile-light", scheme: "light", viewport: { width: 390, height: 844 }, mobile: true },
  { name: "mobile-dark", scheme: "dark", viewport: { width: 390, height: 844 }, mobile: true },
];

for (const shot of shots) {
  const context = await browser.newContext({
    viewport: shot.viewport,
    colorScheme: shot.scheme,
    deviceScaleFactor: shot.mobile ? 2 : 1,
    isMobile: shot.mobile ?? false,
    hasTouch: shot.mobile ?? false,
  });
  const page = await context.newPage();
  // A filtered view looks more interesting than the defaults: two lines of business, Dubai.
  await page.goto(`${base}/?lob=Motor,Health,Home&region=Dubai`);
  await page.getByRole("table").waitFor();
  await page.locator('[aria-busy="false"]').waitFor();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${outDir}${shot.name}.png`, fullPage: true });
  console.log("saved", shot.name);
  await context.close();
}

// Table alternative for a chart (accessibility feature).
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
  const page = await context.newPage();
  await page.goto(base);
  await page.getByRole("table").waitFor();
  await page.getByRole("button", { name: "View as table" }).first().click();
  await page.waitForTimeout(300);
  await page.getByRole("region", { name: "Renewals over time", exact: true }).screenshot({ path: `${outDir}chart-as-table.png` });
  console.log("saved chart-as-table");
  await context.close();
}

await browser.close();
