import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("WebKit renders the recruiter path and assistant without accessibility violations", async ({ page, browserName }) => {
  test.setTimeout(60_000);
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
  for (const path of [
    "/", "/resume/", "/ask/", "/contact/", "/about/", "/lab/", "/proof/",
    "/projects/trackly/", "/projects/paypal-ai-observability/",
    "/projects/berkeley-mobagel-ai-gtm/", "/projects/smb-fintech-bcp-credicorp/",
  ]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    );
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations, `${path} WebKit Axe violations`).toEqual([]);
  }
  await page.goto("/ask/");
  await page.getByRole("tab", { name: /Voice/ }).click();
  await expect(page.getByText(/Nothing starts until you tap the button, and the call is not recorded/i)).toBeVisible();

  for (const width of [390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `homepage at ${width}px`).toBeLessThanOrEqual(width);
    for (const card of await page.locator("[data-project-card]").all()) {
      expect(await card.evaluate((element) => {
        const copy = element.querySelector(".feature-copy")?.getBoundingClientRect();
        const heading = element.querySelector("h3")?.getBoundingClientRect();
        return Boolean(copy && heading && heading.left >= copy.left - 1 && heading.right <= copy.right + 1);
      }), `project heading at ${width}px`).toBe(true);
    }

    await page.goto("/ask/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `Ask at ${width}px`).toBeLessThanOrEqual(width);
    expect(await page.locator(".ask-hero").evaluate((hero) => {
      const heroRect = hero.getBoundingClientRect();
      const headingRect = hero.querySelector("h1")?.getBoundingClientRect();
      return Boolean(headingRect && headingRect.left >= heroRect.left - 1 && headingRect.right <= heroRect.right + 1);
    }), `Ask heading at ${width}px`).toBe(true);
  }
});
