export type PortfolioEvent =
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

export type SafeValue = boolean | number | string;
export type SafeProperties = Record<string, SafeValue | undefined>;
export type QueuedPortfolioEvent = { event: PortfolioEvent; properties: SafeProperties };

declare global {
  interface Window {
    __portfolioAnalyticsCapture?: (event: PortfolioEvent, properties: SafeProperties) => void;
    __portfolioEarlyClickHandler?: (event: MouseEvent) => void;
    __portfolioEventQueue?: QueuedPortfolioEvent[];
  }
}

export function classifyPortfolioInteraction(element: Element) {
  const copyEmail = element.closest<HTMLElement>("[data-copy-email], [data-contact-copy-email]");
  if (copyEmail) return { event: "portfolio_contact_action" as const, properties: { action: "copy_email" } };

  const link = element.closest<HTMLAnchorElement>("a[href]");
  if (!link) return undefined;
  const href = link.getAttribute("href") ?? "";
  if (href.startsWith("mailto:")) return { event: "portfolio_contact_action" as const, properties: { action: "email" } };
  if (href.includes("linkedin.com")) return { event: "portfolio_contact_action" as const, properties: { action: "linkedin" } };
  if (href.endsWith(".pdf")) return { event: "portfolio_contact_action" as const, properties: { action: "resume_download" } };
  if (href === "/resume/" || href.startsWith("/resume/")) return { event: "portfolio_contact_action" as const, properties: { action: "resume" } };
  if (href === "/ask/" || href.startsWith("/ask/")) return { event: "portfolio_assistant_opened" as const, properties: { source: "site_link" } };
  if (href.startsWith("/projects/")) {
    const project = href.split("/").filter(Boolean).at(1) ?? "unknown";
    return { event: "portfolio_case_study_opened" as const, properties: { project } };
  }
  return undefined;
}

export function capturePortfolioEvent(event: PortfolioEvent, properties: SafeProperties = {}) {
  if (typeof window === "undefined") return;
  if (window.__portfolioAnalyticsCapture) {
    window.__portfolioAnalyticsCapture(event, properties);
    return;
  }
  (window.__portfolioEventQueue ??= []).push({ event, properties });
}

export function drainPortfolioEvents(handler: (event: PortfolioEvent, properties: SafeProperties) => void) {
  const queue = window.__portfolioEventQueue ?? [];
  window.__portfolioEventQueue = [];
  for (const item of queue) handler(item.event, item.properties);
}
