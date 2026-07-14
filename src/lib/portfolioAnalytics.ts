const POSTHOG_DEFAULT_HOST = "https://us.i.posthog.com";

const SECTION_IDS = new Set([
  "assistant",
  "credibility",
  "experience",
  "lab",
  "mobagel",
  "paypal",
  "trackly",
  "work",
]);

type PortfolioEvent =
  | "portfolio_assistant_opened"
  | "portfolio_assistant_mode_selected"
  | "portfolio_case_study_opened"
  | "portfolio_chat_completed"
  | "portfolio_chat_failed"
  | "portfolio_chat_feedback"
  | "portfolio_chat_started"
  | "portfolio_contact_action"
  | "portfolio_page_engaged"
  | "portfolio_section_viewed"
  | "portfolio_voice_ended"
  | "portfolio_voice_failed"
  | "portfolio_voice_started"
  | "portfolio_voice_state_changed";

type SafeValue = boolean | number | string;
type SafeProperties = Record<string, SafeValue | undefined>;

let projectKey = "";
let captureEndpoint = "";
let initialized = false;
let sessionId = "";
let pageStartedAt = 0;
let engagementSent = false;

function privacySignalEnabled() {
  const navigatorWithGpc = navigator as Navigator & { globalPrivacyControl?: boolean };
  const windowWithDnt = window as Window & { doNotTrack?: string };
  return navigatorWithGpc.globalPrivacyControl === true || navigator.doNotTrack === "1" || windowWithDnt.doNotTrack === "1";
}

function randomId() {
  return globalThis.crypto?.randomUUID?.() ?? `portfolio-${Math.random().toString(36).slice(2)}`;
}

function getSessionId() {
  try {
    const existing = sessionStorage.getItem("portfolio_analytics_session");
    if (existing) return existing;
    const created = randomId();
    sessionStorage.setItem("portfolio_analytics_session", created);
    return created;
  } catch {
    return randomId();
  }
}

function safePath(value = window.location.href) {
  try {
    return new URL(value, window.location.origin).pathname;
  } catch {
    return "/";
  }
}

function durationBucket(durationMs: number) {
  if (durationMs < 10_000) return "under_10s";
  if (durationMs < 30_000) return "10_to_29s";
  if (durationMs < 60_000) return "30_to_59s";
  if (durationMs < 180_000) return "1_to_2m";
  return "3m_plus";
}

function sanitizeProperties(properties: SafeProperties = {}) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => (
      typeof value === "string" || typeof value === "number" || typeof value === "boolean"
    )),
  );
}

function dispatch(event: string, properties: SafeProperties = {}, useBeacon = false) {
  if (!initialized || !projectKey || privacySignalEnabled()) return;
  const pathname = safePath();
  const payload = JSON.stringify({
    api_key: projectKey,
    event,
    properties: {
      distinct_id: `portfolio:${sessionId}`,
      $session_id: sessionId,
      $process_person_profile: false,
      $current_url: `${window.location.origin}${pathname}`,
      $host: window.location.host,
      $pathname: pathname,
      environment: "production",
      product: "recruiting_portfolio",
      ...sanitizeProperties(properties),
    },
  });

  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(captureEndpoint, new Blob([payload], { type: "application/json" }));
      return;
    }
    void fetch(captureEndpoint, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: payload,
    }).catch(() => undefined);
  } catch {
    // Analytics must never affect the portfolio experience.
  }
}

function sendEngagement() {
  if (engagementSent || !pageStartedAt) return;
  engagementSent = true;
  dispatch("portfolio_page_engaged", {
    duration_bucket: durationBucket(Math.max(0, performance.now() - pageStartedAt)),
  }, true);
}

function classifyLink(element: Element) {
  const copyEmail = element.closest<HTMLElement>("[data-copy-email]");
  if (copyEmail) return { event: "portfolio_contact_action" as const, properties: { action: "copy_email" } };

  const link = element.closest<HTMLAnchorElement>("a[href]");
  if (!link) return undefined;
  const href = link.getAttribute("href") ?? "";
  if (href.includes("linkedin.com")) return { event: "portfolio_contact_action" as const, properties: { action: "linkedin" } };
  if (href === "/resume/" || href.startsWith("/resume/")) return { event: "portfolio_contact_action" as const, properties: { action: "resume" } };
  if (href === "/ask/" || href.startsWith("/ask/")) return { event: "portfolio_assistant_opened" as const, properties: { source: "site_link" } };
  if (href.startsWith("/projects/")) {
    const project = href.split("/").filter(Boolean).at(1) ?? "unknown";
    return { event: "portfolio_case_study_opened" as const, properties: { project } };
  }
  return undefined;
}

function observeSections() {
  if (!("IntersectionObserver" in window)) return;
  const observed = new Set<string>();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const section = (entry.target as HTMLElement).id;
      if (!entry.isIntersecting || !SECTION_IDS.has(section) || observed.has(section)) continue;
      observed.add(section);
      dispatch("portfolio_section_viewed", { section });
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.35 });
  document.querySelectorAll<HTMLElement>("main section[id], main article[id]").forEach((section) => {
    if (SECTION_IDS.has(section.id)) observer.observe(section);
  });
}

export function capturePortfolioEvent(event: PortfolioEvent, properties: SafeProperties = {}) {
  dispatch(event, properties);
}

export function initializePortfolioAnalytics(key: string | undefined, host = POSTHOG_DEFAULT_HOST) {
  if (initialized || !key?.startsWith("phc_") || privacySignalEnabled()) return;
  projectKey = key;
  captureEndpoint = `${host.replace(/\/$/, "")}/i/v0/e/`;
  sessionId = getSessionId();
  pageStartedAt = performance.now();
  initialized = true;

  dispatch("$pageview", { page_path: safePath() });
  if (safePath() === "/ask/") dispatch("portfolio_assistant_opened", { source: "direct" });
  observeSections();

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const classified = classifyLink(event.target);
    if (classified) dispatch(classified.event, classified.properties);
  }, { capture: true });

  window.addEventListener("pagehide", sendEngagement, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendEngagement();
  });
}
