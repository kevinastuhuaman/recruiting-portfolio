export const PORTFOLIO_API = 'https://api.portfolio.kevinastuhuaman.com/api/portfolio';

export type PortfolioCitation = { id?: string; title: string; url: string };

const APPROVED_CITATION_HOSTS = new Set([
  'apps.apple.com',
  'github.com',
  'haas.berkeley.edu',
  'kevinastuhuaman.github.io',
  'portfolio.kevinastuhuaman.com',
  'usetrackly.app',
]);

export function sanitizePortfolioCitations(value: unknown): PortfolioCitation[] {
  if (!Array.isArray(value)) return [];
  const citations: PortfolioCitation[] = [];
  const seenUrls = new Set<string>();
  for (const citation of value) {
    if (!citation || typeof citation !== 'object' || Array.isArray(citation)) continue;
    const item = citation as { id?: unknown; title?: unknown; url?: unknown };
    if ((item.id !== undefined && typeof item.id !== 'string') || typeof item.title !== 'string' || typeof item.url !== 'string') continue;
    try {
      const url = new URL(item.url);
      const title = item.title.trim();
      if (!title || title.length > 120 || url.protocol !== 'https:' || !APPROVED_CITATION_HOSTS.has(url.hostname) || url.username || url.password || seenUrls.has(url.href)) continue;
      seenUrls.add(url.href);
      citations.push({
        ...(typeof item.id === 'string' ? { id: item.id } : {}),
        title,
        url: url.href,
      });
    } catch {
      // Ignore malformed or unapproved links instead of rendering them.
    }
  }
  return citations;
}

export async function askPublicCorpus(
  message: string,
  signal?: AbortSignal,
): Promise<{ answer: string; citations: PortfolioCitation[] }> {
  const response = await fetch(`${PORTFOLIO_API}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: message }),
    signal,
  });
  if (!response.ok) throw new Error('The public assistant is unavailable.');
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('The public assistant returned an invalid response.');
  const { answer, citations } = payload as { answer?: unknown; citations?: unknown };
  if (typeof answer !== 'string' || !Array.isArray(citations)) throw new Error('The public assistant returned an invalid response.');
  return { answer, citations: sanitizePortfolioCitations(citations) };
}

export async function submitPortfolioFeedback(
  turnId: string,
  rating: 'helpful' | 'needs_work',
): Promise<void> {
  const response = await fetch(`${PORTFOLIO_API}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ turnId, rating }),
  });
  if (!response.ok) throw new Error('Feedback could not be saved.');
}
