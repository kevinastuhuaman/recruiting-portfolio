import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/projects/trackly/",
  "/projects/paypal-ai-observability/",
  "/projects/berkeley-mobagel-ai-gtm/",
  "/projects/smb-fintech-bcp-credicorp/",
  "/resume/",
  "/about/",
  "/proof/",
  "/contact/",
  "/ask/",
  "/privacy/",
];

const compatibilityRoutes = ["/packet/", "/projects/agentic-dev-workflows/"];

for (const route of routes) {
  test(`${route} has a clean accessible document`, async ({ page, baseURL }) => {
    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new URL(route, baseURL?.replace("http://127.0.0.1:4321", "https://portfolio.kevinastuhuaman.com")).href);

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(() => JSON.parse(jsonLd ?? "")).not.toThrow();

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const blocking = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });
}

for (const route of compatibilityRoutes) {
  test(`${route} preserves the old URL without competing in search`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: /resume|how kevin worked/i }).first()).toBeVisible();
  });
}

test("mobile first viewport leads with AI PM, Berkeley, and PayPal evidence", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  const hero = page.locator(".recruiter-hero");

  await expect(hero.getByRole("heading", { level: 1, name: /Kevin Astuhuaman/i })).toBeVisible();
  await expect(hero.getByText(/agentic observability prototypes for PayPal Checkout/i)).toBeVisible();
  await expect(hero.getByText(/Berkeley Haas MBA '26/i)).toBeVisible();
  await expect(hero.getByRole("link", { name: "Resume", exact: true })).toBeVisible();
  await expect(page.locator(".mobile-nav summary")).toBeVisible();

  const positions = await hero.locator("#home-title, .identity-stack, .role-focus").evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, width: rect.width };
    }),
  );
  expect(positions.every((position) => position.top < 844 && position.bottom > 0 && position.width > 0)).toBe(true);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator(".proof-strip")).toBeVisible();
});

test("mobile anchor navigation closes the open menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator(".mobile-nav summary").click();
  await expect(page.locator(".mobile-nav")).toHaveAttribute("open", "");
  await page.locator('.mobile-nav a[href="/#work"]').click();
  await expect(page.locator(".mobile-nav")).not.toHaveAttribute("open", "");
});

test("resume lenses highlight without removing chronology", async ({ page }) => {
  await page.goto("/resume/");
  const rolesBefore = await page.locator(".resume-role").count();
  await page.getByLabel("Applied AI").check();
  await expect(page.locator("[data-resume-document]")).toHaveAttribute("data-lens", "ai");
  expect(await page.locator(".resume-role").count()).toBe(rolesBefore);
  await expect(page.getByRole("link", { name: /Download PDF/i })).toHaveAttribute("href", "/kevin-astuhuaman-resume.pdf");
});

test("the complete recruiting path works without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Kevin");
    await expect(page.getByRole("link", { name: /See PayPal work/i })).toBeVisible();
    await page.goto("/resume/");
    await expect(page.getByText("PayPal Checkout", { exact: true })).toBeVisible();
    await expect(page.getByText(/Banco de Credito BCP/i)).toBeVisible();
    await page.goto("/contact/");
    await expect(page.getByRole("link", { name: /LinkedIn/i }).first()).toBeVisible();
    await page.goto("/ask/");
    await expect(page.getByRole("heading", { name: "Five answers without the model." })).toBeVisible();
    await expect(page.getByText(/Interactive questions require JavaScript/i)).toBeVisible();
  } finally {
    await context.close();
  }
});

test("AI Investigation Workbench exposes plan, evidence, uncertainty, and human approval", async ({ page }) => {
  await page.goto("/projects/paypal-ai-observability/");
  const workbench = page.locator("[data-workbench]");
  const scanWorkbench = async () => {
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const blocking = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  };

  await workbench.getByRole("button", { name: "Slow authentication" }).click();
  await expect(workbench.getByText(/authentication screen becomes usable/i)).toBeVisible();
  await scanWorkbench();

  await workbench.getByRole("button", { name: "Build investigation plan" }).click();
  await expect(workbench.getByRole("heading", { name: /Five read-only steps/i })).toBeVisible();
  await scanWorkbench();

  await workbench.getByRole("button", { name: "Run approved steps" }).click();
  await expect(workbench.getByRole("heading", { name: /What happened and why the user struggled/i })).toBeVisible();
  await expect(workbench.getByText(/One source timed out/i)).toBeVisible();
  await scanWorkbench();

  await workbench.getByRole("button", { name: "Review hypotheses" }).click();
  await expect(workbench.getByText("Unknown", { exact: true })).toBeVisible();
  await expect(workbench.getByText(/service telemetry is incomplete/i)).toBeVisible();
  await scanWorkbench();

  await workbench.getByRole("button", { name: "Prepare escalation" }).click();
  await expect(workbench.getByRole("heading", { name: /A person owns the action/i })).toBeVisible();
  await scanWorkbench();
  await workbench.getByRole("button", { name: "Approve and route" }).click();
  await expect(workbench.getByRole("heading", { name: /accountable owner/i })).toBeVisible();
  await expect(workbench.getByRole("status")).toHaveText(/audit trail is complete/i);
  await scanWorkbench();
});

test("public machine files and resume PDF are fetchable", async ({ request }) => {
  for (const path of ["/robots.txt", "/sitemap.xml", "/llms.txt", "/profile.json", "/projects.json", "/proof.json", "/assistant-corpus.json", "/resume.md", "/2e43f7d61916408ea525527e4bc9b5c7.txt", "/.well-known/agent-skills/index.json", "/.well-known/agent-skills/site-navigation/SKILL.md", "/kevin-astuhuaman-resume.pdf"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

test("404 output is excluded from indexing and structured data", async ({ page }) => {
  await page.goto("/404.html");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});

test("local previews never send production analytics", async ({ page }) => {
  const events = [];
  await page.route("https://us.i.posthog.com/capture/", async (route) => {
    events.push(JSON.parse(route.request().postData() ?? "{}"));
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.route("https://closeai.mba/api/portfolio/ask", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ answer: "Public Trackly evidence.", citations: [], corpusVersion: "test" }),
    });
  });
  await page.goto("/ask/?utm_source=linkedin");
  await page.getByLabel("Question about Kevin's work").fill("private recruiter question text");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Answer complete.");
  expect(JSON.stringify(events)).not.toContain("private recruiter question text");
  expect(events).toEqual([]);
});

test("resume print control works under the site CSP", async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {
      window.sessionStorage.setItem("portfolio_print_called", "true");
    };
  });
  await page.goto("/resume/");
  await page.getByRole("button", { name: "Print" }).click();
  await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem("portfolio_print_called"))).toBe("true");
});

test("public assistant renders plain-text answers and allowlisted citations", async ({ page }) => {
  await page.route("https://closeai.mba/api/portfolio/ask", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        answer: "Kevin chose direct career pages as Trackly's source of earlier signal.",
        citations: [{ id: "trackly", title: "Trackly case study", url: "https://portfolio.kevinastuhuaman.com/projects/trackly/" }],
        corpusVersion: "portfolio-public-test",
      }),
    });
  });
  await page.goto("/ask/");
  await page.getByRole("button", { name: "Trackly decisions" }).click();
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Answer complete.");
  await expect(page.getByText(/direct career pages/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Trackly case study" })).toHaveAttribute("href", "https://portfolio.kevinastuhuaman.com/projects/trackly/");
});

test("public assistant failure preserves the static cited fallback", async ({ page }) => {
  await page.route("https://closeai.mba/api/portfolio/ask", async (route) => {
    await route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({ message: "The public assistant has reached its hourly limit." }),
    });
  });
  await page.goto("/ask/");
  await page.getByLabel("Question about Kevin's work").fill("What did Kevin build at PayPal?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("hourly limit");
  await expect(page.getByRole("heading", { name: "Five answers without the model." })).toBeVisible();
});
