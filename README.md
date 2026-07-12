# Recruiting Portfolio

Static recruiting portfolio for Kevin Astuhuaman.

## Live Site

- Production/test URL: `https://portfolio.kevinastuhuaman.com`
- Hosting: GitHub Pages from this public repo
- Cost: $0/month while the repo remains public

## Domain Guardrail

- `portfolio.kevinastuhuaman.com` is the new recruiting portfolio.
- `ai.kevinastuhuaman.com` is Kevin's existing Framer site and should not be changed by this repo.
- Do not add `ai.kevinastuhuaman.com` to `site-public/CNAME`.
- Do not redirect `ai.kevinastuhuaman.com` traffic to this site unless Kevin explicitly asks.

## Local Development

```bash
npm install
npx playwright install chromium
npm run dev
```

## Build

```bash
npm run build
```

## Public Surfaces

- `/`: human recruiting portfolio
- `/projects/trackly/`: flagship product case study
- `/projects/paypal-ai-observability/`: public-safe enterprise AI case study
- `/projects/smb-fintech-bcp-credicorp/`: product leadership case study
- `/resume/`: recruiter-readable resume
- `/proof/` and `/proof.json`: contextual evidence ledger and machine registry
- `/ask/`: public-corpus recruiter assistant; the API returns only approved source text
- `/llms.txt`: concise plain-text profile
- `/llms-full.txt`: full plain-text profile
- `/profile.json`: structured profile data
- `/projects.json`: structured project data
- `/assistant-corpus.json`: exact public answer corpus for drift verification
- `/2e43f7d61916408ea525527e4bc9b5c7.txt`: public IndexNow ownership key
- `/.well-known/agent-skills/index.json`: site navigation metadata for AI tools

The former `/packet/` and `/projects/agentic-dev-workflows/` URLs remain as `noindex` compatibility pages. They direct old bookmarks to the maintained resume and Trackly evidence without creating duplicate search targets.

## Public Boundary

`site-public/` is the only static input copied by Astro. `npm run build` regenerates every machine-readable artifact, builds the site and tagged resume PDF, then fails if excluded internal terms or undeclared routes appear in `dist/`.

The assistant API is hosted separately at `https://closeai.mba/api/portfolio/ask`. Its launch corpus is deterministic and mirrored in `/assistant-corpus.json`; it does not query Trackly user data or invoke an LLM.

The client sends cookieless page and command events directly to PostHog, honors Global Privacy Control and Do Not Track, and never includes assistant question text. The public contract is documented at `/privacy/`.

After a production deploy, `npm run indexnow` submits every canonical HTML route to IndexNow. The command is deliberately separate from builds so previews and pull requests cannot publish indexing signals.
