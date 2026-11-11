import { expect, test, type Page } from "@playwright/test";

const totalRenewals = async (page: Page) => {
  const text = (await page.getByRole("navigation", { name: "Pagination" }).textContent()) ?? "";
  const match = text.match(/of\s*([\d,]+)\s*renewals/);
  return Number((match?.[1] ?? "").replace(/,/g, ""));
};

const kpi = (page: Page, label: string) => page.locator("dt", { hasText: label }).locator("xpath=following-sibling::dd[1]");

const columnValues = async (page: Page, columnIndex: number) =>
  page.locator("tbody tr").evaluateAll((rows, i) => rows.map((r) => r.children[i].textContent ?? ""), columnIndex);

const aed = (text: string) => Number(text.replace(/[^\d.]/g, ""));

test("filter, sort and paginate the renewals dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Policy renewals" })).toBeVisible();

  // Data arrives through /api/renewals; wait for the first real render.
  await expect(kpi(page, "Total premium")).toContainText("AED");
  await expect(page.getByRole("table")).toBeVisible();
  const premiumBefore = await kpi(page, "Total premium").textContent();
  const totalBefore = await totalRenewals(page);
  expect(totalBefore).toBeGreaterThan(100);

  // Filter by line of business: URL, KPI, charts summary and table all react.
  await page.getByRole("checkbox", { name: "Motor" }).check();
  await expect(page).toHaveURL(/lob=Motor/);
  await expect(kpi(page, "Total premium")).not.toHaveText(premiumBefore!);
  const totalMotor = await totalRenewals(page);
  expect(totalMotor).toBeLessThan(totalBefore);
  expect(new Set(await columnValues(page, 2))).toEqual(new Set(["Motor"]));

  // A second filter narrows further and the status column agrees.
  await page.getByLabel("Status").selectOption("Lapsed");
  await expect(page).toHaveURL(/status=Lapsed/);
  await expect.poll(() => totalRenewals(page)).toBeLessThan(totalMotor);
  expect(new Set(await columnValues(page, 5))).toEqual(new Set(["Lapsed"]));

  // Sort by premium: descending first, with aria-sort on the header.
  const premiumHeader = page.getByRole("columnheader", { name: /premium/i });
  await premiumHeader.getByRole("button").click();
  await expect(premiumHeader).toHaveAttribute("aria-sort", "descending");
  await expect(page).toHaveURL(/sort=premium/);
  // aria-sort flips instantly; the rows follow when the API answers, so poll.
  await expect.poll(async () => {
    const values = (await columnValues(page, 6)).map(aed);
    return values.every((v, i) => i === 0 || v <= values[i - 1]);
  }).toBe(true);

  await premiumHeader.getByRole("button").click();
  await expect(premiumHeader).toHaveAttribute("aria-sort", "ascending");
  await expect.poll(async () => {
    const values = (await columnValues(page, 6)).map(aed);
    return values.every((v, i) => i === 0 || v >= values[i - 1]);
  }).toBe(true);

  // Page 2 shows different rows and a page indicator.
  const firstIdPage1 = (await columnValues(page, 0))[0];
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText(/Page 2 of/)).toBeVisible();
  await expect(page).toHaveURL(/page=2/);
  await expect.poll(async () => (await columnValues(page, 0))[0]).not.toBe(firstIdPage1);

  // Changing the page size resets to page 1.
  await page.getByLabel("Rows per page").selectOption("25");
  await expect(page.getByText(/Page 1 of/)).toBeVisible();
  const filteredTotal = await totalRenewals(page);
  await expect.poll(async () => (await columnValues(page, 0)).length).toBe(Math.min(25, filteredTotal));
});

test("search is debounced into the URL and CSV export matches the filtered rows", async ({ page }) => {
  await page.goto("/?status=Lapsed&channel=Agent");
  await expect(page.getByRole("table")).toBeVisible();
  const total = await totalRenewals(page);

  const search = page.getByRole("searchbox", { name: "Search renewals" });
  await search.fill("a");
  await expect(page).toHaveURL(/q=a/);
  await expect.poll(() => totalRenewals(page)).toBeLessThanOrEqual(total);

  const exportLink = page.getByRole("link", { name: /Export CSV/ });
  const filteredTotal = await totalRenewals(page);
  await expect(exportLink).toContainText(`${filteredTotal.toLocaleString("en-US")} rows`);
  const href = await exportLink.getAttribute("href");
  const response = await page.request.get(href!);
  expect(response.headers()["content-type"]).toContain("text/csv");
  const lines = (await response.text()).trim().split("\r\n");
  expect(lines[0]).toBe("ID,Customer,Line of business,Channel,Region,Status,Premium (AED),Renewal date");
  expect(lines).toHaveLength(filteredTotal + 1);
});

test("shows an empty state and clears filters", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("table")).toBeVisible();
  await page.getByRole("searchbox", { name: "Search renewals" }).fill("zzzz-no-such-customer");
  await expect(page.getByText("No renewals match these filters")).toBeVisible();

  await page.getByRole("button", { name: "Clear filters" }).first().click();
  await expect(page.getByText("No renewals match these filters")).toBeHidden();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search renewals" })).toHaveValue("");
  await expect(page).not.toHaveURL(/q=/);
});

test("recovers from a failed request with Retry", async ({ page }) => {
  // Next.js also renders a route announcer with role=alert, so target ours by its text.
  const alert = page.getByRole("alert").filter({ hasText: "Could not load renewals" });
  let fail = true;
  await page.route("**/api/renewals?*", (route) =>
    fail ? route.fulfill({ status: 500, body: "boom" }) : route.continue(),
  );
  await page.route("**/api/renewals", (route) => (fail ? route.fulfill({ status: 500, body: "boom" }) : route.continue()));

  await page.goto("/");
  await expect(alert).toBeVisible();

  fail = false;
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(alert).toBeHidden();
  await expect(page.getByRole("table")).toBeVisible();
});

test("dark mode toggle persists across reloads", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.getByRole("button", { name: "Dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "Dark mode" })).toHaveAttribute("aria-pressed", "true");
});

test("unknown routes render the not-found page", async ({ page }) => {
  const response = await page.goto("/nope");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
