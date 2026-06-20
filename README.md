# Recruiting Portfolio

Static recruiting portfolio for Kevin Astuhuaman.

## Live Site

- Production/test URL: `https://portfolio.kevinastuhuaman.com`
- Hosting: GitHub Pages from this public repo
- Cost: $0/month while the repo remains public

## Domain Guardrail

- `portfolio.kevinastuhuaman.com` is the new recruiting portfolio.
- `ai.kevinastuhuaman.com` is Kevin's existing Framer site and should not be changed by this repo.
- Do not add `ai.kevinastuhuaman.com` to `public/CNAME`.
- Do not redirect `ai.kevinastuhuaman.com` traffic to this site unless Kevin explicitly asks.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Public Surfaces

- `/`: human recruiting portfolio
- `/packet/`: one-page recruiter packet
- `/resume/`: recruiter-readable resume
- `/proof/`: claim and evidence registry
- `/llms.txt`: concise plain-text profile
- `/llms-full.txt`: full plain-text profile
- `/profile.json`: structured profile data
- `/.well-known/agent-skills/index.json`: site navigation metadata for AI tools
