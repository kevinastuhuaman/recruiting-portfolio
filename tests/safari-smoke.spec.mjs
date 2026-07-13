import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("WebKit renders the recruiter path and assistant without accessibility violations", async ({ page, browserName }) => {
  expect(browserName).toBe("webkit");
  // Production is HTTPS. Astro's production CSP correctly upgrades insecure
  // requests, but that makes WebKit upgrade the local HTTP preview's own CSS
  // and JS to an unavailable HTTPS origin. Strip only that no-op-on-production
  // directive from preview document responses so the Safari engine can render
  // the exact built assets during local verification.
  await page.route("http://127.0.0.1:4321/**", async (route) => {
    if (route.request().resourceType() !== "document") return route.continue();
    const response = await route.fetch();
    const body = (await response.text()).replace("upgrade-insecure-requests;", "");
    await route.fulfill({ response, body });
  });
  for (const path of ["/", "/resume/", "/ask/"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    );
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations, `${path} WebKit Axe violations`).toEqual([]);
  }
  await page.getByRole("tab", { name: /Voice/ }).click();
  await expect(page.getByText(/This is an AI guide, not Kevin/i)).toBeVisible();
});
