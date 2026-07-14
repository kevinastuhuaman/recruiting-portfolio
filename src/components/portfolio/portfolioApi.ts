export const PORTFOLIO_API = 'https://api.portfolio.kevinastuhuaman.com/api/portfolio';

export type PortfolioCitation = { id?: string; title: string; url: string };

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
  const validCitations = citations.every((citation) => {
    if (!citation || typeof citation !== 'object' || Array.isArray(citation)) return false;
    const item = citation as { id?: unknown; title?: unknown; url?: unknown };
    return (item.id === undefined || typeof item.id === 'string') && typeof item.title === 'string' && typeof item.url === 'string';
  });
  if (!validCitations) throw new Error('The public assistant returned an invalid response.');
  return { answer, citations: citations as PortfolioCitation[] };
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
