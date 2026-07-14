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
  return response.json();
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
