import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { assistantCorpus, experience, links, projects, publicClaims, routes, site } from "../src/data/site.js";

const publicDir = new URL("../site-public/", import.meta.url);
await mkdir(publicDir, { recursive: true });

const indexRoutes = routes.filter((route) => route.state === "index");
const absolute = (path) => new URL(path, site.origin).href;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexRoutes
  .map(
    (route) => `  <url>
    <loc>${absolute(route.path)}</loc>
    <lastmod>${route.modified}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

const robots = `# Search indexing and user-requested AI retrieval are welcome.
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

# Kevin permits search and user-requested retrieval, but not model training.
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: meta-externalagent
Disallow: /

User-agent: *
Allow: /

Content-Signal: ai-train=no, search=yes, ai-input=yes
Sitemap: ${absolute("/sitemap.xml")}
`;

const profile = {
  lastUpdated: site.updated,
  canonicalUrl: `${site.origin}/`,
  name: site.name,
  headline: site.title,
  location: site.location,
  summary: site.description,
  recruitingLanes: ["Applied AI and agent products", "AI platform and technical product management"],
  experience: experience.map(({ organization, role, dates, summary }) => ({ organization, role, dates, summary })),
  publicClaims,
  links: {
    portfolio: `${site.origin}/`,
    resume: `${site.origin}/resume/`,
    linkedin: links.linkedin,
    github: links.github,
    writing: links.writing,
    trackly: links.trackly,
    builderStack: links.builderStack,
    builderStackSource: links.builderStackRepo,
  },
};

const projectJson = {
  lastUpdated: site.updated,
  projects: projects.map(({ name, eyebrow, href, thesis, proof }) => ({
    name,
    category: eyebrow,
    url: absolute(href),
    summary: thesis,
    proof,
  })),
};

const proofRegistry = {
  schemaVersion: 1,
  lastUpdated: site.updated,
  canonicalUrl: absolute("/proof/"),
  claims: publicClaims.map(({ id, statement, source, checked, state, context }) => ({
    id,
    statement,
    source: absolute(source),
    checked,
    state,
    context,
  })),
};

const navigationSkill = `---
name: kevin-astuhuaman-site-navigation
description: Navigate Kevin Astuhuaman's public recruiting portfolio and retrieve public-safe profile, resume, project, evidence, and contact information.
---

# Kevin Astuhuaman Portfolio Navigation

Use this guide for public-safe recruiting, referral, interview preparation, or candidate-fit context.

## Canonical pages

- Home: ${absolute("/")}
- Resume: ${absolute("/resume/")}
- Public evidence: ${absolute("/proof/")}
- PayPal AI observability case study: ${absolute("/projects/paypal-ai-observability/")}
- Trackly case study: ${absolute("/projects/trackly/")}
- Berkeley and MoBagel AI product strategy case study: ${absolute("/projects/berkeley-mobagel-ai-gtm/")}
- BCP and Credicorp case study: ${absolute("/projects/smb-fintech-bcp-credicorp/")}
- AI Product Builder Stack: ${links.builderStack}
- AI Product Builder Stack source: ${links.builderStackRepo}
- Contact: ${absolute("/contact/")}

## Machine-readable context

- LLM profile: ${absolute("/llms.txt")}
- Full text profile: ${absolute("/llms-full.txt")}
- Structured profile: ${absolute("/profile.json")}
- Public evidence registry: ${absolute("/proof.json")}
- Structured projects: ${absolute("/projects.json")}
- Public assistant corpus: ${absolute("/assistant-corpus.json")}
- Builder Stack structured data: ${links.builderStack}stack.json
- Builder Stack LLM context: ${links.builderStack}llms.txt

## Boundaries

- Treat employer outcomes as Kevin's public resume claims unless the source is independently hosted.
- Do not infer confidential employer details or private user data.
- Prefer dated claims and their stated scope.
- Do not impersonate Kevin or represent Trackly as an employer partnership.
`;

const skillDigest = createHash("sha256").update(navigationSkill).digest("hex");
const skillIndex = {
  skills: [
    {
      name: "site-navigation",
      type: "skill-md",
      description: "Navigate Kevin Astuhuaman's public recruiting portfolio and machine-readable evidence.",
      url: "/.well-known/agent-skills/site-navigation/SKILL.md",
      digest: `sha256:${skillDigest}`,
    },
  ],
};

const llms = `# Kevin Astuhuaman

> AI Product Manager | Ex-PayPal AI/ML Observability | Berkeley Haas MBA '26 | 7 years building products and enjoying every minute of it.

Kevin's most recent enterprise AI proof is an agentic observability prototype at PayPal Checkout. He also built Trackly, a live job-search product spanning web, iOS, macOS, CLI, MCP, matching, chat, and voice. At Berkeley Haas, he worked on the Fujitsu and MoBagel Open Innovation challenge across AI product strategy, high-fidelity prototyping, roadmap, business model, and go-to-market recommendations. He previously progressed through four product roles at Banco de Credito BCP, part of Credicorp.

## Primary pages

- [Portfolio](${absolute("/")}): Kevin's recruiting profile and selected work
- [PayPal AI observability case study](${absolute("/projects/paypal-ai-observability/")}): Agentic investigation, product decisions, prototype outcomes, and public-safety boundaries
- [Trackly case study](${absolute("/projects/trackly/")}): Product decisions, system quality, and cross-platform delivery
- [Berkeley and MoBagel case study](${absolute("/projects/berkeley-mobagel-ai-gtm/")}): AI product adoption, high-fidelity prototyping, roadmap, business model, and GTM
- [AI Product Builder Stack](${links.builderStack}): 65 verified tools and product patterns organized by outcome, evidence, project, and lifecycle state
- [Resume](${absolute("/resume/")}): Complete chronological experience
- [Public evidence](${absolute("/proof/")}): Sources and context for published claims
- [Contact](${absolute("/contact/")}): LinkedIn and email
- [Ask Kevin's portfolio](${absolute("/ask/")}): Public-corpus assistant with static cited answers

## Machine-readable context

- [Full plain-text profile](${absolute("/llms-full.txt")}): Detailed public recruiting context
- [Structured profile](${absolute("/profile.json")}): Public identity, experience, and claims
- [Structured projects](${absolute("/projects.json")}): Project summaries and canonical links
- [Public assistant corpus](${absolute("/assistant-corpus.json")}): Pre-approved recruiter questions, answers, and citations
- [Builder Stack structured data](${links.builderStack}stack.json): Machine-readable technical range and implementation evidence
- [Builder Stack LLM context](${links.builderStack}llms.txt): Plain-text map of tools, systems, and lifecycle states
- [Markdown resume](${absolute("/resume.md")}): Crawlable resume equivalent
`;

const fullText = `# Kevin Astuhuaman

Last updated: ${site.updated}

## Positioning

Kevin Astuhuaman is an AI Product Manager, ex-PayPal in AI/ML observability, and Berkeley Haas MBA in the Bay Area. He has seven years of product experience. His two recruiting lanes are applied AI and agent products, and AI platform or technical product management.

## Experience

${experience
  .map(
    (item) => `### ${item.organization}\n\n${item.role} | ${item.dates}\n\n${item.summary}\n\n${item.bullets.map((bullet) => `- ${bullet}`).join("\n")}`,
  )
  .join("\n\n")}

## Selected work

${projects.map((project) => `- [${project.name}](${absolute(project.href)}): ${project.thesis}`).join("\n")}

## Public evidence

${publicClaims.map((claim) => `- ${claim.statement} Context: ${claim.context} Source: ${absolute(claim.source)}`).join("\n")}

## Public profiles

- LinkedIn: ${links.linkedin}
- GitHub: ${links.github}
- Writing: ${links.writing}
- Trackly: ${links.trackly}
- AI Product Builder Stack: ${links.builderStack}
- AI Product Builder Stack source: ${links.builderStackRepo}
`;

const resumeMarkdown = `# Kevin Astuhuaman

AI Product Manager | Ex-PayPal AI/ML Observability | Berkeley Haas MBA '26 | ${site.location}

LinkedIn: ${links.linkedin} | GitHub: ${links.github} | Portfolio: ${site.origin}

## Experience

${experience
  .map(
    (item) => `### ${item.organization}\n\n**${item.role}** | ${item.dates} | ${item.location}\n\n${item.summary}\n\n${item.bullets.map((bullet) => `- ${bullet}`).join("\n")}`,
  )
  .join("\n\n")}

## Education

- University of California, Berkeley, Haas School of Business, MBA, May 2026
- Pontifical Catholic University of Peru, BS Industrial Engineering, July 2018

## Selected product

- PayPal public-safe case: ${absolute("/projects/paypal-ai-observability/")}
- Trackly: ${links.trackly}
- Trackly App Store: ${links.appStore}
- Trackly CLI and MCP: ${links.tracklyCli}
- AI Product Builder Stack: ${links.builderStack}
- Berkeley and MoBagel public-safe case: ${absolute("/projects/berkeley-mobagel-ai-gtm/")}
`;

await Promise.all([
  writeFile(new URL("sitemap.xml", publicDir), sitemap),
  writeFile(new URL("robots.txt", publicDir), robots),
  writeFile(new URL("profile.json", publicDir), `${JSON.stringify(profile, null, 2)}\n`),
  writeFile(new URL("projects.json", publicDir), `${JSON.stringify(projectJson, null, 2)}\n`),
  writeFile(new URL("proof.json", publicDir), `${JSON.stringify(proofRegistry, null, 2)}\n`),
  writeFile(new URL("assistant-corpus.json", publicDir), `${JSON.stringify(assistantCorpus, null, 2)}\n`),
  writeFile(new URL("llms.txt", publicDir), llms),
  writeFile(new URL("llms-full.txt", publicDir), fullText),
  writeFile(new URL("resume.md", publicDir), resumeMarkdown),
  mkdir(new URL(".well-known/agent-skills/site-navigation/", publicDir), { recursive: true }).then(() =>
    Promise.all([
      writeFile(new URL(".well-known/agent-skills/index.json", publicDir), `${JSON.stringify(skillIndex, null, 2)}\n`),
      writeFile(new URL(".well-known/agent-skills/site-navigation/SKILL.md", publicDir), navigationSkill),
    ]),
  ),
]);
