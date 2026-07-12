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
- Trackly case study: ${absolute("/projects/trackly/")}
- PayPal AI observability case study: ${absolute("/projects/paypal-ai-observability/")}
- BCP and Credicorp case study: ${absolute("/projects/smb-fintech-bcp-credicorp/")}
- Contact: ${absolute("/contact/")}

## Machine-readable context

- LLM profile: ${absolute("/llms.txt")}
- Full text profile: ${absolute("/llms-full.txt")}
- Structured profile: ${absolute("/profile.json")}
- Public evidence registry: ${absolute("/proof.json")}
- Structured projects: ${absolute("/projects.json")}
- Public assistant corpus: ${absolute("/assistant-corpus.json")}

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

> AI Product Manager and technical builder focused on applied AI, agents, platforms, and technical products.

Kevin built Trackly, a live job-search product spanning web, iOS, macOS, CLI, MCP, matching, chat, and voice. He previously built a public-safe AI observability prototype at PayPal Checkout and progressed through four product roles at BCP/Credicorp.

## Primary pages

- [Portfolio](${absolute("/")}): Kevin's recruiting profile and selected work
- [Trackly case study](${absolute("/projects/trackly/")}): Product decisions, system quality, and cross-platform delivery
- [Resume](${absolute("/resume/")}): Complete chronological experience
- [Public evidence](${absolute("/proof/")}): Sources and context for published claims
- [Contact](${absolute("/contact/")}): LinkedIn and email
- [Ask Kevin's portfolio](${absolute("/ask/")}): Public-corpus assistant with static cited answers

## Machine-readable context

- [Full plain-text profile](${absolute("/llms-full.txt")}): Detailed public recruiting context
- [Structured profile](${absolute("/profile.json")}): Public identity, experience, and claims
- [Structured projects](${absolute("/projects.json")}): Project summaries and canonical links
- [Markdown resume](${absolute("/resume.md")}): Crawlable resume equivalent
`;

const fullText = `# Kevin Astuhuaman

Last updated: ${site.updated}

## Positioning

Kevin Astuhuaman is an AI Product Manager and technical builder in the Bay Area. His two recruiting lanes are applied AI and agent products, and AI platform or technical product management.

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
`;

const resumeMarkdown = `# Kevin Astuhuaman

AI Product Manager and technical builder | ${site.location}

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

- Trackly: ${links.trackly}
- Trackly App Store: ${links.appStore}
- Trackly CLI and MCP: ${links.tracklyCli}
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
