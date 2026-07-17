import posthog, { type CaptureResult } from "posthog-js";
import {
  classifyPortfolioInteraction,
  clearPortfolioEventQueue,
  drainPortfolioEvents,
  portfolioPrivacySignalEnabled,
  type SafeProperties,
} from "./portfolioEvents";

const POSTHOG_DEFAULT_HOST = "https://us.i.posthog.com";
const REPLAY_SAMPLE_PERCENT = 10;
const REPLAY_EXCLUDED_PATHS = new Set(["/ask/"]);

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

let initialized = false;
let sessionId = "";
let visibleStartedAt = 0;
let visibleDurationMs = 0;
let engagementFinalized = false;

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

function cleanUrl(value: unknown) {
  if (typeof value !== "string") return value;
  try {
    const url = new URL(value, window.location.origin);
    return `${url.origin}${url.pathname}`;
  } catch {
    return safePath(value);
  }
}

function durationBucket(durationMs: number) {
  if (durationMs < 10_000) return "under_10s";
  if (durationMs < 30_000) return "10_to_29s";
  if (durationMs < 60_000) return "30_to_59s";
  if (durationMs < 180_000) return "1_to_3m";
  return "3m_plus";
}

function viewportBucket() {
  if (window.innerWidth < 480) return "mobile_small";
  if (window.innerWidth < 768) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  if (window.innerWidth < 1440) return "desktop";
  return "desktop_large";
}

function sanitizeProperties(properties: SafeProperties = {}) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => (
      typeof value === "string" || typeof value === "number" || typeof value === "boolean"
    )),
  );
}

function beforeSend(event: CaptureResult | null): CaptureResult | null {
  if (!event) return null;
  const properties = event.properties ?? {} as Record<string, unknown>;
  const urlProperty = new Set([
    "$current_url", "$referrer", "$session_entry_url", "$session_entry_referrer",
    "$initial_current_url", "$initial_referrer", "$initial_session_entry_url", "$initial_session_entry_referrer",
  ]);
  const campaignProperty = /^(?:(?:\$initial_|\$session_entry_))?(?:utm_|gad_source$|mc_cid$|gclid$|gclsrc$|dclid$|gbraid$|wbraid$|fbclid$|msclkid$|twclid$|igshid$|ttclid$|rdt_cid$|epik$|qclid$|sccid$|irclid$|li_fat_id$|_kx$)/;
  const sanitizeAttribution = (record: Record<string, unknown>) => {
    for (const key of Object.keys(record)) {
      if (campaignProperty.test(key)) {
        delete record[key];
        continue;
      }
      if (urlProperty.has(key)) record[key] = cleanUrl(record[key]);
      const value = record[key];
      if (value && typeof value === "object" && !Array.isArray(value)) sanitizeAttribution(value as Record<string, unknown>);
    }
  };
  sanitizeAttribution(properties);
  for (const key of ["$el_text", "$elements_chain", "$elements"]) {
    delete properties[key];
  }
  event.properties = properties;
  return event;
}

function shouldRecordReplay(id: string, pathname: string) {
  if (REPLAY_EXCLUDED_PATHS.has(pathname)) return false;
  let hash = 0;
  for (const character of id) hash = ((hash * 31) + character.charCodeAt(0)) >>> 0;
  return hash % 100 < REPLAY_SAMPLE_PERCENT;
}

function capture(event: string, properties: SafeProperties = {}) {
  if (!initialized || portfolioPrivacySignalEnabled()) return;
  try {
    const sanitizedProperties = sanitizeProperties(properties);
    const pagePath = typeof sanitizedProperties.page_path === "string"
      ? safePath(sanitizedProperties.page_path)
      : safePath();
    posthog.capture(event, {
      ...sanitizedProperties,
      $process_person_profile: false,
      page_path: pagePath,
      portfolio_session_id: sessionId,
      environment: "production",
      product: "recruiting_portfolio",
      viewport_bucket: viewportBucket(),
    });
  } catch {
    // Analytics must never affect the portfolio experience.
  }
}

function sendEngagement() {
  if (engagementFinalized || (!visibleStartedAt && !visibleDurationMs)) return;
  if (visibleStartedAt) visibleDurationMs += Math.max(0, performance.now() - visibleStartedAt);
  visibleStartedAt = 0;
  engagementFinalized = true;
  capture("portfolio_page_engaged", {
    duration_bucket: durationBucket(visibleDurationMs),
  });
}

function updateVisibleTime() {
  if (document.visibilityState === "hidden") {
    if (visibleStartedAt) visibleDurationMs += Math.max(0, performance.now() - visibleStartedAt);
    visibleStartedAt = 0;
    return;
  }
  visibleStartedAt = performance.now();
}

function markAllowlistedInteractions() {
  document.querySelectorAll<HTMLElement>("a[href], button").forEach((element) => {
    if (classifyPortfolioInteraction(element)) element.dataset.analyticsCapture = "true";
  });
}

function observeSections() {
  if (!("IntersectionObserver" in window)) return;
  const observed = new Set<string>();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const section = (entry.target as HTMLElement).id;
      if (!entry.isIntersecting || !SECTION_IDS.has(section) || observed.has(section)) continue;
      observed.add(section);
      capture("portfolio_section_viewed", { section });
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.35 });
  document.querySelectorAll<HTMLElement>("main section[id], main article[id]").forEach((section) => {
    if (SECTION_IDS.has(section.id)) observer.observe(section);
  });
}

export function initializePortfolioAnalytics(
  key: string | undefined,
  host = POSTHOG_DEFAULT_HOST,
  allowedHost = "portfolio.kevinastuhuaman.com",
) {
  if (initialized || window.location.hostname !== allowedHost) return;
  if (portfolioPrivacySignalEnabled()) {
    clearPortfolioEventQueue();
    return;
  }
  if (!key?.startsWith("phc_")) return;

  const isLocalVerification = allowedHost === "127.0.0.1" || allowedHost === "localhost";

  sessionId = getSessionId();
  visibleStartedAt = document.visibilityState === "hidden" ? 0 : performance.now();
  visibleDurationMs = 0;
  engagementFinalized = false;
  markAllowlistedInteractions();

  posthog.init(key, {
    api_host: host,
    ui_host: "https://us.posthog.com",
    defaults: "2026-05-30",
    capture_pageview: false,
    capture_pageleave: false,
    disable_compression: isLocalVerification,
    opt_out_useragent_filter: isLocalVerification,
    request_batching: !isLocalVerification,
    person_profiles: "never",
    persistence: "sessionStorage",
    cross_subdomain_cookie: false,
    disable_session_recording: true,
    disable_surveys: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    mask_personal_data_properties: true,
    autocapture: {
      dom_event_allowlist: ["click"],
      element_allowlist: ["a", "button"],
      css_selector_allowlist: ["[data-analytics-capture='true']"],
      css_selector_ignorelist: [".ph-no-capture", ".ph-no-autocapture", "[data-ph-no-autocapture]"],
      capture_copied_text: false,
    },
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "*",
      blockSelector: ".ph-no-capture",
      recordCrossOriginIframes: false,
      maskCapturedNetworkRequestFn: (request) => {
        if (request.name) request.name = String(cleanUrl(request.name));
        delete request.requestBody;
        delete request.responseBody;
        delete request.requestHeaders;
        delete request.responseHeaders;
        return request;
      },
    },
    before_send: beforeSend,
    loaded: () => {
      initialized = true;
      window.__portfolioAnalyticsCapture = capture;
      posthog.register({
        portfolio_session_id: sessionId,
        environment: "production",
        product: "recruiting_portfolio",
      });
      if (window.__portfolioEarlyClickHandler) {
        document.removeEventListener("click", window.__portfolioEarlyClickHandler, { capture: true });
        delete window.__portfolioEarlyClickHandler;
      }
      if (shouldRecordReplay(sessionId, safePath())) posthog.startSessionRecording();
      capture("$pageview", { page_path: safePath() });
      if (safePath() === "/ask/") capture("portfolio_assistant_opened", { source: "direct" });
      drainPortfolioEvents(capture);
      observeSections();
      document.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) return;
        const classified = classifyPortfolioInteraction(event.target);
        if (classified) capture(classified.event, classified.properties);
      }, { capture: true });
      window.addEventListener("pagehide", sendEngagement, { once: true });
      document.addEventListener("visibilitychange", updateVisibleTime);
    },
  });
}
