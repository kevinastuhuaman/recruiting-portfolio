export const PORTFOLIO_API = 'https://closeai.mba/api/portfolio';

export type PortfolioCitation = { id?: string; title: string; url: string };

export async function askPublicCorpus(
  message: string,
  signal?: AbortSignal,
): Promise<{ answer: string; citations: PortfolioCitation[] }> {
  const response = await fetch(`${PORTFOLIO_API}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal,
  });
  if (!response.ok) throw new Error('The public assistant is unavailable.');
  return response.json();
}
