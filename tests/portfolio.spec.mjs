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
    await expect(page.locator(".page-hero")).toHaveCSS("background-color", "rgb(247, 247, 242)");
    await expect(page.locator(".page-hero h1")).toHaveCSS("color", "rgb(11, 11, 11)");
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
  await expect(hero.getByRole("button", { name: "Recruiter" })).toHaveAttribute("aria-controls", "home-panel-recruiter");
  await expect(hero.getByRole("button", { name: "Builder" })).toHaveAttribute("aria-controls", "home-panel-builder");
  await expect(hero.getByRole("button", { name: "Agent" })).toHaveAttribute("aria-controls", "home-panel-agent");

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
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /65 entries, organized by what I built with them/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Explore the builder stack/i })).toHaveAttribute(
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
  await page.goto("/");
  const section = page.locator("#enterprise-interface-kit");
  await expect(section.getByRole("heading", { name: "Trust comes from visible boundaries." })).toBeVisible();
  await expect(section.getByRole("link", { name: /Open the interface kit/i })).toHaveAttribute(
    "href",
    "https://kevinastuhuaman.github.io/enterprise-ai-interface-kit/",
  );
  await expect(section.getByRole("link", { name: /Inspect seven contracts/i })).toHaveAttribute(
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

  await page.goto("/#enterprise-interface-kit");
  const anchoredTop = await section.evaluate((element) => element.getBoundingClientRect().top);
  expect(anchoredTop).toBeGreaterThanOrEqual(64);
});

test("human control proof is visible and machine-readable", async ({ page, request }) => {
  await page.goto("/");
  const section = page.locator("#human-control-plane");
  await expect(section.getByRole("heading", { name: "Capability is not permission." })).toBeVisible();
  await expect(section.getByRole("link", { name: /Try the control plane/i })).toHaveAttribute(
    "href",
    "https://kevinastuhuaman.github.io/human-in-the-loop-patterns/",
  );
  await expect(section.getByRole("link", { name: /Inspect the decisions/i })).toHaveAttribute(
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
  await page.goto("/");
  const section = page.locator("#motion-studies");
  await expect(section.getByRole("heading", { name: "Motion should explain what changed." })).toBeVisible();
  await expect(section.getByRole("link", { name: /Explore the motion studies/i })).toHaveAttribute(
    "href",
    "https://kevinastuhuaman.github.io/ai-product-motion-studies/",
  );
  await expect(section.getByRole("link", { name: /Inspect the motion spec/i })).toHaveAttribute(
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
  for (const path of ["/robots.txt", "/sitemap.xml", "/llms.txt", "/profile.json", "/projects.json", "/proof.json", "/assistant-corpus.json", "/resume.md", "/2e43f7d61916408ea525527e4bc9b5c7.txt", "/.well-known/agent-skills/index.json", "/.well-known/agent-skills/site-navigation/SKILL.md", "/kevin-astuhuaman-resume.pdf", "/assets/enterprise-ai-interface-kit-preview.png", "/assets/human-control-plane-preview.png", "/assets/motion-studies-preview.png"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
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

test("public assistant voice input stays editable and voice playback uses only the returned answer", async ({ page }) => {
  await page.addInitScript(() => {
    class MockRecognition {
      continuous = false;
      interimResults = false;
      lang = "";
      onstart = null;
      onresult = null;
      onerror = null;
      onend = null;
      start() {
        this.onstart?.();
        this.onresult?.({
          resultIndex: 0,
          results: [{ 0: { transcript: "What did Kevin build at PayPal?" }, isFinal: true }],
        });
        this.onend?.();
      }
      stop() { this.onend?.(); }
      abort() { this.onend?.(); }
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: MockRecognition });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: class {
        constructor(text) { this.text = text; }
      },
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        speaking: true,
        cancel() { this.speaking = true; },
        speak(utterance) {
          this.speaking = true;
          window.sessionStorage.setItem("portfolio_spoken_answer", utterance.text);
          this.speaking = false;
          utterance.onend?.();
        },
      },
    });
  });

  let assistantRequests = 0;
  await page.route("https://closeai.mba/api/portfolio/ask", async (route) => {
    assistantRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ answer: "Kevin built an agentic observability prototype for PayPal Checkout.", citations: [], corpusVersion: "test" }),
    });
  });

  await page.goto("/ask/");
  await expect(page.locator("[data-stop]")).toBeHidden();
  await expect(page.locator("[data-speak]")).toBeHidden();
  await page.getByRole("button", { name: "Dictate question" }).click();
  await expect(page.getByLabel("Question about Kevin's work")).toHaveValue("What did Kevin build at PayPal?");
  await expect(page.getByRole("status")).toHaveText("Question captured. Review it, then ask.");
  expect(assistantRequests).toBe(0);

  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Answer complete.");
  expect(assistantRequests).toBe(1);

  await page.getByRole("button", { name: "Read answer aloud" }).click();
  await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem("portfolio_spoken_answer"))).toBe("Kevin built an agentic observability prototype for PayPal Checkout.");
});

test("dictation cancels page speech without surfacing stale playback errors", async ({ page }) => {
  await page.addInitScript(() => {
    class MockRecognition {
      continuous = false;
      interimResults = false;
      lang = "";
      onstart = null;
      onresult = null;
      onerror = null;
      onend = null;
      start() { this.onstart?.(); }
      stop() { this.onend?.(); }
      abort() { this.onend?.(); }
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: MockRecognition });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: class {
        constructor(text) { this.text = text; }
      },
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        speaking: false,
        current: null,
        cancel() {
          const canceled = this.current;
          this.current = null;
          this.speaking = false;
          window.setTimeout(() => canceled?.onerror?.(), 0);
        },
        speak(utterance) {
          this.current = utterance;
          this.speaking = true;
        },
      },
    });
  });
  await page.route("https://closeai.mba/api/portfolio/ask", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ answer: "Public answer.", citations: [], corpusVersion: "test" }),
    });
  });

  await page.goto("/ask/");
  const question = page.getByLabel("Question about Kevin's work");
  await question.fill("What did Kevin build at PayPal?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Answer complete.");

  const playback = page.getByRole("button", { name: "Read answer aloud" });
  await playback.click();
  await expect(page.getByRole("status")).toHaveText("Reading answer aloud.");
  await playback.click();
  await page.waitForTimeout(20);
  await expect(page.getByRole("status")).toHaveText("Answer complete.");

  await playback.click();
  await page.getByRole("button", { name: "Dictate question" }).click();
  await page.waitForTimeout(20);
  await expect(page.getByRole("status")).toHaveText("Listening...");
  await expect(playback).toBeDisabled();
  await expect(question).toHaveValue("What did Kevin build at PayPal?");
});

test("stale recognition sessions cannot tear down the current dictation", async ({ page }) => {
  await page.addInitScript(() => {
    let nextId = 0;
    class MockRecognition {
      continuous = false;
      interimResults = false;
      lang = "";
      onstart = null;
      onresult = null;
      onerror = null;
      onend = null;
      constructor() { this.id = nextId += 1; }
      start() {
        window.setTimeout(() => this.onstart?.(), this.id === 1 ? 20 : 0);
      }
      stop() { window.setTimeout(() => this.onend?.(), 0); }
      abort() { window.setTimeout(() => this.onend?.(), 0); }
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: MockRecognition });
  });

  await page.goto("/ask/");
  const dictate = page.getByRole("button", { name: "Dictate question" });
  await dictate.evaluate((button) => {
    button.click();
    button.click();
  });
  await page.waitForTimeout(40);
  const stopDictation = page.getByRole("button", { name: "Stop dictation" });
  await expect(stopDictation).toHaveAttribute("aria-pressed", "true");
  await stopDictation.click();
  await expect(page.getByRole("button", { name: "Dictate question" })).toHaveAttribute("aria-pressed", "false");
});

test("submitting during dictation suppresses the browser abort error", async ({ page }) => {
  await page.addInitScript(() => {
    class MockRecognition {
      continuous = false;
      interimResults = false;
      lang = "";
      onstart = null;
      onresult = null;
      onerror = null;
      onend = null;
      start() { this.onstart?.(); }
      stop() { this.onend?.(); }
      abort() {
        window.setTimeout(() => {
          this.onerror?.({ error: "aborted" });
          this.onend?.();
        }, 0);
      }
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: MockRecognition });
  });
  let releaseResponse;
  const responseGate = new Promise((resolve) => { releaseResponse = resolve; });
  await page.route("https://closeai.mba/api/portfolio/ask", async (route) => {
    await responseGate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ answer: "Public answer.", citations: [], corpusVersion: "test" }),
    });
  });

  await page.goto("/ask/");
  await page.getByLabel("Question about Kevin's work").fill("What did Kevin build at PayPal?");
  await page.getByRole("button", { name: "Dictate question" }).click();
  await expect(page.getByRole("status")).toHaveText("Listening...");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await page.waitForTimeout(20);
  await expect(page.getByRole("status")).toHaveText("Checking the public portfolio...");
  releaseResponse();
  await expect(page.getByRole("status")).toHaveText("Answer complete.");
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
