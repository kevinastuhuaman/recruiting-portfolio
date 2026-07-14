import { claimsById } from "./claims.js";
export { publicClaims } from "./claims.js";

const claim = (id) => {
  const record = claimsById[id];
  if (!record) throw new Error(`Unknown public claim: ${id}`);
  return record;
};

export const site = {
  origin: "https://portfolio.kevinastuhuaman.com",
  name: "Kevin Astuhuaman",
  title: "AI Product Manager | Ex-PayPal AI/ML Observability | Berkeley Haas MBA '26",
  location: "Bay Area, California",
  description:
    "Kevin Astuhuaman is an AI Product Manager, ex-PayPal in AI/ML observability, and Berkeley Haas MBA with seven years of experience building products.",
  email: "kevin.astuhuaman@berkeley.edu",
  updated: "2026-07-13",
  image: "/assets/kevin-portrait.webp",
  socialImage: "/assets/og-card.png",
};

export const links = {
  linkedin: "https://www.linkedin.com/in/kevinastuhuaman",
  github: "https://github.com/kevinastuhuaman",
  writing: "https://kevinastuhuaman.com/",
  trackly: "https://usetrackly.app/",
  appStore: "https://apps.apple.com/us/app/trackly-apply-first/id6758267565",
  tracklyCli: "https://github.com/trackly-app/trackly-cli",
  interfaceKit: "https://kevinastuhuaman.github.io/enterprise-ai-interface-kit/",
  interfaceKitRepo: "https://github.com/kevinastuhuaman/enterprise-ai-interface-kit",
  builderStack: "https://kevinastuhuaman.github.io/ai-product-builder-stack/",
  builderStackRepo: "https://github.com/kevinastuhuaman/ai-product-builder-stack",
  humanControlPlane: "https://kevinastuhuaman.github.io/human-in-the-loop-patterns/",
  humanControlPlaneRepo: "https://github.com/kevinastuhuaman/human-in-the-loop-patterns",
  motionStudies: "https://kevinastuhuaman.github.io/ai-product-motion-studies/",
  motionStudiesRepo: "https://github.com/kevinastuhuaman/ai-product-motion-studies",
  gpt56: "https://openai.com/index/gpt-5-6/",
  berkeleyMobagel:
    "https://haas.berkeley.edu/open-innovation/programs/past-challenges/",
  publicProfile:
    "https://facultad-ciencias-ingenieria.pucp.edu.pe/2024/10/07/kevin-astuhuaman-egresado-de-ingenieria-industrial-admitido-a-maestria-en-berkeley/",
};

export const labArtifacts = [
  {
    id: "investigation-workbench",
    name: "AI Investigation Workbench",
    live: "https://kevinastuhuaman.github.io/ai-investigation-workbench/",
    source: "https://github.com/kevinastuhuaman/ai-investigation-workbench",
    signal: "Bounded planning, evidence provenance, uncertainty, and accountable human review.",
    image: "/assets/workbench-review.png",
  },
  {
    id: "builder-stack",
    name: "AI Product Builder Stack",
    live: links.builderStack,
    source: links.builderStackRepo,
    signal: "65 verified tools and patterns across eight layers and four product flows.",
    image: "/assets/builder-stack-preview.png",
  },
  {
    id: "agent-workflow-canvas",
    name: "Agent Workflow Canvas",
    live: "https://kevinastuhuaman.github.io/agent-workflow-canvas/",
    source: "https://github.com/kevinastuhuaman/agent-workflow-canvas",
    signal: "Enterprise workflow state, approvals, traceability, and fail-closed recovery.",
    monogram: "AW",
  },
  {
    id: "evals-control-room",
    name: "Evals Control Room",
    live: "https://kevinastuhuaman.github.io/evals-control-room/",
    source: "https://github.com/kevinastuhuaman/evals-control-room",
    signal: "Regression triage, error slices, model tradeoffs, and promotion gates.",
    monogram: "EC",
  },
  {
    id: "human-control-plane",
    name: "Human Control Plane",
    live: links.humanControlPlane,
    source: links.humanControlPlaneRepo,
    signal: "Undo, confirmation, fresh approval, and an accountable owner.",
    image: "/assets/human-control-plane-preview.png",
  },
  {
    id: "motion-studies",
    name: "AI Product Motion Studies",
    live: links.motionStudies,
    source: links.motionStudiesRepo,
    signal: "Workflow structure, failure recovery, continuity, and reduced motion.",
    image: "/assets/motion-studies-preview.png",
  },
  {
    id: "enterprise-interface-kit",
    name: "Enterprise AI Interface Kit",
    live: links.interfaceKit,
    source: links.interfaceKitRepo,
    signal: "Provenance, confidence, permissions, approval, traces, recovery, and empty states.",
    image: "/assets/enterprise-ai-interface-kit-preview.png",
  },
];

export const routes = [
  { path: "/", state: "index", title: "Kevin Astuhuaman | AI Product Manager", modified: "2026-07-12" },
  { path: "/lab/", state: "index", title: "AI Product Lab | Kevin Astuhuaman", modified: "2026-07-13" },
  { path: "/projects/trackly/", state: "index", title: "Trackly case study | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/projects/paypal-ai-observability/", state: "index", title: "PayPal AI observability | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/projects/berkeley-mobagel-ai-gtm/", state: "index", title: "Berkeley and MoBagel AI product strategy | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/projects/smb-fintech-bcp-credicorp/", state: "index", title: "BCP and Credicorp product leadership | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/resume/", state: "index", title: "Resume | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/about/", state: "index", title: "About | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/proof/", state: "index", title: "Public evidence | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/contact/", state: "index", title: "Contact | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/ask/", state: "noindex", title: "Ask Kevin's portfolio | Kevin Astuhuaman", modified: "2026-07-13" },
  { path: "/privacy/", state: "index", title: "Privacy | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/packet/", state: "compat", title: "Recruiter brief", modified: "2026-07-12" },
  { path: "/projects/agentic-dev-workflows/", state: "compat", title: "AI-assisted product building", modified: "2026-07-12" },
  { path: "/llms.txt", state: "fetch", title: "LLM profile", modified: "2026-07-12" },
  { path: "/llms-full.txt", state: "fetch", title: "Full text profile", modified: "2026-07-12" },
  { path: "/profile.json", state: "fetch", title: "Structured profile", modified: "2026-07-12" },
  { path: "/projects.json", state: "fetch", title: "Structured projects", modified: "2026-07-12" },
  { path: "/resume.md", state: "fetch", title: "Markdown resume", modified: "2026-07-12" },
  { path: "/proof.json", state: "fetch", title: "Public evidence registry", modified: "2026-07-12" },
  { path: "/assistant-corpus.json", state: "fetch", title: "Public assistant corpus", modified: "2026-07-12" },
  { path: "/.well-known/agent-skills/index.json", state: "fetch", title: "Agent navigation index", modified: "2026-07-12" },
  { path: "/.well-known/agent-skills/site-navigation/SKILL.md", state: "fetch", title: "Agent navigation guide", modified: "2026-07-12" },
];

export const assistantCorpus = {
  schemaVersion: 1,
  entries: [
    {
      id: "overview",
      title: "Kevin Astuhuaman — AI Product Manager",
      url: `${site.origin}/`,
      keywords: ["about", "overview", "ai product manager", "technical product manager", "technical builder", "role", "fit", "hire"],
      content: "Kevin Astuhuaman is an AI Product Manager, ex-PayPal in AI/ML observability, and Berkeley Haas MBA in the Bay Area. His two recruiting lanes are applied AI and agent products, and AI platform or technical product management. His most recent enterprise AI proof is an agentic observability prototype at PayPal Checkout. Trackly proves hands-on product building across web, native apps, CLI, MCP, chat, and voice. Berkeley's Open Innovation Squad work with Fujitsu and MoBagel adds AI product strategy, high-fidelity prototyping, and go-to-market experience. His BCP experience shows six years of progression, regulated-product judgment, team leadership, and operating scale.",
    },
    {
      id: "lab-overview",
      title: "AI Product Lab",
      url: `${site.origin}/lab/`,
      keywords: ["lab", "ai product lab", "artifacts", "interactive artifacts", "experiments", "evals", "evals built", "evaluation", "product studies", "portfolio lab", "ai investigation workbench", "agent workflow canvas", "evals control room"],
      content: "Kevin's AI Product Lab collects seven public, interactive artifacts that make his product judgment inspectable: AI Investigation Workbench, AI Product Builder Stack, Agent Workflow Canvas, Evals Control Room, Human Control Plane, AI Product Motion Studies, and Enterprise AI Interface Kit. The collection covers enterprise AI interface patterns, agent workflows, evaluation design, human control, technical range, and motion. Every artifact uses synthetic or public-safe data and links to supporting decisions, structured files, tests, and source material where available.",
    },
    {
      id: "trackly",
      title: "Trackly case study",
      url: `${site.origin}/projects/trackly/`,
      keywords: ["trackly", "agent", "agents", "job search", "career pages", "scraping", "matching", "eval", "classification", "chat", "voice", "ios", "macos", "cli", "mcp", "builder", "computer use", "browser use", "browser agent", "human in the loop", "human-in-the-loop", "harness", "chrome", "ats"],
      content: `Kevin built Trackly during his MBA job search after seeing strong roles appear on company career pages before job boards. The live product monitors direct sources, normalizes and deduplicates jobs, applies freshness and false-zero guards, classifies job attributes, explains matches, and delivers the same product system through web, iOS, macOS, a public CLI, MCP, chat, and voice. ${claim("trackly-inventory").statement} Kevin also built a recent human-reviewed browser-agent harness: Trackly supplies a user-selected application queue and job context through its CLI and MCP; a domain-specific policy layer handles ATS mechanics, form integrity, and recovery; Codex controls Chrome to prepare forms; and the workflow pauses before submission for fresh, job-specific human approval. Subjective answers and consequential actions remain visible to the user, and any edit, navigation, reload, or reconnect invalidates prior approval. The transferable product pattern is useful when the final workflow lives in a browser instead of a reliable API, including recruiting, financial operations, sales portals, and CRM workflows. It is a recent working experiment, not a claim of fully autonomous application submission. Kevin owned the product problem, prioritization, quality thresholds, interaction decisions, release decisions, operation, and hands-on implementation. AI coding agents accelerated implementation and review but did not decide the product promise or release evidence.`,
    },
    {
      id: "enterprise-interface-kit",
      title: "Enterprise AI Interface Kit",
      url: `${site.origin}/lab/#enterprise-interface-kit`,
      keywords: ["enterprise ai interface", "enterprise ai interfaces", "enterprise ai ux", "product design", "design system", "provenance", "calibrated confidence", "permissions", "approval", "observable trace", "failure recovery", "empty state", "human in the loop", "human-in-the-loop", "ai trust", "operator workflow", "figma-level"],
      content: "Kevin published Enterprise AI Interface Kit, an original reference product that turns seven recurring enterprise AI questions into explicit interface contracts. One synthetic account-onboarding workflow connects evidence provenance, calibrated confidence, role-based permission boundaries, approval bound to an exact state, observable run events without private reasoning, scoped failure recovery, and an honest no-evidence state. Reviewers can switch across five operational states and four user roles while the evidence, authority, approval, recovery path, and next action update together. The artifact publishes responsive Playwright and Axe accessibility checks, decision records, patterns.json, project.json, llms.txt, a public IP boundary, and source code. All companies, people, policies, and records are fictional. It is product-design evidence, not employer work, production authorization logic, or a disclosure of Trackly internals.",
    },
    {
      id: "builder-stack",
      title: "AI Product Builder Stack",
      url: `${site.origin}/lab/#builder-stack`,
      keywords: ["ai product builder stack", "technical stack", "tools", "cloud", "cloud tooling", "infrastructure", "deployment", "devops", "ci/cd", "continuous integration", "azure", "aws", "terraform", "observability", "analytics", "langfuse", "posthog", "browser automation", "voice", "figma", "remotion", "technical fluency"],
      content: `${claim("builder-stack-public").statement} Representative entries include OpenAI and Codex, Anthropic Claude, Amazon Bedrock, Azure OpenAI, PostgreSQL, Azure AI Search, Terraform, Docker, GitHub Actions, Langfuse, PostHog, Umami, Gatus, Application Insights, Playwright, Puppeteer, Conductor, CodeRabbit, SwiftUI, Figma, Remotion, WebRTC, and Whisper. The map separately labels shipped work, active systems, prototypes such as Exa, Tavily, Parallel, and LlamaIndex experiments, and historical platforms such as AWS Lightsail and RDS after the Azure cutover. Each entry names the product outcome, implementation or operating evidence, project context, and a reference link. Four flows show how the tools combine in Trackly discovery, a human-reviewed browser agent, real-time voice onboarding, and conversation-to-follow-up. The artifact excludes credentials, user data, private topology, and employer intellectual property. Structured versions are published as stack.json and llms.txt.`,
    },
    {
      id: "human-control-plane",
      title: "Human Control Plane",
      url: `${site.origin}/lab/#human-control-plane`,
      keywords: ["human in the loop", "human-in-the-loop", "approval", "undo", "agent safety", "ai governance", "consequence", "reversibility", "model uncertainty", "intent freshness", "product design", "enterprise ai"],
      content: "Kevin published Human Control Plane, an original interactive product study for choosing human oversight patterns in consequential AI systems. Users can change consequence, reversibility, model uncertainty, and intent freshness; one deterministic policy model then recommends auto-execute with Undo, preview and confirm, preview with fresh approval, or accountable approval. Four synthetic scenarios make the tradeoffs concrete: a bounded customer refund, CRM enrichment, a human-reviewed job application, and a privileged access change. The interface demonstrates approval bound to committed state, automatic invalidation after an input change, explicit ownership, recovery design, and an audit record containing policy inputs, owner, action, and outcome rather than private chain-of-thought. The public repository contains decision records, responsive interaction tests, Axe accessibility checks, an IP boundary, project.json, and llms.txt. It is a product-design artifact, not a production authorization framework or a disclosure of Trackly internals.",
    },
    {
      id: "motion-studies",
      title: "AI Product Motion Studies",
      url: `${site.origin}/lab/#motion-studies`,
      keywords: ["motion design", "interaction design", "product design", "design taste", "workflow", "recovery", "failure state", "cross-platform", "cross-surface", "reduced motion", "accessibility", "enterprise ai", "figma-level"],
      content: "Kevin published AI Product Motion Studies, three original interactive studies that use motion to explain product state rather than decorate it. Across 13 manually inspectable states, the studies show a recording becoming an editable workflow, a failed AI run moving through accountable review and recovery, and one normalized product object adapting across web, macOS, mobile, and CLI or MCP surfaces. Each sequence starts paused, supports direct state selection and reduced motion, keeps visually hidden future states out of the accessibility tree, and publishes the timing and state model as motion-spec.json. The repository includes responsive Playwright tests, Axe checks, decision records, project.json, llms.txt, and synthetic data only. This is public proof of interaction design judgment and implementation detail, not employer work or a disclosure of Trackly production code.",
    },
    {
      id: "paypal",
      title: "PayPal AI observability case study",
      url: `${site.origin}/projects/paypal-ai-observability/`,
      keywords: ["paypal", "checkout", "observability", "diagnostics", "enterprise ai", "internship", "datadog", "triage", "detection"],
      content: `Kevin was a Technical Product Manager MBA Intern on PayPal Checkout from May through August 2025. ${claim("paypal-discovery").statement} ${claim("paypal-detection").statement} ${claim("paypal-triage").statement} These are internship prototype and POC results, not PayPal-wide production claims. The portfolio demonstrates the product decisions through an original synthetic AI Investigation Workbench, not through PayPal data, screenshots, source code, prompts, system names, or internal architecture.`,
    },
    {
      id: "mobagel",
      title: "Berkeley and MoBagel AI product strategy",
      url: `${site.origin}/projects/berkeley-mobagel-ai-gtm/`,
      keywords: ["berkeley", "haas", "mobagel", "mo bagel", "fujitsu", "open innovation", "figma", "prototype", "go to market", "gtm", "pricing", "roadmap", "ai product strategy"],
      content: `Through Berkeley Haas's Open Innovation Squad, Kevin worked on the Fujitsu and MoBagel challenge from December 2024 through May 2025. His public resume describes product discovery, competitive research, feature and UX concepts, a high-fidelity Figma prototype, roadmap and business-model work, and recommendations for United States go-to-market, partnerships, and usage-based pricing. ${claim("berkeley-mobagel-brief").statement} MoBagel is described as an AI and machine-learning platform that helps businesses adopt AI. No funding, customer, or production claims are inferred from the official program listing.`,
    },
    {
      id: "bcp",
      title: "BCP and Credicorp product leadership case study",
      url: `${site.origin}/projects/smb-fintech-bcp-credicorp/`,
      keywords: ["bcp", "credicorp", "fintech", "bank", "smb", "lending", "digital channels", "leadership", "team", "teams", "managed", "reports", "risk", "compliance", "growth", "180k", "180k users", "monthly users"],
      content: `From 2018 through 2024, Kevin progressed from Product Analyst to Product Manager, Senior Product Manager, and Lead Product Manager at Banco de Credito BCP, part of Credicorp. ${claim("bcp-access").statement} ${claim("bcp-loans").statement} ${claim("bcp-digital-growth").statement} The 180K figure is monthly website traffic, not monthly users. ${claim("bcp-market-share").statement} ${claim("bcp-team").statement}`,
    },
    {
      id: "resume",
      title: "Kevin Astuhuaman resume",
      url: `${site.origin}/resume/`,
      keywords: ["resume", "experience", "education", "berkeley haas", "haas", "berkeley", "mba", "skills", "career", "background", "mo bagel", "summit", "tech and ai summit", "tech ai summit", "560 registrations"],
      content: `Kevin earned a STEM-designated MBA from the University of California, Berkeley, Haas School of Business in May 2026 and a Bachelor of Science in Industrial Engineering from the Pontifical Catholic University of Peru in July 2018. At Haas, he built Trackly, worked with Berkeley's Open Innovation Squad on the Fujitsu and MoBagel AI product challenge, and served as VP of the Tech Club. ${claim("berkeley-tech-ai-summit").statement}`,
    },
    {
      id: "contact",
      title: "Contact Kevin Astuhuaman",
      url: `${site.origin}/contact/`,
      keywords: ["contact", "email", "linkedin", "reach", "interview", "recruiter"],
      content: "The preferred contact path is LinkedIn at https://www.linkedin.com/in/kevinastuhuaman. Kevin's public recruiting email is kevin.astuhuaman@berkeley.edu. Recruiters should include the role, the product problem, and what the person needs to own.",
    },
  ],
};

export const experience = [
  {
    organization: "PayPal Checkout",
    role: "Technical Product Manager MBA Intern",
    dates: "May-August 2025",
    location: "Chicago, Illinois",
    summary: "Defined and prototyped an AI-assisted observability workflow for checkout diagnostics.",
    bullets: [
      claim("paypal-detection").statement,
      claim("paypal-triage").statement,
    ],
  },
  {
    organization: "Trackly",
    role: "AI Product Manager and builder",
    dates: "2025-present",
    location: "Bay Area",
    summary: "Built and operates a real-time job-search product across web, native apps, CLI, MCP, matching, chat, and voice.",
    bullets: [
      "Chose direct company career pages as the wedge after seeing strong roles appear before aggregators during the MBA recruiting cycle.",
      "Designed quality controls for stale jobs, duplicate roles, false-zero monitoring failures, classification, and match explanations.",
      "Shipped one product system across web, iOS, macOS, a public CLI, and an MCP server.",
      "Built a human-reviewed browser-agent harness that combines Trackly MCP context, ATS-specific form rules, Chrome computer use, and a fresh approval gate before submission.",
    ],
  },
  {
    organization: "UC Berkeley Haas Open Innovation Squad",
    role: "AI Product Manager, Fujitsu and MoBagel challenge",
    dates: "December 2024-May 2025",
    location: "Berkeley, California",
    summary: "Worked on AI product adoption, a high-fidelity Figma prototype, roadmap, business model, and United States go-to-market recommendations for MoBagel.",
    bullets: [
      "Conducted product and competitive research around how non-technical business users adopt AI and machine-learning workflows.",
      "Contributed feature and UX concepts, a high-fidelity Figma prototype, and a roadmap linking user needs to product capabilities.",
      "Recommended go-to-market positioning, partnership channels, and usage-based pricing for United States expansion.",
    ],
  },
  {
    organization: "Banco de Credito BCP (part of Credicorp)",
    role: "Product Analyst -> Product Manager -> Senior Product Manager -> Lead Product Manager",
    dates: "2018-2024",
    location: "Lima, Peru",
    summary: "Progression: Lead Product Manager (1 year), Senior Product Manager (1.5 years), Product Manager (1.5 years), Product Analyst (2 years).",
    bullets: [
      claim("bcp-access").statement,
      claim("bcp-loans").statement,
      claim("bcp-digital-growth").statement,
      claim("bcp-team").statement,
      claim("bcp-market-share").statement,
    ],
  },
];

export const projects = [
  {
    id: "paypal",
    name: "PayPal AI observability",
    eyebrow: "Recent enterprise AI",
    href: "/projects/paypal-ai-observability/",
    thesis: "An agentic observability prototype that turned fragmented checkout diagnostics into one evidence-backed investigation path.",
    proof: "Internship prototype | AI + MCP | 15+ diagnostic tools",
  },
  {
    id: "trackly",
    name: "Trackly",
    eyebrow: "Hands-on builder proof",
    href: "/projects/trackly/",
    thesis: "A job-search system built around direct career-page signal, explainable matching, and dependable delivery across human and agent interfaces.",
    proof: "Live product | Web, iOS, macOS, CLI, MCP",
    image: "/assets/trackly-home.webp",
  },
  {
    id: "mobagel",
    name: "Berkeley x MoBagel",
    eyebrow: "AI product strategy and GTM",
    href: "/projects/berkeley-mobagel-ai-gtm/",
    thesis: "Product discovery, high-fidelity prototyping, roadmap, business model, and United States go-to-market recommendations for an AI platform.",
    proof: "Berkeley challenge | Figma prototype | GTM",
  },
  {
    id: "bcp",
    name: "BCP small-business products",
    eyebrow: "Product leadership at scale",
    href: "/projects/smb-fintech-bcp-credicorp/",
    thesis: "Six years of progression across lending, digital channels, growth, and product leadership in a regulated financial institution.",
    proof: "Production products | 9 direct reports",
  },
];

export const nav = [
  { label: "Work", href: "/#work" },
  { label: "Experience", href: "/#experience" },
  { label: "Lab", href: "/lab/" },
  { label: "Ask", href: "/ask/" },
  { label: "Resume", href: "/resume/" },
  { label: "Contact", href: "/contact/" },
];
