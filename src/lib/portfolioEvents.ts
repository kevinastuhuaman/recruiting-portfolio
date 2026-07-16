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
    __portfolioEventQueue?: QueuedPortfolioEvent[];
  }
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
