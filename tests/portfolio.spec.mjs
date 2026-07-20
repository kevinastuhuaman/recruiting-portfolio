import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";

const routes = [
  "/",
  "/lab/",
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
    if (route === "/ask/") {
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    } else {
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new URL(route, baseURL?.replace("http://127.0.0.1:4321", "https://portfolio.kevinastuhuaman.com")).href);
    }

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(() => JSON.parse(jsonLd ?? "")).not.toThrow();

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);

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
    await expect(page.locator(".page-hero")).toHaveCSS("background-color", "rgb(247, 247, 242)");
    await expect(page.locator(".page-hero h1")).toHaveCSS("color", "rgb(11, 11, 11)");
  });
}

test("mobile first viewport leads with AI PM, Berkeley, and PayPal evidence", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  const hero = page.locator(".recruiter-hero");

  await expect(hero.getByRole("heading", { level: 1, name: "Seven years building products and enjoying every minute of it." })).toBeVisible();
  await expect(hero.getByText(/Ex-PayPal AI\/ML observability/i)).toBeVisible();
  await expect(hero.getByText(/Berkeley Haas MBA/i)).toBeVisible();
  await expect(hero.getByRole("link", { name: "View resume", exact: true })).toBeVisible();
  await expect(page.locator(".mobile-nav summary")).toBeVisible();
  await expect(hero.getByText("Seven years building products and enjoying every minute of it.")).toBeVisible();
  await expect(hero.getByRole("link", { name: /View selected work/i })).toBeVisible();
  await expect(hero.getByRole("link", { name: /Ask Kevin's AI/i })).toBeVisible();
  await expect(hero.locator("[data-home-mode]")).toHaveCount(0);

  const positions = await hero.locator("#home-title, .identity-stack, .role-focus").evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, width: rect.width };
    }),
  );
  expect(positions.every((position) => position.top < 844 && position.bottom > 0 && position.width > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator(".proof-strip")).toBeVisible();
});

test("homepage follows the recruiter-first narrative order", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const ids = ["credibility", "paypal", "trackly", "mobagel", "experience", "lab", "assistant", "channels", "contact"];
  const tops = await Promise.all(ids.map((id) => page.locator(`#${id}`).evaluate((element) => element.getBoundingClientRect().top + window.scrollY)));
  expect(tops).toEqual([...tops].sort((a, b) => a - b));
  await expect(page.locator("#credibility")).toHaveCSS("border-bottom-width", "1px");
  await expect(page.locator("#lab").getByRole("link", { name: /Explore the AI Product Lab/i })).toHaveAttribute("href", "/lab/");
});

test("homepage project system keeps type, media, and Berkeley steps readable", async ({ page }) => {
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/", { waitUntil: "networkidle" });

    for (const card of await page.locator("[data-project-card]").all()) {
      const contained = await card.evaluate((element) => {
        const copyRect = element.querySelector(".feature-copy")?.getBoundingClientRect();
        const headingRect = element.querySelector("h3")?.getBoundingClientRect();
        return Boolean(
          headingRect
          && copyRect
          && headingRect.left >= copyRect.left - 1
          && headingRect.right <= copyRect.right + 1
          && headingRect.top >= copyRect.top - 1
          && headingRect.bottom <= copyRect.bottom + 1
          && headingRect.width > 0,
        );
      });
      expect(contained, `project heading contained at ${width}px`).toBe(true);
    }

    const paypalImage = page.locator("#paypal [data-project-media] img");
    await expect(paypalImage).toBeVisible();
    const aspectDelta = await paypalImage.evaluate((image) => {
      const rendered = image.getBoundingClientRect();
      const renderedRatio = rendered.width / rendered.height;
      const intrinsicRatio = image.naturalWidth / image.naturalHeight;
      return Math.abs(renderedRatio - intrinsicRatio);
    });
    expect(aspectDelta, `PayPal image ratio at ${width}px`).toBeLessThan(0.03);

    const tracklyImage = page.locator("#trackly .trackly-proof img");
    await expect(tracklyImage).toBeVisible();
    await expect(tracklyImage).toHaveCSS("object-fit", "contain");
    const tracklyAspectDelta = await tracklyImage.evaluate((image) => {
      const rendered = image.getBoundingClientRect();
      return Math.abs((rendered.width / rendered.height) - (image.naturalWidth / image.naturalHeight));
    });
    expect(tracklyAspectDelta, `Trackly image ratio at ${width}px`).toBeLessThan(0.03);
  }

  await expect(page.locator("[data-berkeley-step]").first()).toHaveCSS("writing-mode", "horizontal-tb");
});

test("mobile case-study cards keep one deliberate content gutter", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/projects/paypal-ai-observability/", { waitUntil: "networkidle" });
  const workbench = page.locator("[data-workbench]");
  for (let step = 0; step < 4; step += 1) {
    await workbench.locator("[data-workbench-action]").click();
  }
  await expect(workbench).toHaveAttribute("data-stage", "review");

  const reviewGutters = await workbench.locator(".review-card > div").evaluateAll((rows) =>
    rows.map((row) => {
      const rowRect = row.getBoundingClientRect();
      const content = row.querySelector("span, strong, p");
      const contentRect = content?.getBoundingClientRect();
      return contentRect ? Math.round(contentRect.left - rowRect.left) : null;
    }),
  );
  expect(reviewGutters).toEqual([18, 18, 18]);

  await page.goto("/projects/berkeley-mobagel-ai-gtm/", { waitUntil: "networkidle" });
  const workstreamGutters = await page.locator(".workstreams section").evaluateAll((sections) =>
    sections.map((section) => {
      const sectionRect = section.getBoundingClientRect();
      const eyebrowRect = section.querySelector(".eyebrow")?.getBoundingClientRect();
      return eyebrowRect ? Math.round(eyebrowRect.left - sectionRect.left) : null;
    }),
  );
  expect(workstreamGutters).toEqual([22, 22, 22, 22]);
});

test("homepage assistant preview reuses the moving voice orb without requesting audio", async ({ page }) => {
  await page.addInitScript(() => {
    window.__homepageMicRequests = 0;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: async () => { window.__homepageMicRequests += 1; throw new Error("unexpected_microphone_request"); } },
    });
  });
  await page.goto("/", { waitUntil: "networkidle" });

  const orb = page.locator(".homepage-portfolio-orb-canvas");
  await page.locator("#assistant").scrollIntoViewIfNeeded();
  await expect(orb).toBeVisible();
  await expect(orb).toHaveAttribute("data-motion", "animated");
  await expect(orb).toHaveAttribute("data-rendered", "true");
  await expect(page.locator(".homepage-portfolio-orb")).toHaveClass(/is-ready/);
  const dimensions = await orb.evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(dimensions.width).toBeGreaterThanOrEqual(250);
  expect(dimensions.width).toBeLessThanOrEqual(340);
  expect(Math.abs(dimensions.width - dimensions.height)).toBeLessThan(1);

  const firstFrame = await orb.screenshot();
  await page.waitForTimeout(180);
  const secondFrame = await orb.screenshot();
  expect(secondFrame.equals(firstFrame)).toBe(false);
  expect(await page.evaluate(() => window.__homepageMicRequests)).toBe(0);
});

test("homepage orb renders one frame when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });

  const orb = page.locator(".homepage-portfolio-orb-canvas");
  await page.locator("#assistant").scrollIntoViewIfNeeded();
  await expect(orb).toBeVisible();
  await expect(orb).toHaveAttribute("data-motion", "static");

  const firstFrame = await orb.screenshot();
  await page.waitForTimeout(180);
  const secondFrame = await orb.screenshot();
  expect(secondFrame.equals(firstFrame)).toBe(true);
});

test("homepage orb keeps its static artwork when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/", { waitUntil: "networkidle" });

  await page.locator("#assistant").scrollIntoViewIfNeeded();
  const fallback = page.locator(".homepage-portfolio-orb-fallback");
  await expect(fallback).toBeVisible();
  await expect(fallback).toHaveCSS("border-radius", "50%");
  await expect(fallback).not.toHaveCSS("background-image", /url\(/);
  await expect(page.locator(".homepage-portfolio-orb")).not.toHaveClass(/is-ready/);
});

test("homepage exposes one contact invitation with copy-email and resume actions", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Building an AI product where judgment matters?" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Copy email" })).toHaveCount(1);
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  await expect(page.locator("#contact")).not.toContainText("kevin.astuhuaman@berkeley.edu");
  await expect(page.locator("#contact").getByRole("link", { name: "View resume" })).toHaveAttribute("href", "/resume/");

  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value) => window.sessionStorage.setItem("copied-email", value) },
    });
  });
  await page.getByRole("button", { name: "Copy email" }).click();
  await expect(page.locator(".footer-copy-status")).toHaveText("Email copied");
  await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem("copied-email"))).toBe("kevin.astuhuaman@berkeley.edu");

  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new Error("clipboard_denied"); } },
    });
    window.prompt = () => null;
  });
  await page.getByRole("button", { name: "Email copied" }).click();
  await expect(page.locator(".footer-copy-status")).toHaveText("Copy email");
});

test("homepage offers seven curated channels without overwhelming the contact path", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const channels = page.locator("#channels");

  await expect(channels.getByRole("heading", { name: "Follow the thread." })).toBeVisible();
  await expect(channels).toContainText("What I ship and how I think about products.");
  await expect(channels).toContainText("Writing, unfinished thoughts, and life beyond work.");
  await expect(channels).toContainText("Conversations with builders and my personal finance YouTube channel.");

  const expectedLinks = [
    ["GitHub", "https://github.com/kevinastuhuaman"],
    ["LinkedIn", "https://www.linkedin.com/in/kevinastuhuaman"],
    ["Newsletter", "https://kevinastuhuaman.com/"],
    ["X", "https://x.com/kevinastuhuaman"],
    ["Personal story", "https://ai.kevinastuhuaman.com"],
    ["Podcast", "https://open.spotify.com/show/6OvPmvIDQh70CpLyU2DqkO?si=951d916ec5ad4ed9"],
    ["YouTube", "https://www.youtube.com/@kevinastuhuaman"],
  ];
  for (const [name, href] of expectedLinks) {
    const link = channels.getByRole("link", { name });
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }

  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  const person = schema["@graph"].find((entry) => entry["@id"]?.endsWith("/#kevin"));
  expect(person.sameAs).toHaveLength(expectedLinks.length);
  expect(person.sameAs).toEqual(expect.arrayContaining(expectedLinks.map(([, href]) => href)));

  await expect(channels.locator('[aria-label="Kevin\'s podcast and video channel"] a')).toHaveText(["Podcast", "YouTube"]);

  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await channels.evaluate((section) => {
      const cards = [...section.querySelectorAll(".channel")];
      const rect = section.getBoundingClientRect();
      return {
        columns: getComputedStyle(section.querySelector(".channels-grid")).gridTemplateColumns.split(" ").length,
        contained: cards.every((card) => {
          const cardRect = card.getBoundingClientRect();
          return cardRect.left >= rect.left - 1 && cardRect.right <= rect.right + 1;
        }),
      };
    });
    expect(layout.contained).toBe(true);
    expect(layout.columns).toBe(width <= 768 ? 1 : 3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test("email copy failure opens the manual-copy fallback without navigating", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new Error("clipboard_denied"); } },
    });
    window.prompt = (message, value) => {
      window.sessionStorage.setItem("copy-prompt", JSON.stringify({ message, value }));
      return null;
    };
  });

  const url = page.url();
  await page.getByRole("button", { name: "Copy email" }).click();
  await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem("copy-prompt"))).toBe(
    JSON.stringify({ message: "Copy Kevin's email", value: "kevin.astuhuaman@berkeley.edu" }),
  );
  expect(page.url()).toBe(url);
  await expect(page.locator(".footer-copy-status")).toHaveText("Copy email");
});

test("required responsive widths avoid horizontal overflow across the portfolio", async ({ page }) => {
  test.setTimeout(120_000);
  const responsiveRoutes = [
    "/", "/ask/", "/resume/", "/contact/", "/about/", "/lab/", "/proof/",
    "/projects/trackly/", "/projects/paypal-ai-observability/",
    "/projects/berkeley-mobagel-ai-gtm/", "/projects/smb-fintech-bcp-credicorp/",
  ];
  for (const width of [360, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 900 : 1000 });
    for (const path of responsiveRoutes) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${path} at ${width}px`).toBeLessThanOrEqual(width);
    }
  }
});

test("mobile resume stays readable instead of shrinking into a desktop sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/resume/", { waitUntil: "networkidle" });

  const heroSize = await page.locator(".resume-hero h1").evaluate((heading) => Number.parseFloat(getComputedStyle(heading).fontSize));
  const bodySize = await page.locator(".resume-role li").first().evaluate((item) => Number.parseFloat(getComputedStyle(item).fontSize));
  expect(heroSize).toBeLessThanOrEqual(66);
  expect(bodySize).toBeGreaterThanOrEqual(14);
  await page.locator(".resume-role").first().scrollIntoViewIfNeeded();
  await expect(page.locator(".resume-role").first()).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("About keeps Kevin's complete portrait comfortably framed on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about/", { waitUntil: "networkidle" });

  const portrait = page.locator('.about-layout figure img[alt="Kevin Astuhuaman"]');
  await portrait.scrollIntoViewIfNeeded();
  await expect(portrait).toBeVisible();
  await expect(portrait).toHaveCSS("object-fit", "contain");
  const dimensions = await portrait.evaluate((image) => {
    const rect = image.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      intrinsicRatio: image.naturalWidth / image.naturalHeight,
      renderedRatio: rect.width / rect.height,
    };
  });
  expect(dimensions.width).toBeLessThanOrEqual(260);
  expect(dimensions.height).toBeLessThan(280);
  expect(Math.abs(dimensions.renderedRatio - dimensions.intrinsicRatio)).toBeLessThan(0.02);
});

test("Trackly's corrected 2026 start date is consistent across public pages", async ({ page }) => {
  await page.goto("/");
  const tracklyExperience = page.locator("#experience details").filter({ hasText: "Trackly" });
  await expect(tracklyExperience).toContainText("2026-present");
  await expect(tracklyExperience).not.toContainText("2025-present");

  await page.goto("/projects/trackly/");
  await expect(page.locator(".trackly-hero .eyebrow")).toContainText("2026-present");
});

test("resume contact action copies the email instead of opening a composer", async ({ page }) => {
  await page.goto("/resume/");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value) => window.sessionStorage.setItem("resume-copied-email", value) },
    });
  });
  const copyButton = page.locator(".resume-actions [data-resume-copy-email]");
  await expect(copyButton).toHaveAccessibleName("Copy email");
  await expect(copyButton).toHaveClass(/ph-no-capture/);
  await copyButton.click();
  await expect(copyButton).toContainText("Email copied");
  await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem("resume-copied-email"))).toBe("kevin.astuhuaman@berkeley.edu");
  await expect(page.locator('.resume-actions a[href^="mailto:"]')).toHaveCount(0);
});

test("lab previews show complete interfaces without cropped or empty media", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/lab/", { waitUntil: "networkidle" });

  const previews = page.locator(".lab-visual img");
  await expect(previews).toHaveCount(7);
  await expect(previews.first()).toHaveAttribute("loading", "eager");
  await expect(previews.first()).toHaveAttribute("fetchpriority", "high");
  for (const preview of (await previews.all()).slice(1)) {
    await expect(preview).toHaveAttribute("loading", "lazy");
  }

  const placeholders = page.locator(".lab-placeholder");
  await expect(placeholders).toHaveCount(7);
  for (const placeholder of await placeholders.all()) {
    await expect(placeholder.locator("strong")).not.toHaveText("");
    await expect(placeholder.locator(".lab-placeholder-title")).not.toHaveText("");
  }

  for (const preview of await previews.all()) {
    await preview.scrollIntoViewIfNeeded();
    await expect(preview).toHaveCSS("object-fit", "contain");
    await expect.poll(() => preview.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  }
});

test("lab previews preserve a purposeful fallback when media fails", async ({ page }) => {
  await page.route("**/assets/builder-stack-preview.png", (route) => route.abort());
  await page.goto("/lab/", { waitUntil: "networkidle" });

  const card = page.locator("#builder-stack");
  await expect(card.locator(".lab-visual")).toHaveClass(/has-error/);
  await expect(card.locator(".lab-placeholder-title")).toHaveText("AI Product Builder Stack");
  await expect(card.locator(".lab-placeholder")).toBeVisible();
});

test("Ask renders a useful first impression before client hydration", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(new URL("/ask/", baseURL).href);

  await expect(page.getByRole("heading", { name: "Ask Kevin's AI anything." }).first()).toBeVisible();
  await expect(page.getByText("Good starting points")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start here." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await context.close();
});

test("contact uses one compact copy-email interaction", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact/", { waitUntil: "networkidle" });

  await expect(page.getByRole("button", { name: /Copy email/i })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /Copy email/i })).toHaveClass(/ph-no-capture/);
  await expect(page.getByRole("button", { name: /Copy email/i })).toHaveAttribute("data-ph-no-autocapture", "");
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("kevin.astuhuaman@berkeley.edu");
  await expect(page.locator("footer .footer-primary")).toHaveCount(0);
});

test("Trackly leads with motion and immediate cross-platform proof", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/projects/trackly/", { waitUntil: "networkidle" });

  await expect(page.locator("[data-trackly-film]")).toHaveAttribute("poster", "/assets/trackly-demo-poster.webp");
  await expect(page.locator(".surface-rail figure")).toHaveCount(5);
  await expect(page.locator(".surface-rail figcaption strong")).toHaveText(["Web", "iOS", "macOS", "CLI + MCP", "Chat + Voice"]);
  await page.locator(".surface-rail").scrollIntoViewIfNeeded();
  await expect(page.locator("[data-surface-current]")).toHaveText("01");
  await expect(page.locator("[data-surface-previous]")).toBeDisabled();
  await expect(page.locator("[data-surface-next]")).toBeEnabled();
  const surfaceTargets = page.locator("[data-surface-target]");
  await expect(surfaceTargets).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) {
    await surfaceTargets.nth(index).click();
    await expect(page.locator("[data-surface-current]")).toHaveText(String(index + 1).padStart(2, "0"));
    for (const image of await page.locator("[data-surface-card]").nth(index).locator("img").all()) {
      await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
    }
  }
  await expect(page.locator("[data-surface-next]")).toBeDisabled();
  await page.locator("[data-surface-previous]").click();
  await expect(page.locator("[data-surface-current]")).toHaveText("04");
  const mediaHeights = await page.locator(".surface-media").evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().height)),
  );
  expect(new Set(mediaHeights).size).toBe(1);
  await expect(page.locator(".case-depth")).not.toHaveAttribute("open", "");
  await expect(page.locator(".case-depth > summary")).toContainText("Explore the full product decision record");
});

test("Trackly deep links open progressively disclosed evidence", async ({ page }) => {
  await page.goto("/projects/trackly/#how-i-worked");
  await expect(page.locator(".case-depth")).toHaveAttribute("open", "");
  await expect(page.locator("#how-i-worked")).toBeVisible();
});

test("200 percent zoom equivalent and reduced motion preserve the core path", async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 500 });
  await page.goto("/");
  await expect(page.getByText("AI Product Manager", { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(720);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ask/");
  await page.getByRole("tab", { name: /Voice/ }).click();
  await expect(page.locator("[data-motion=static]")).toBeVisible();
});

test("AI Product Lab contains the complete seven-artifact collection", async ({ page }) => {
  await page.goto("/lab/", { waitUntil: "networkidle" });
  for (const name of [
    "AI Investigation Workbench",
    "AI Product Builder Stack",
    "Agent Workflow Canvas",
    "Evals Control Room",
    "Human Control Plane",
    "AI Product Motion Studies",
    "Enterprise AI Interface Kit",
  ]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByText(/synthetic data/i).first()).toBeVisible();
});

test("mobile anchor navigation closes the open menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".mobile-nav summary")).toHaveAttribute("aria-label", "Open navigation");
  await page.locator(".mobile-nav summary").click();
  await expect(page.locator(".mobile-nav")).toHaveAttribute("open", "");
  await expect(page.locator(".mobile-nav summary")).toHaveAttribute("aria-label", "Close navigation");
  await page.locator('.mobile-nav a[href="/#work"]').click();
  await expect(page.locator(".mobile-nav")).not.toHaveAttribute("open", "");
  await expect(page.locator(".mobile-nav summary")).toHaveAttribute("aria-label", "Open navigation");
  await expect(page.locator("#work")).toBeVisible();
});

test("resume lenses highlight without removing chronology", async ({ page }) => {
  await page.goto("/resume/");
  const rolesBefore = await page.locator(".resume-role").count();
  await page.getByLabel("Applied AI").check();
  await expect(page.locator("[data-resume-document]")).toHaveAttribute("data-lens", "ai");
  await page.getByLabel("Zero-to-One / Growth").check();
  await expect(page.locator("[data-resume-document]")).toHaveAttribute("data-lens", "growth");
  await expect(page.locator(".lens-growth").first()).toHaveCSS("color", "rgb(17, 17, 17)");
  expect(await page.locator(".resume-role").count()).toBe(rolesBefore);
  await expect(page.getByRole("link", { name: /Download PDF/i })).toHaveAttribute("href", "/kevin-astuhuaman-resume.pdf");
});

test("the complete recruiting path works without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Seven years building products");
    await expect(page.getByRole("link", { name: /Read the PayPal case/i })).toBeVisible();
    await page.goto("/resume/");
    await expect(page.getByText("PayPal Checkout", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Banco de Credito BCP/i })).toBeVisible();
    await page.goto("/contact/");
    await expect(page.getByRole("link", { name: /LinkedIn/i }).first()).toBeVisible();
    await page.goto("/ask/");
    await expect(page.getByRole("heading", { name: "Start here." })).toBeVisible();
    await expect(page.getByText(/Interactive questions require JavaScript/i)).toBeVisible();
    await expect(page.getByText(/common questions, answered directly from Kevin's portfolio/i)).toBeVisible();
    await expect(page.locator(".assistant-shell")).toBeVisible();
    await expect(page.getByRole("heading", { name: "What are you curious about?" })).toBeVisible();
  } finally {
    await context.close();
  }
});

test("AI Investigation Workbench exposes plan, evidence, uncertainty, and human approval", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/projects/paypal-ai-observability/");
  const workbench = page.locator("[data-workbench]");
  const scanWorkbench = async () => {
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
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

test("Trackly explains the browser-agent harness and its human approval boundary", async ({ page }) => {
  await page.goto("/projects/trackly/");
  const deepEvidence = page.locator("details.case-depth");
  await expect(deepEvidence).not.toHaveAttribute("open", "");
  await deepEvidence.locator("summary").click();
  await expect(deepEvidence).toHaveAttribute("open", "");
  const harness = page.locator(".browser-harness-section");
  await expect(harness.getByRole("heading", { name: /where autonomy ends/i })).toBeVisible();
  await expect(harness.getByText(/Trackly supplies the selected roles and user context/i)).toBeVisible();
  await expect(harness.getByText(/pauses before submission/i)).toBeVisible();
  await expect(harness.getByText(/edit, navigation, reload, or reconnect invalidates/i)).toBeVisible();
  await expect(harness.getByText("Financial operations", { exact: true })).toBeVisible();
  await expect(harness.getByText("Sales and CRM", { exact: true })).toBeVisible();
  await expect(harness.getByText("Legacy enterprise workflows", { exact: true })).toBeVisible();
  await expect(harness.getByRole("link", { name: /GPT-5.6 announcement/i })).toHaveAttribute("href", "https://openai.com/index/gpt-5-6/");
  await expect(harness.getByRole("link", { name: /interactive Human Control Plane/i })).toHaveAttribute(
    "href",
    "https://kevinastuhuaman.github.io/human-in-the-loop-patterns/",
  );
});

test("Trackly inventory and product decisions stay current and visually structured", async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/projects/trackly/");

  const metrics = page.locator(".metric-row .metric");
  await expect(metrics).toHaveCount(3);
  await expect(metrics.nth(0)).toContainText("3,884");
  await expect(metrics.nth(2)).toContainText("173,864");
  await expect(page.locator(".metric-row")).not.toContainText("July 14");
  await expect(page.locator("main")).not.toContainText("Inventory source checked");
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(schema["@graph"].find((entry) => entry["@type"] === "Article")?.dateModified).toBe("2026-07-19");

  const steps = page.locator(".system-artifact li");
  await expect(steps).toHaveCount(5);
  const boxes = await steps.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, height: rect.height };
  }));
  expect(Math.max(...boxes.map((box) => box.top)) - Math.min(...boxes.map((box) => box.top))).toBeLessThan(1);
  expect(Math.max(...boxes.map((box) => box.bottom)) - Math.min(...boxes.map((box) => box.bottom))).toBeLessThan(1);

  const decisions = page.locator(".decision-anatomy");
  await expect(decisions).toHaveCount(3);
  for (const decision of await decisions.all()) {
    await expect(decision.getByText("Choice", { exact: true })).toHaveCount(1);
    await expect(decision.getByText("Rejected", { exact: true })).toHaveCount(1);
    await expect(decision.getByText("Why", { exact: true })).toHaveCount(1);
  }

  const proof = await (await request.get("/proof.json")).json();
  expect(proof.claims.find((claim) => claim.id === "trackly-inventory")?.statement).toContain("3,884 active company career sites");
});

test("builder stack proof is visible and machine-readable", async ({ page, request }) => {
  await page.goto("/lab/");
  const section = page.locator("#builder-stack");
  await expect(section.getByRole("heading", { name: "AI Product Builder Stack" })).toBeVisible();
  await expect(section.getByRole("link", { name: /Open study/i })).toHaveAttribute(
    "href",
    "https://kevinastuhuaman.github.io/ai-product-builder-stack/",
  );

  const response = await request.get("/assistant-corpus.json");
  expect(response.ok()).toBe(true);
  const corpus = await response.json();
  expect(corpus.corpusVersion).toBe("2026-07-19.1");
  expect(corpus.sourceCommit).toMatch(/^[a-f0-9]{40}$/);
  expect(corpus.checksum).toBe(createHash("sha256").update(JSON.stringify(corpus.entries)).digest("hex"));
  const builderStackEntry = corpus.entries.find((entry) => entry.id === "builder-stack");
  expect(builderStackEntry?.content).toMatch(/65 verified tools/i);
  expect(builderStackEntry?.content).toMatch(/Langfuse, PostHog, Umami/i);
  expect(builderStackEntry?.keywords).toEqual(expect.arrayContaining(["cloud tooling", "ci/cd", "analytics"]));
});

test("enterprise AI interface proof is visible and machine-readable", async ({ page, request }) => {
  await page.goto("/lab/");
  const section = page.locator("#enterprise-interface-kit");
  await expect(section.getByRole("heading", { name: "Enterprise AI Interface Kit" })).toBeVisible();
  await expect(section.getByRole("link", { name: /Open study/i })).toHaveAttribute(
    "href",
    "https://kevinastuhuaman.github.io/enterprise-ai-interface-kit/",
  );
  await expect(section.getByRole("link", { name: /Source/i })).toHaveAttribute(
    "href",
    "https://github.com/kevinastuhuaman/enterprise-ai-interface-kit",
  );

  const [corpusResponse, proofResponse] = await Promise.all([
    request.get("/assistant-corpus.json"),
    request.get("/proof.json"),
  ]);
  const corpus = await corpusResponse.json();
  const proof = await proofResponse.json();
  const entry = corpus.entries.find((item) => item.id === "enterprise-interface-kit");
  const claim = proof.claims.find((item) => item.id === "enterprise-interface-kit-public");
  expect(entry?.content).toMatch(/seven recurring enterprise AI questions/i);
  expect(entry?.keywords).toEqual(expect.arrayContaining(["calibrated confidence", "observable trace", "empty state"]));
  expect(claim?.context).toMatch(/fictional data/i);

  await page.goto("/lab/#enterprise-interface-kit");
  await expect.poll(() => section.evaluate((element) => element.getBoundingClientRect().top)).toBeLessThanOrEqual(128);
  const anchoredTop = await section.evaluate((element) => element.getBoundingClientRect().top);
  expect(anchoredTop).toBeGreaterThanOrEqual(64);
});

test("human control proof is visible and machine-readable", async ({ page, request }) => {
  await page.goto("/lab/");
  const section = page.locator("#human-control-plane");
  await expect(section.getByRole("heading", { name: "Human Control Plane" })).toBeVisible();
  await expect(section.getByRole("link", { name: /Open study/i })).toHaveAttribute(
    "href",
    "https://kevinastuhuaman.github.io/human-in-the-loop-patterns/",
  );
  await expect(section.getByRole("link", { name: /Source/i })).toHaveAttribute(
    "href",
    "https://github.com/kevinastuhuaman/human-in-the-loop-patterns",
  );

  const [corpusResponse, proofResponse] = await Promise.all([
    request.get("/assistant-corpus.json"),
    request.get("/proof.json"),
  ]);
  const corpus = await corpusResponse.json();
  const proof = await proofResponse.json();
  const entry = corpus.entries.find((item) => item.id === "human-control-plane");
  const claim = proof.claims.find((item) => item.id === "human-control-plane-public");
  expect(entry?.content).toMatch(/approval bound to committed state/i);
  expect(entry?.keywords).toEqual(expect.arrayContaining(["human-in-the-loop", "reversibility", "agent safety"]));
  expect(claim?.context).toMatch(/not a production authorization framework/i);
});

test("motion design proof is visible and machine-readable", async ({ page, request }) => {
  await page.goto("/lab/");
  const section = page.locator("#motion-studies");
  await expect(section.getByRole("heading", { name: "AI Product Motion Studies" })).toBeVisible();
  await expect(section.getByRole("link", { name: /Open study/i })).toHaveAttribute(
    "href",
    "https://kevinastuhuaman.github.io/ai-product-motion-studies/",
  );
  await expect(section.getByRole("link", { name: /Source/i })).toHaveAttribute(
    "href",
    "https://github.com/kevinastuhuaman/ai-product-motion-studies",
  );

  const [corpusResponse, proofResponse] = await Promise.all([
    request.get("/assistant-corpus.json"),
    request.get("/proof.json"),
  ]);
  const corpus = await corpusResponse.json();
  const proof = await proofResponse.json();
  const entry = corpus.entries.find((item) => item.id === "motion-studies");
  const claim = proof.claims.find((item) => item.id === "motion-studies-public");
  expect(entry?.content).toMatch(/13 manually inspectable states/i);
  expect(entry?.keywords).toEqual(expect.arrayContaining(["design taste", "reduced motion", "enterprise ai"]));
  expect(claim?.context).toMatch(/synthetic data/i);
});

test("public machine files and resume PDF are fetchable", async ({ request }) => {
  for (const path of ["/robots.txt", "/sitemap.xml", "/llms.txt", "/profile.json", "/projects.json", "/proof.json", "/assistant-corpus.json", "/resume.md", "/2e43f7d61916408ea525527e4bc9b5c7.txt", "/google03e4f31940241210.html", "/google5e5c6d4f15731b83.html", "/.well-known/agent-skills/index.json", "/.well-known/agent-skills/site-navigation/SKILL.md", "/kevin-astuhuaman-resume.pdf", "/assets/enterprise-ai-interface-kit-preview.png", "/assets/human-control-plane-preview.png", "/assets/motion-studies-preview.png"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

test("supporting navigation links the About page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("footer").getByRole("link", { name: "About", exact: true })).toHaveAttribute("href", "/about/");
});

test("machine entry points link the Enterprise AI Interface Kit", async ({ request }) => {
  const [llmsResponse, profileResponse, skillResponse] = await Promise.all([
    request.get("/llms.txt"),
    request.get("/profile.json"),
    request.get("/.well-known/agent-skills/site-navigation/SKILL.md"),
  ]);

  const llms = await llmsResponse.text();
  const profile = await profileResponse.json();
  const skill = await skillResponse.text();
  expect(llms).toContain("https://kevinastuhuaman.github.io/enterprise-ai-interface-kit/");
  expect(llms).toContain("enterprise-ai-interface-kit/patterns.json");
  expect(profile.links.enterpriseAiInterfaceKit).toBe("https://kevinastuhuaman.github.io/enterprise-ai-interface-kit/");
  expect(profile.links.enterpriseAiInterfaceKitSource).toBe("https://github.com/kevinastuhuaman/enterprise-ai-interface-kit");
  expect(skill).toContain("Enterprise AI Interface Kit LLM context");
});

test("machine entry points link the AI Product Builder Stack", async ({ request }) => {
  const [llmsResponse, profileResponse, skillResponse] = await Promise.all([
    request.get("/llms.txt"),
    request.get("/profile.json"),
    request.get("/.well-known/agent-skills/site-navigation/SKILL.md"),
  ]);

  const llms = await llmsResponse.text();
  const profile = await profileResponse.json();
  const skill = await skillResponse.text();
  expect(llms).toContain("https://kevinastuhuaman.github.io/ai-product-builder-stack/");
  expect(llms).toContain("ai-product-builder-stack/stack.json");
  expect(profile.links.builderStack).toBe("https://kevinastuhuaman.github.io/ai-product-builder-stack/");
  expect(profile.links.builderStackSource).toBe("https://github.com/kevinastuhuaman/ai-product-builder-stack");
  expect(skill).toContain("AI Product Builder Stack");
  expect(skill).toContain("ai-product-builder-stack/llms.txt");
});

test("machine entry points link the Human Control Plane", async ({ request }) => {
  const [llmsResponse, profileResponse, skillResponse] = await Promise.all([
    request.get("/llms.txt"),
    request.get("/profile.json"),
    request.get("/.well-known/agent-skills/site-navigation/SKILL.md"),
  ]);

  const llms = await llmsResponse.text();
  const profile = await profileResponse.json();
  const skill = await skillResponse.text();
  expect(llms).toContain("https://kevinastuhuaman.github.io/human-in-the-loop-patterns/");
  expect(llms).toContain("human-in-the-loop-patterns/project.json");
  expect(profile.links.humanControlPlane).toBe("https://kevinastuhuaman.github.io/human-in-the-loop-patterns/");
  expect(profile.links.humanControlPlaneSource).toBe("https://github.com/kevinastuhuaman/human-in-the-loop-patterns");
  expect(skill).toContain("Human Control Plane LLM context");
});

test("machine entry points link AI Product Motion Studies", async ({ request }) => {
  const [llmsResponse, profileResponse, skillResponse] = await Promise.all([
    request.get("/llms.txt"),
    request.get("/profile.json"),
    request.get("/.well-known/agent-skills/site-navigation/SKILL.md"),
  ]);

  const llms = await llmsResponse.text();
  const profile = await profileResponse.json();
  const skill = await skillResponse.text();
  expect(llms).toContain("https://kevinastuhuaman.github.io/ai-product-motion-studies/");
  expect(llms).toContain("ai-product-motion-studies/motion-spec.json");
  expect(profile.links.motionStudies).toBe("https://kevinastuhuaman.github.io/ai-product-motion-studies/");
  expect(profile.links.motionStudiesSource).toBe("https://github.com/kevinastuhuaman/ai-product-motion-studies");
  expect(skill).toContain("Motion Studies LLM context");
});

test("machine entry points include every curated channel", async ({ request }) => {
  const [llmsResponse, profileResponse] = await Promise.all([
    request.get("/llms-full.txt"),
    request.get("/profile.json"),
  ]);

  const llms = await llmsResponse.text();
  const profile = await profileResponse.json();
  const expected = {
    x: "https://x.com/kevinastuhuaman",
    youtube: "https://www.youtube.com/@kevinastuhuaman",
    podcast: "https://open.spotify.com/show/6OvPmvIDQh70CpLyU2DqkO?si=951d916ec5ad4ed9",
    personalStory: "https://ai.kevinastuhuaman.com",
  };

  for (const [name, url] of Object.entries(expected)) {
    expect(profile.links[name]).toBe(url);
    expect(llms).toContain(url);
  }
});

test("404 output is excluded from indexing and structured data", async ({ page }) => {
  await page.goto("/404.html");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  await expect(page.locator(".page-hero")).toHaveCSS("background-color", "rgb(247, 247, 242)");
  await expect(page.locator(".page-hero h1")).toHaveCSS("color", "rgb(11, 11, 11)");
});

test("analytics payload excludes private content", async ({ page }) => {
  const events = [];
  // PostHog intentionally ignores automated browsers as bot traffic. This
  // exercises the production visitor path with normal Chrome browser signals.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      get: () => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/149.0.0.0 Safari/537.36",
    });
    Object.defineProperty(navigator, "webdriver", {
      configurable: true,
      get: () => false,
    });
    window.requestIdleCallback = (callback) => window.setTimeout(() => callback({
      didTimeout: false,
      timeRemaining: () => 0,
    }), 750);
  });
  await page.route("https://us-assets.i.posthog.com/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.route("https://us.i.posthog.com/**", async (route) => {
    if (route.request().url().includes("/e/")) {
      events.push(JSON.parse(route.request().postData() ?? "{}"));
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: 'event: meta\ndata: {}\n\nevent: error\ndata: {"reset":true,"recoverable":true}\n\nevent: delta\ndata: {"text":"Public Trackly evidence."}\n\nevent: citations\ndata: {"citations":[]}\n\nevent: done\ndata: {"fallback":true}\n\n',
    });
  });
  await page.goto("/ask/?utm_source=linkedin");
  await page.locator('a[href="/resume/"]').first().evaluate((link) => {
    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    link.click();
  });
  await page.getByLabel("Question").fill("private recruiter question text");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Ready");
  expect(JSON.stringify(events)).not.toContain("private recruiter question text");
  if (process.env.PUBLIC_POSTHOG_KEY?.startsWith("phc_")) {
    await expect.poll(() => events.length, { message: "analytics initializes after browser idle" }).toBeGreaterThan(0);
    const anonymousIds = new Set(events.map((entry) => entry?.properties?.distinct_id));
    expect(anonymousIds.size).toBe(1);
    expect([...anonymousIds].every((id) => typeof id === "string" && id.length > 0)).toBe(true);
    expect(events.every((entry) => entry?.properties?.$process_person_profile === false)).toBe(true);
    expect(events.every((entry) => !String(entry?.properties?.$current_url ?? "").includes("utm_source"))).toBe(true);
    expect(JSON.stringify(events)).not.toContain("utm_source");
    expect(JSON.stringify(events)).not.toContain("$initial_utm_");
    expect(events.some((entry) => (
      entry.event === "portfolio_contact_action" && entry.properties?.action === "resume"
    ))).toBe(true);
    expect(events.some((entry) => (
      entry.event === "portfolio_chat_completed"
      && entry.properties?.outcome === "streamed_fallback"
      && entry.properties?.recovered === true
    ))).toBe(true);
    await page.goto("/");
    const podcastLink = page.locator('[data-portfolio-destination="podcast"]');
    await expect(podcastLink).toHaveAttribute("data-ph-no-autocapture", "");
    await expect(podcastLink).not.toHaveAttribute("data-analytics-capture", "true");
    await podcastLink.evaluate((link) => {
      link.addEventListener("click", (event) => event.preventDefault(), { once: true });
      link.click();
    });
    await expect.poll(() => events.some((entry) => (
      entry.event === "portfolio_channel_opened"
      && entry.properties?.channel === "watch-listen"
      && entry.properties?.destination === "podcast"
    ))).toBe(true);
    const channelEvent = events.find((entry) => entry.event === "portfolio_channel_opened");
    expect(channelEvent?.properties?.$el_text).toBeUndefined();
    expect(channelEvent?.properties?.$elements_chain).toBeUndefined();
    expect(JSON.stringify(channelEvent)).not.toContain("open.spotify.com");
    expect(JSON.stringify(events)).not.toContain("open.spotify.com");
    expect(JSON.stringify(events)).not.toContain("si=951d916ec5ad4ed9");
    await page.goto("/resume/");
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: /Download PDF/i }).click();
    await download;
    await expect.poll(() => events.some((entry) => (
      entry.event === "portfolio_contact_action" && entry.properties?.action === "resume_download"
    ))).toBe(true);
    await page.goto("/privacy/");
    await page.locator('a[href^="mailto:"]').first().evaluate((link) => {
      link.addEventListener("click", (event) => event.preventDefault(), { once: true });
      link.click();
    });
    await expect.poll(() => events.some((entry) => (
      entry.event === "portfolio_contact_action" && entry.properties?.action === "email"
    ))).toBe(true);
    await page.goto("/contact/");
    await page.getByRole("button", { name: /Copy email/i }).click();
    await expect.poll(() => events.some((entry) => (
      entry.event === "portfolio_contact_action" && entry.properties?.action === "copy_email"
    ))).toBe(true);
  } else {
    expect(events).toEqual([]);
  }
});

test("analytics stay inert when the portfolio project key is absent", async ({ page }) => {
  test.skip(Boolean(process.env.PUBLIC_POSTHOG_KEY), "requires a build without the optional PostHog project key");
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/", { waitUntil: "networkidle" });
  const html = await page.content();
  expect(requests.some((url) => url.includes("posthog.com") || url.includes("phc_"))).toBe(Boolean(process.env.PUBLIC_POSTHOG_KEY));
  expect(html).not.toContain("phc_");
});

test("early analytics events survive fast cross-page navigation", async ({ page }) => {
  test.skip(Boolean(process.env.PUBLIC_POSTHOG_KEY), "requires the persisted early-event queue before PostHog drains it");
  await page.goto("/");
  await Promise.all([
    page.waitForURL("**/ask/"),
    page.locator('a[href="/ask/"]').first().evaluate((link) => link.click()),
  ]);
  await page.locator('a[href="/resume/"]').first().evaluate((link) => {
    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    link.click();
  });

  const queue = await page.evaluate(() => JSON.parse(sessionStorage.getItem("portfolio_event_queue") ?? "[]"));
  expect(queue.map((item) => item.event)).toEqual([
    "portfolio_assistant_opened",
    "portfolio_contact_action",
  ]);
  expect(queue.map((item) => item.pagePath)).toEqual(["/", "/ask/"]);
  expect(queue[1].properties).toEqual({ action: "resume" });
});

test("curated channel clicks queue only controlled analytics labels", async ({ page }) => {
  test.skip(Boolean(process.env.PUBLIC_POSTHOG_KEY), "requires the persisted early-event queue before PostHog drains it");
  await page.goto("/");
  await page.locator('[data-portfolio-destination="podcast"]').evaluate((link) => {
    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    link.click();
  });

  const queue = await page.evaluate(() => JSON.parse(sessionStorage.getItem("portfolio_event_queue") ?? "[]"));
  expect(queue).toEqual([{
    event: "portfolio_channel_opened",
    pagePath: "/",
    properties: { channel: "watch-listen", destination: "podcast" },
  }]);
  expect(JSON.stringify(queue)).not.toContain("open.spotify.com");
  expect(JSON.stringify(queue)).not.toContain("si=951d916ec5ad4ed9");
});

test("privacy signals prevent and clear the early analytics queue", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "globalPrivacyControl", {
      configurable: true,
      get: () => true,
    });
    sessionStorage.setItem("portfolio_event_queue", JSON.stringify([
      { event: "portfolio_assistant_opened", properties: { source: "stale" } },
    ]));
  });
  await page.goto("/");
  expect(await page.evaluate(() => sessionStorage.getItem("portfolio_event_queue"))).toBeNull();
  await page.locator('a[href="/ask/"]').first().evaluate((link) => {
    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    link.click();
  });

  expect(await page.evaluate(() => sessionStorage.getItem("portfolio_event_queue"))).toBeNull();
  expect(await page.evaluate(() => window.__portfolioEventQueue ?? [])).toEqual([]);
});

test("Chat resumes autoscroll when a visitor asks a new question", async ({ page }) => {
  let requestCount = 0;
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/chat", async (route) => {
    requestCount += 1;
    const answer = requestCount === 1 ? "Long answer. ".repeat(240) : "Second answer.";
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: [
        `event: meta\ndata: {"sessionId":"ses_44444444444444444444444444444444","turnId":"turn_${String(requestCount).repeat(32)}"}\n\n`,
        `event: delta\ndata: ${JSON.stringify({ text: answer })}\n\n`,
        'event: citations\ndata: {"citations":[]}\n\n',
        'event: done\ndata: {}\n\n',
      ].join(""),
    });
  });
  await page.goto("/ask/");
  const composer = page.getByPlaceholder("Ask anything about Kevin");
  await composer.fill("First question");
  await composer.press("Enter");
  await expect(page.getByText(/Long answer/)).toBeVisible();
  await expect.poll(() => page.locator(".chat-messages").evaluate((container) => {
    const answer = container.querySelector(".chat-message.assistant:last-of-type");
    if (!(answer instanceof HTMLElement)) return Number.POSITIVE_INFINITY;
    return Math.abs(answer.getBoundingClientRect().top - container.getBoundingClientRect().top);
  }), { message: "a completed long answer settles at its beginning" }).toBeLessThan(90);
  await page.locator(".chat-messages").evaluate((element) => {
    element.scrollTop = 0;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await composer.fill("Second question");
  await composer.press("Enter");
  await expect(page.getByText("Second answer.", { exact: true })).toBeVisible();
  await expect.poll(() => page.locator(".chat-messages").evaluate((element) => (
    element.scrollHeight - element.scrollTop - element.clientHeight
  ))).toBeLessThan(80);
});

test("Chat preserves a visitor's manual scroll position when a long stream finishes", async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input.url;
      if (!url.endsWith("/api/portfolio/chat")) return originalFetch(input, init);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          window.__portfolioManualScrollStream = {
            delta() {
              controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: "Long streamed answer. ".repeat(240) })}\n\n`));
            },
            done() {
              controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
              controller.close();
            },
          };
        },
      });
      return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
    };
  });
  await page.goto("/ask/");
  const composer = page.getByPlaceholder("Ask anything about Kevin");
  await composer.fill("Give me the detailed version");
  await composer.press("Enter");
  await page.evaluate(() => window.__portfolioManualScrollStream.delta());
  await expect(page.getByText(/Long streamed answer/)).toBeVisible();
  await page.locator(".chat-messages").evaluate((element) => {
    element.scrollTop = 0;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await page.evaluate(() => window.__portfolioManualScrollStream.done());
  await expect(page.getByRole("status")).toHaveText("Ready");
  await expect.poll(() => page.locator(".chat-messages").evaluate((element) => element.scrollTop)).toBeLessThan(20);
});

test("Chat anchors long deterministic fallback answers at their beginning", async ({ page }) => {
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/chat", async (route) => {
    await route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
  });
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/ask", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ answer: "Long fallback answer. ".repeat(240), citations: [] }),
    });
  });
  await page.goto("/ask/");
  const composer = page.getByPlaceholder("Ask anything about Kevin");
  await composer.fill("Give me the fallback answer");
  await composer.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Ready");
  await expect.poll(() => page.locator(".chat-messages").evaluate((container) => {
    const answer = container.querySelector(".chat-message.assistant:last-of-type");
    if (!(answer instanceof HTMLElement)) return Number.POSITIVE_INFINITY;
    return Math.abs(answer.getBoundingClientRect().top - container.getBoundingClientRect().top);
  })).toBeLessThan(90);
});

test("privacy copy describes safely formatted Chat answers", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(page.getByText(/safely formatted answer/i)).toBeVisible();
  await expect(page.getByText(/plain-text answer/i)).toHaveCount(0);
});

test("privacy copy discloses controlled curated-channel analytics", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(page.getByText(/curated-channel opens/i)).toBeVisible();
  await expect(page.getByText(/never the outbound URL or its query string/i)).toBeVisible();
  await expect(page.getByText(/excludes curated-channel links/i)).toBeVisible();
});

test("resume print control works under the site CSP", async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => window.sessionStorage.setItem("portfolio_print_called", "true");
  });
  await page.goto("/resume/");
  await page.getByRole("button", { name: "Print" }).click();
  await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem("portfolio_print_called"))).toBe("true");
});

test("grounded Chat streams safe formatted answers, activity, and server-controlled citations", async ({ page }) => {
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: [
        'event: meta\ndata: {"sessionId":"ses_11111111111111111111111111111111","turnId":"turn_11111111111111111111111111111111"}\n\n',
        'event: status\ndata: {"phase":"retrieving","state":"active"}\n\n',
        'event: status\ndata: {"phase":"retrieving","state":"complete","sourceCount":1,"sourceTitles":["Trackly case study"]}\n\n',
        'event: status\ndata: {"phase":"synthesizing","state":"active","sourceCount":1}\n\n',
        `event: delta\ndata: ${JSON.stringify({ text: "Kevin chose **direct career pages** as Trackly's source of earlier signal.\n\n" })}\n\n`,
        `event: delta\ndata: ${JSON.stringify({ text: "- Earlier discovery\n- Human approval\n\n<script>window.__unsafeMarkdown = true</script>" })}\n\n`,
        'event: citations\ndata: {"citations":[{"id":"trackly","title":"Trackly case study","url":"https://portfolio.kevinastuhuaman.com/projects/trackly/"},{"title":"Unsafe source","url":"javascript:alert(1)"}]}\n\n',
        'event: done\ndata: {"fallback":false}\n\n',
      ].join(""),
    });
  });
  await page.goto("/ask/");
  await page.getByRole("button", { name: "How does Trackly show product judgment?" }).click();
  await expect(page.getByRole("status")).toHaveText("Ready");
  await expect(page.getByText(/direct career pages/i)).toBeVisible();
  await expect(page.locator(".chat-message.assistant .chat-message-content strong")).toHaveText("direct career pages");
  await expect(page.locator(".chat-message.assistant li")).toHaveText(["Earlier discovery", "Human approval"]);
  await expect(page.locator(".chat-message.assistant script")).toHaveCount(0);
  expect(await page.evaluate(() => window.__unsafeMarkdown)).toBeUndefined();
  await expect(page.locator(".chat-reasoning")).toContainText("Searched Kevin’s public portfolio");
  await expect(page.locator(".chat-reasoning")).toContainText("Trackly case study");
  await expect(page.getByRole("link", { name: "Trackly case study" })).toHaveAttribute("href", "https://portfolio.kevinastuhuaman.com/projects/trackly/");
  await expect(page.getByRole("link", { name: "Unsafe source" })).toHaveCount(0);
  await expect(page.locator(".chat-message.assistant").getByText("Sources")).toBeVisible();
  await expect(page.getByText("Was this helpful?")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test("Chat preserves the server session and records turn-only feedback", async ({ page }) => {
  const requests = [];
  let feedbackPayload = null;
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/chat", async (route) => {
    requests.push(route.request().postDataJSON());
    const turn = requests.length === 1 ? "1" : "2";
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: [
        `event: meta\ndata: {"sessionId":"ses_11111111111111111111111111111111","turnId":"turn_${turn.repeat(32)}"}\n\n`,
        `event: delta\ndata: {"text":"Answer ${turn}."}\n\n`,
        'event: citations\ndata: {"citations":[]}\n\n',
        'event: done\ndata: {"fallback":false}\n\n',
      ].join(""),
    });
  });
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/feedback", async (route) => {
    feedbackPayload = route.request().postDataJSON();
    await route.fulfill({ status: 204, body: "" });
  });
  await page.goto("/ask/");
  const composer = page.getByPlaceholder("Ask anything about Kevin");
  await composer.fill("First question");
  await composer.press("Enter");
  await expect(page.getByText("Answer 1.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Helpful" }).click();
  await expect(page.getByText("Thanks for the feedback.")).toBeVisible();
  expect(feedbackPayload).toEqual({ turnId: "turn_11111111111111111111111111111111", rating: "helpful" });
  await composer.fill("What do you mean?");
  await composer.press("Enter");
  await expect(page.getByText("Answer 2.", { exact: true })).toBeVisible();
  expect(requests[1].sessionId).toBe("ses_11111111111111111111111111111111");
  expect(requests[1].history.at(-1)).toEqual({ role: "assistant", content: "Answer 1." });
});

test("late feedback completion cannot update a newer Chat turn", async ({ page }) => {
  let chatCount = 0;
  let releaseFeedback;
  const feedbackPending = new Promise((resolve) => { releaseFeedback = resolve; });
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/chat", async (route) => {
    chatCount += 1;
    const digit = String(chatCount);
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: [
        `event: meta\ndata: {"sessionId":"ses_33333333333333333333333333333333","turnId":"turn_${digit.repeat(32)}"}\n\n`,
        `event: delta\ndata: {"text":"Answer ${digit}."}\n\n`,
        'event: citations\ndata: {"citations":[]}\n\n',
        'event: done\ndata: {}\n\n',
      ].join(""),
    });
  });
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/feedback", async (route) => {
    await feedbackPending;
    await route.fulfill({ status: 204, body: "" });
  });
  await page.goto("/ask/");
  const composer = page.getByPlaceholder("Ask anything about Kevin");
  await composer.fill("First question");
  await composer.press("Enter");
  await expect(page.getByText("Answer 1.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Helpful" }).click();
  await expect(page.getByText("Sending feedback…")).toBeVisible();
  await composer.fill("Second question");
  await composer.press("Enter");
  await expect(page.getByText("Answer 2.", { exact: true })).toBeVisible();
  releaseFeedback();
  await expect(page.getByText("Was this helpful?")).toBeVisible();
  await expect(page.getByText("Thanks for the feedback.")).toHaveCount(0);
});

test("Chat uses real activity phases and natural keyboard submission", async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input.url;
      if (!url.endsWith("/api/portfolio/chat")) return originalFetch(input, init);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          window.__portfolioChatStream = {
            meta() { controller.enqueue(encoder.encode('event: meta\ndata: {"sessionId":"ses_22222222222222222222222222222222","turnId":"turn_22222222222222222222222222222222"}\n\n')); },
            retrieving() { controller.enqueue(encoder.encode('event: status\ndata: {"phase":"retrieving","state":"active"}\n\n')); },
            retrieved() { controller.enqueue(encoder.encode('event: status\ndata: {"phase":"retrieving","state":"complete","sourceCount":1,"sourceTitles":["Trackly case study"]}\n\n')); },
            synthesizing() { controller.enqueue(encoder.encode('event: status\ndata: {"phase":"synthesizing","state":"active","sourceCount":1}\n\n')); },
            delta() { controller.enqueue(encoder.encode('event: delta\ndata: {"text":"Kevin built Trackly"}\n\n')); },
            citations() {
              controller.enqueue(encoder.encode('event: citations\ndata: {"citations":[{"title":"Trackly case study","url":"https://portfolio.kevinastuhuaman.com/projects/trackly/"}]}\n\n'));
            },
            done() {
              controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
              controller.close();
            },
          };
        },
      });
      return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
    };
  });
  await page.goto("/ask/");
  const composer = page.getByPlaceholder("Ask anything about Kevin");
  await composer.fill("What did Kevin build?");
  await composer.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Considering your question");
  await expect(page.locator(".chat-reasoning")).toContainText("Understanding your question");
  await page.evaluate(() => window.__portfolioChatStream.meta());
  await page.evaluate(() => window.__portfolioChatStream.retrieving());
  await expect(page.getByRole("status")).toHaveText("Looking through Kevin's portfolio");
  await page.evaluate(() => window.__portfolioChatStream.retrieved());
  await expect(page.locator(".chat-reasoning")).toContainText("Trackly case study");
  await page.evaluate(() => window.__portfolioChatStream.synthesizing());
  await expect(page.getByRole("status")).toHaveText("Summarizing what matters");
  await expect(page.locator(".chat-reasoning")).toContainText("Grounding the answer in public evidence");
  await page.evaluate(() => window.__portfolioChatStream.delta());
  await expect(page.getByRole("status")).toHaveText("Writing answer");
  await expect(page.getByText("Kevin built Trackly", { exact: true })).toBeVisible();
  await expect(page.locator(".chat-reasoning")).toContainText("Writing the answer");
  await page.evaluate(() => window.__portfolioChatStream.citations());
  await expect(page.getByRole("link", { name: "Trackly case study" })).toBeVisible();
  await page.waitForTimeout(50);
  await page.evaluate(() => window.__portfolioChatStream.done());
  await expect(page.getByRole("status")).toHaveText("Ready");
  await expect(page.getByRole("link", { name: "Trackly case study" })).toBeVisible();

  await composer.fill("First line");
  await composer.press("Shift+Enter");
  await expect(composer).toHaveValue("First line\n");

  await composer.fill("Composing text");
  await composer.evaluate((element) => {
    const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    Object.defineProperty(event, "isComposing", { value: true });
    element.dispatchEvent(event);
  });
  await expect(composer).toHaveValue("Composing text");
  await expect(page.locator(".chat-message.user")).toHaveCount(1);

  const chatTab = page.getByRole("tab", { name: "Chat" });
  await chatTab.focus();
  await chatTab.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Voice" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Voice" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Voice" }).press("Home");
  await expect(chatTab).toBeFocused();
  await expect(chatTab).toHaveAttribute("aria-selected", "true");
});

test("Ask page removes artificial boundary copy and keeps concise AI disclosure", async ({ page }) => {
  await page.goto("/ask/");
  await expect(page.locator("h1")).toHaveText("Ask Kevin's AI anything.");
  await expect(page.getByText("Grounded Chat", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Answer grounded in public evidence", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Public corpus only", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Voice never impersonates Kevin", { exact: true })).toHaveCount(0);

  await page.getByRole("tab", { name: /Voice/ }).click();
  await expect(page.getByText(/Nothing starts until you tap the button, and the call is not recorded/i)).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test("malformed Chat stream resets its draft and recovers with the deterministic answer", async ({ page }) => {
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: [
        'event: delta\ndata: {"text":"This partial model draft must disappear."}\n\n',
        'event: citations\ndata: {malformed-json}\n\n',
      ].join(""),
    });
  });
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/ask", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ question: "What did Kevin build at PayPal?" });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        answer: "Kevin led a PayPal AI/ML observability prototype and proof of concept.",
        citations: [{ title: "PayPal case study", url: "https://portfolio.kevinastuhuaman.com/projects/paypal-ai-observability/" }],
      }),
    });
  });
  await page.goto("/ask/");
  await page.getByLabel("Question").fill("What did Kevin build at PayPal?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Ready");
  await expect(page.getByText(/prototype and proof of concept/i)).toBeVisible();
  await expect(page.getByText(/partial model draft/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "PayPal case study" })).toBeVisible();
});

test("malformed deterministic fallback is rejected without rendering unsafe values", async ({ page }) => {
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/chat", async (route) => {
    await route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
  });
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/ask", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ answer: 7, citations: "not-an-array" }),
    });
  });
  await page.goto("/ask/");
  await page.getByLabel("Question").fill("What did Kevin build?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Assistant unavailable");
  await expect(page.getByText(/interactive assistant is unavailable/i)).toBeVisible();
  await expect(page.getByText("undefined", { exact: true })).toHaveCount(0);
});

test("recoverable streamed Chat errors keep the server-provided fallback", async ({ page }) => {
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: [
        'event: delta\ndata: {"text":"Unsupported partial answer."}\n\n',
        'event: citations\ndata: {"citations":[{"title":"Discarded source","url":"https://portfolio.kevinastuhuaman.com/discarded/"}]}\n\n',
        'event: error\ndata: {"reset":true,"recoverable":true,"code":"synthesis_unavailable"}\n\n',
        'event: delta\ndata: {"text":"Kevin’s answer comes from the deterministic public corpus."}\n\n',
        'event: citations\ndata: {"citations":[{"title":"Public proof","url":"https://portfolio.kevinastuhuaman.com/proof/"}]}\n\n',
        'event: done\ndata: {"fallback":true}\n\n',
      ].join(""),
    });
  });
  await page.goto("/ask/");
  await page.getByLabel("Question").fill("What evidence supports Kevin's work?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Ready");
  await expect(page.getByText(/deterministic public corpus/i)).toBeVisible();
  await expect(page.getByText(/Unsupported partial answer/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Discarded source" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Public proof" })).toBeVisible();
});

test("privacy disclosure accurately describes Chat and Realtime Voice", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(page.getByText(/Azure-hosted language model/i)).toBeVisible();
  await expect(page.getByText(/microphone audio is sent over an encrypted WebRTC connection/i)).toBeVisible();
  await expect(page.getByText(/does not display or retain a transcript or audio recording/i)).toBeVisible();
});

test("Voice is opt-in, requests one microphone, creates one peer, shows no transcript, and cleans up", async ({ page }) => {
  test.setTimeout(60_000);
  let closeRequest = null;
  let closeCount = 0;
  const closeContentTypes = [];
  await page.addInitScript(() => {
    const counters = { mic: 0, pc: 0, stopped: 0, closed: 0, channelClosed: 0, sent: [] };
    window.__voiceCounters = counters;
    const track = { enabled: true, stop() { counters.stopped += 1; } };
    window.__voiceTrack = track;
    const stream = { getAudioTracks: () => [track], getTracks: () => [track] };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          counters.mic += 1;
          await new Promise((resolve) => window.setTimeout(resolve, 180));
          return stream;
        },
      },
    });
    Object.defineProperty(window, "AudioContext", { configurable: true, value: undefined });
    Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: undefined });
    class MockPeerConnection {
      constructor() { counters.pc += 1; this.connectionState = "connected"; this.onconnectionstatechange = null; window.__voicePeer = this; }
      addTrack() {}
      getSenders() { return []; }
      createDataChannel() {
        const dc = { readyState: "connecting", send(value) { counters.sent.push(JSON.parse(value)); }, close() { counters.channelClosed += 1; this.readyState = "closed"; this.onclose?.(); }, onopen: null, onmessage: null, onclose: null, onerror: null };
        window.__voiceDataChannel = dc;
        window.setTimeout(() => { dc.readyState = "open"; dc.onopen?.(); }, 100);
        return dc;
      }
      async createOffer() { return { type: "offer", sdp: "mock-offer" }; }
      async setLocalDescription() {}
      async setRemoteDescription() {}
      close() { counters.closed += 1; this.connectionState = "closed"; }
    }
    Object.defineProperty(window, "RTCPeerConnection", { configurable: true, value: MockPeerConnection });
  });
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/voice/token", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ephemeralKey: "test-ephemeral",
        closeToken: "test-close-capability-token-0000000000000000000",
        webrtcUrl: "https://api.portfolio.kevinastuhuaman.com/api/portfolio/voice/connect?sessionId=voice_00000000000000000000000000000001",
        model: "gpt-realtime-test",
        sessionId: "voice_00000000000000000000000000000001",
        maxDurationSeconds: 300,
      }),
    });
  });
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/voice/connect?sessionId=voice_00000000000000000000000000000001&model=gpt-realtime-test", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/sdp", body: "mock-answer" });
  });
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/voice/close", async (route) => {
    closeRequest = JSON.parse(route.request().postData() ?? "{}");
    closeContentTypes.push(route.request().headers()["content-type"] ?? "");
    const thisClose = ++closeCount;
    if (thisClose === 1) await new Promise((resolve) => setTimeout(resolve, 900));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sources: thisClose === 1
          ? [{ title: "Old call source", url: "https://portfolio.kevinastuhuaman.com/projects/paypal-ai-observability/" }]
          : [
              { title: "Current call source", url: "https://portfolio.kevinastuhuaman.com/projects/trackly/" },
              { title: "Unsafe source", url: "https://malicious.example/steal" },
            ],
      }),
    });
  });

  await page.goto("/ask/");
  await page.getByRole("tab", { name: /Voice/ }).click();
  expect(await page.evaluate(() => window.__voiceCounters.mic)).toBe(0);
  await expect(page.getByText(/Nothing starts until you tap the button, and the call is not recorded/i)).toBeVisible();
  await expect(page.locator(".portfolio-voice-orb-intro")).toHaveCSS("width", "260px");
  await expect(page.locator(".portfolio-voice-orb-intro")).toHaveCSS("height", "260px");
  await page.getByRole("button", { name: "Start voice call" }).click();
  await expect(page.getByText("Connecting", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mute", exact: true }).click();
  await expect(page.getByText("Microphone muted", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__voiceTrack.enabled)).toBe(false);
  await page.getByRole("button", { name: "Unmute", exact: true }).click();
  await expect(page.getByText("Listening", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__voiceTrack.enabled)).toBe(true);
  await expect(page.locator(".portfolio-voice-orb-active")).toHaveCSS("width", "300px");
  await expect(page.locator(".portfolio-voice-orb-active")).toHaveCSS("height", "300px");
  expect(await page.evaluate(() => window.__voiceCounters.mic)).toBe(1);
  expect(await page.evaluate(() => window.__voiceCounters.pc)).toBe(1);
  await page.evaluate(() => {
    const sendEvent = (event) => window.__voiceDataChannel.onmessage?.({ data: JSON.stringify(event) });
    window.__voiceCounters.sent.length = 0;
    sendEvent({ type: "response.output_text.delta", delta: "SECRET_TRANSCRIPT_SENTINEL" });
  });
  expect(await page.evaluate(() => window.__voiceCounters.sent)).toEqual([]);
  await expect(page.getByText("SECRET_TRANSCRIPT_SENTINEL")).toHaveCount(0);
  await expect(page.locator("[data-voice-transcript]")).toHaveCount(0);
  await page.evaluate(() => window.__voiceDataChannel.onmessage?.({ data: JSON.stringify({ type: "response.function_call_arguments.done", name: "lookup_portfolio" }) }));
  await expect(page.getByText(/Portfolio lookup · searching approved sources/i)).toBeVisible();
  await page.evaluate(() => window.__voiceDataChannel.onmessage?.({ data: JSON.stringify({ type: "response.output_audio.delta", delta: "audio" }) }));
  await expect(page.getByText("Speaking", { exact: true })).toBeVisible();
  await expect(page.getByText(/Portfolio lookup · searching approved sources/i)).toHaveCount(0);
  await page.evaluate(() => window.__voiceDataChannel.onmessage?.({ data: JSON.stringify({ type: "response.output_audio.done" }) }));
  await expect(page.getByText("Listening", { exact: true })).toBeVisible();
  await expect(page.getByText(/Portfolio lookup · searching approved sources/i)).toHaveCount(0);
  await page.evaluate(() => window.__voiceDataChannel.onmessage?.({ data: JSON.stringify({ type: "response.function_call_arguments.done", name: "lookup_portfolio" }) }));
  await expect(page.getByText(/Portfolio lookup · searching approved sources/i)).toBeVisible();
  await page.evaluate(() => window.__voiceDataChannel.onmessage?.({ data: JSON.stringify({
    type: "response.done",
    response: {
      usage: {
        input_token_details: { audio_tokens: 11, cached_tokens: 7, text_tokens: 5 },
        output_token_details: { audio_tokens: 13, text_tokens: 3 },
      },
    },
  }) }));
  await expect(page.getByText(/Portfolio lookup · searching approved sources/i)).toHaveCount(0);
  await page.evaluate(() => {
    window.__voicePeer.connectionState = "disconnected";
    window.__voicePeer.onconnectionstatechange?.();
  });
  await expect(page.getByText("Reconnecting", { exact: true })).toBeVisible();
  await page.evaluate(() => {
    window.__voicePeer.connectionState = "connected";
    window.__voicePeer.onconnectionstatechange?.();
  });
  await expect(page.getByText("Listening", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "End call" }).click();
  await expect(page.getByText("Call ended", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__voiceCounters.stopped)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__voiceCounters.closed)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__voiceCounters.channelClosed)).toBe(1);
  expect(closeRequest.closeToken).toBe("test-close-capability-token-0000000000000000000");
  expect(closeRequest.usage).toEqual({ inputAudioTokens: 11, outputAudioTokens: 13, cachedInputTokens: 7, textInputTokens: 5, textOutputTokens: 3 });

  await page.getByRole("button", { name: "Start another call" }).click();
  await expect(page.getByRole("button", { name: "Start voice call" })).toBeVisible();
  await page.getByRole("button", { name: "Start voice call" }).click();
  await expect(page.getByText("Listening", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__voiceCounters.mic)).toBe(2);
  expect(await page.evaluate(() => window.__voiceCounters.pc)).toBe(2);
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect.poll(() => closeCount).toBe(2);
  expect(closeContentTypes[1]).toBe("text/plain;charset=UTF-8");
  await expect.poll(() => page.evaluate(() => window.__voiceCounters.closed)).toBe(2);
  await page.getByRole("button", { name: "Start another call" }).click();
  await page.getByRole("button", { name: "Start voice call" }).click();
  await expect(page.getByText("Listening", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__voiceCounters.mic)).toBe(3);
  expect(await page.evaluate(() => window.__voiceCounters.pc)).toBe(3);
  await page.evaluate(() => window.__voiceDataChannel.onmessage?.({ data: JSON.stringify({
    type: "error",
    error: { code: "upstream_test_failure", message: "SECRET_REALTIME_ERROR" },
  }) }));
  await expect(page.getByText("Assistant unavailable", { exact: true })).toBeVisible();
  await expect(page.getByText("The voice assistant encountered a realtime error.")).toBeVisible();
  await expect(page.getByText("SECRET_REALTIME_ERROR")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Current call source" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Unsafe source" })).toHaveCount(0);
  await page.waitForTimeout(950);
  await expect(page.getByRole("link", { name: "Old call source" })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__voiceCounters.closed)).toBe(3);
});

test("Voice surfaces connecting and microphone denial, then recovers to Chat or retry", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () => new Promise((_, reject) => {
          window.__denyPortfolioMic = () => reject(new DOMException("denied", "NotAllowedError"));
        }),
      },
    });
  });
  await page.goto("/ask/");
  await page.getByRole("tab", { name: /Voice/ }).click();
  await page.getByRole("button", { name: "Start voice call" }).click();
  await expect(page.getByText("Connecting", { exact: true })).toBeVisible();
  await page.evaluate(() => window.__denyPortfolioMic());
  await expect(page.getByText("Assistant unavailable", { exact: true })).toBeVisible();
  await expect(page.getByText(/Microphone permission was denied/i)).toBeVisible();
  await expect(page.locator(".voice-error")).toHaveCSS("color", "rgb(255, 155, 155)");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("button", { name: "Start voice call" })).toBeVisible();
  await page.getByRole("button", { name: "Back to Chat" }).click();
  await expect(page.locator(".chat-panel h2")).toHaveText("What are you curious about?");
});

test("assistant failure preserves the static cited fallback", async ({ page }) => {
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/chat", async (route) => {
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "unavailable" }) });
  });
  await page.route("https://api.portfolio.kevinastuhuaman.com/api/portfolio/ask", async (route) => {
    await route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ message: "hourly limit" }) });
  });
  await page.goto("/ask/");
  await page.getByLabel("Question").fill("What did Kevin build at PayPal?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Assistant unavailable");
  await page.getByText("Browse five quick answers", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Start here." })).toBeVisible();
});
