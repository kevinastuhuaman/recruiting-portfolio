import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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
    await expect(page.locator(".page-hero")).toHaveCSS("background-color", "rgb(247, 247, 242)");
    await expect(page.locator(".page-hero h1")).toHaveCSS("color", "rgb(11, 11, 11)");
  });
}

test("mobile first viewport leads with AI PM, Berkeley, and PayPal evidence", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  const hero = page.locator(".recruiter-hero");

  await expect(hero.getByRole("heading", { level: 1, name: /Kevin Astuhuaman/i })).toBeVisible();
  await expect(hero.getByText(/Ex-PayPal AI\/ML observability/i)).toBeVisible();
  await expect(hero.getByText(/Berkeley Haas MBA/i)).toBeVisible();
  await expect(hero.getByRole("link", { name: "Resume", exact: true })).toBeVisible();
  await expect(page.locator(".mobile-nav summary")).toBeVisible();
  await expect(hero.getByText("Seven years building products and enjoying every minute of it.")).toBeVisible();
  await expect(hero.getByRole("link", { name: /View selected work/i })).toBeVisible();
  await expect(hero.getByRole("link", { name: /Ask the portfolio/i })).toBeVisible();
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
  const ids = ["credibility", "paypal", "trackly", "mobagel", "experience", "lab", "assistant", "contact"];
  const tops = await Promise.all(ids.map((id) => page.locator(`#${id}`).evaluate((element) => element.getBoundingClientRect().top + window.scrollY)));
  expect(tops).toEqual([...tops].sort((a, b) => a - b));
  await expect(page.locator("#lab").getByRole("link", { name: /Explore the AI Product Lab/i })).toHaveAttribute("href", "/lab/");
});

test("required responsive widths avoid horizontal overflow", async ({ page }) => {
  for (const width of [360, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 900 : 1000 });
    for (const path of ["/", "/ask/"]) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${path} at ${width}px`).toBeLessThanOrEqual(width);
    }
  }
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
  await page.locator(".mobile-nav summary").click();
  await expect(page.locator(".mobile-nav")).toHaveAttribute("open", "");
  await page.locator('.mobile-nav a[href="/#work"]').click();
  await expect(page.locator(".mobile-nav")).not.toHaveAttribute("open", "");
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
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Kevin");
    await expect(page.getByRole("link", { name: /Read the PayPal case/i })).toBeVisible();
    await page.goto("/resume/");
    await expect(page.getByText("PayPal Checkout", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Banco de Credito BCP/i })).toBeVisible();
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

test("Trackly explains the browser-agent harness and its human approval boundary", async ({ page }) => {
  await page.goto("/projects/trackly/");
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

test("404 output is excluded from indexing and structured data", async ({ page }) => {
  await page.goto("/404.html");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  await expect(page.locator(".page-hero")).toHaveCSS("background-color", "rgb(247, 247, 242)");
  await expect(page.locator(".page-hero h1")).toHaveCSS("color", "rgb(11, 11, 11)");
});

test("local previews never send production analytics", async ({ page }) => {
  const events = [];
  await page.route("https://us.i.posthog.com/capture/", async (route) => {
    events.push(JSON.parse(route.request().postData() ?? "{}"));
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.route("https://closeai.mba/api/portfolio/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: 'event: meta\ndata: {}\n\nevent: delta\ndata: {"text":"Public Trackly evidence."}\n\nevent: citations\ndata: {"citations":[]}\n\nevent: done\ndata: {}\n\n',
    });
  });
  await page.goto("/ask/?utm_source=linkedin");
  await page.getByLabel("Question").fill("private recruiter question text");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Answer grounded in public evidence");
  expect(JSON.stringify(events)).not.toContain("private recruiter question text");
  expect(events).toEqual([]);
});

test("resume print control works under the site CSP", async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => window.sessionStorage.setItem("portfolio_print_called", "true");
  });
  await page.goto("/resume/");
  await page.getByRole("button", { name: "Print" }).click();
  await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem("portfolio_print_called"))).toBe("true");
});

test("grounded Chat streams plain text and server-controlled citations", async ({ page }) => {
  await page.route("https://closeai.mba/api/portfolio/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: [
        'event: meta\ndata: {"sourceCount":1}\n\n',
        'event: delta\ndata: {"text":"Kevin chose direct career pages "}\n\n',
        'event: delta\ndata: {"text":"as Trackly\'s source of earlier signal."}\n\n',
        'event: citations\ndata: {"citations":[{"id":"trackly","title":"Trackly case study","url":"https://portfolio.kevinastuhuaman.com/projects/trackly/"}]}\n\n',
        'event: done\ndata: {"fallback":false}\n\n',
      ].join(""),
    });
  });
  await page.goto("/ask/");
  await page.getByRole("button", { name: "How does Trackly show product judgment?" }).click();
  await expect(page.getByRole("status")).toHaveText("Answer grounded in public evidence");
  await expect(page.getByText(/direct career pages/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Trackly case study" })).toHaveAttribute("href", "https://portfolio.kevinastuhuaman.com/projects/trackly/");
});

test("malformed Chat stream resets its draft and recovers with the deterministic answer", async ({ page }) => {
  await page.route("https://closeai.mba/api/portfolio/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: [
        'event: delta\ndata: {"text":"This partial model draft must disappear."}\n\n',
        'event: citations\ndata: {malformed-json}\n\n',
      ].join(""),
    });
  });
  await page.route("https://closeai.mba/api/portfolio/ask", async (route) => {
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
  await expect(page.getByRole("status")).toHaveText("Showing the deterministic public-corpus answer");
  await expect(page.getByText(/prototype and proof of concept/i)).toBeVisible();
  await expect(page.getByText(/partial model draft/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "PayPal case study" })).toBeVisible();
});

test("Voice is opt-in, requests one microphone, creates one peer, shows no transcript, and cleans up", async ({ page }) => {
  let closeRequest = null;
  await page.addInitScript(() => {
    const counters = { mic: 0, pc: 0, stopped: 0, closed: 0, channelClosed: 0, sent: [] };
    window.__voiceCounters = counters;
    const track = { enabled: true, stop() { counters.stopped += 1; } };
    const stream = { getAudioTracks: () => [track], getTracks: () => [track] };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: async () => { counters.mic += 1; return stream; } },
    });
    Object.defineProperty(window, "AudioContext", { configurable: true, value: undefined });
    Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: undefined });
    class MockPeerConnection {
      constructor() { counters.pc += 1; this.connectionState = "connected"; this.onconnectionstatechange = null; window.__voicePeer = this; }
      addTrack() {}
      getSenders() { return []; }
      createDataChannel() {
        const dc = { readyState: "connecting", send(value) { counters.sent.push(JSON.parse(value)); }, close() { counters.channelClosed += 1; this.readyState = "closed"; }, onopen: null, onmessage: null };
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
  await page.route("https://closeai.mba/api/portfolio/voice/token", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ephemeralKey: "test-ephemeral",
        closeToken: "test-close-capability-token-0000000000000000000",
        webrtcUrl: "https://closeai.mba/api/portfolio/voice/connect?sessionId=00000000-0000-4000-8000-000000000001",
        model: "gpt-realtime-test",
        sessionId: "00000000-0000-4000-8000-000000000001",
        maxDurationSeconds: 300,
      }),
    });
  });
  await page.route("https://closeai.mba/api/portfolio/voice/connect?sessionId=00000000-0000-4000-8000-000000000001&model=gpt-realtime-test", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/sdp", body: "mock-answer" });
  });
  await page.route("https://closeai.mba/api/portfolio/voice/close", async (route) => {
    closeRequest = JSON.parse(route.request().postData() ?? "{}");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sources: [{ title: "PayPal case study", url: "https://portfolio.kevinastuhuaman.com/projects/paypal-ai-observability/" }],
      }),
    });
  });

  await page.goto("/ask/");
  await page.getByRole("tab", { name: /Voice/ }).click();
  expect(await page.evaluate(() => window.__voiceCounters.mic)).toBe(0);
  await expect(page.getByText(/This is an AI guide, not Kevin/i)).toBeVisible();
  await page.getByRole("button", { name: "Start voice call" }).click();
  await expect(page.getByText("Connecting securely", { exact: true })).toBeVisible();
  await expect(page.getByText("Listening", { exact: true })).toBeVisible();
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
  await page.evaluate(() => window.__voiceDataChannel.onmessage?.({ data: JSON.stringify({ type: "response.output_audio.delta", delta: "audio" }) }));
  await expect(page.getByText("Portfolio guide is speaking", { exact: true })).toBeVisible();
  await page.evaluate(() => window.__voiceDataChannel.onmessage?.({ data: JSON.stringify({ type: "response.output_audio.done" }) }));
  await expect(page.getByText("Listening", { exact: true })).toBeVisible();
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
  await expect(page.getByRole("link", { name: "PayPal case study" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__voiceCounters.stopped)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__voiceCounters.closed)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__voiceCounters.channelClosed)).toBe(1);
  expect(closeRequest.closeToken).toBe("test-close-capability-token-0000000000000000000");
});

test("Voice surfaces connecting and microphone denial, then recovers to Chat or retry", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () => new Promise((_, reject) => {
          window.setTimeout(() => reject(new DOMException("denied", "NotAllowedError")), 150);
        }),
      },
    });
  });
  await page.goto("/ask/");
  await page.getByRole("tab", { name: /Voice/ }).click();
  await page.getByRole("button", { name: "Start voice call" }).click();
  await expect(page.getByText("Connecting securely", { exact: true })).toBeVisible();
  await expect(page.getByText("Voice unavailable", { exact: true })).toBeVisible();
  await expect(page.getByText(/Microphone permission was denied/i)).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("button", { name: "Start voice call" })).toBeVisible();
  await page.getByRole("button", { name: "Use Chat instead" }).click();
  await expect(page.getByRole("heading", { name: "Ask a recruiter question." })).toBeVisible();
});

test("assistant failure preserves the static cited fallback", async ({ page }) => {
  await page.route("https://closeai.mba/api/portfolio/chat", async (route) => {
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "unavailable" }) });
  });
  await page.route("https://closeai.mba/api/portfolio/ask", async (route) => {
    await route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ message: "hourly limit" }) });
  });
  await page.goto("/ask/");
  await page.getByLabel("Question").fill("What did Kevin build at PayPal?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Interactive assistant unavailable");
  await expect(page.getByRole("heading", { name: "Five answers without the model." })).toBeVisible();
});
