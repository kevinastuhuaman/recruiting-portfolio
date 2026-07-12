export const site = {
  origin: "https://portfolio.kevinastuhuaman.com",
  name: "Kevin Astuhuaman",
  title: "AI Product Manager and technical builder",
  location: "Bay Area, California",
  description:
    "Kevin Astuhuaman builds applied AI and technical products, from Trackly's job-search agents to enterprise observability and regulated fintech.",
  email: "kevin.astuhuaman@berkeley.edu",
  updated: "2026-07-12",
  image: "/assets/kevin-portrait.webp",
  socialImage: "/assets/og-card.png",
};

export const links = {
  linkedin: "https://www.linkedin.com/in/kevinastuhuaman",
  github: "https://github.com/kevinastuhuaman",
  writing: "https://kevinastuhuaman.com/",
  trackly: "https://usetrackly.app",
  appStore: "https://apps.apple.com/us/app/trackly-apply-first/id6758267565",
  tracklyCli: "https://github.com/trackly-app/trackly-cli",
  publicProfile:
    "https://facultad-ciencias-ingenieria.pucp.edu.pe/2024/10/07/kevin-astuhuaman-egresado-de-ingenieria-industrial-admitido-a-maestria-en-berkeley/",
};

export const routes = [
  { path: "/", state: "index", title: "Kevin Astuhuaman | AI Product Manager", modified: "2026-07-12" },
  { path: "/projects/trackly/", state: "index", title: "Trackly case study | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/projects/paypal-ai-observability/", state: "index", title: "PayPal AI observability | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/projects/smb-fintech-bcp-credicorp/", state: "index", title: "BCP and Credicorp product leadership | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/resume/", state: "index", title: "Resume | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/about/", state: "index", title: "About | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/proof/", state: "index", title: "Public evidence | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/contact/", state: "index", title: "Contact | Kevin Astuhuaman", modified: "2026-07-12" },
  { path: "/ask/", state: "index", title: "Ask Kevin's portfolio | Kevin Astuhuaman", modified: "2026-07-12" },
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

export const publicClaims = [
  {
    id: "trackly-inventory",
    statement: "Trackly monitored 1,969 company career sites across 40 ATS and source types, with 128,975 job records in its public inventory on July 12, 2026.",
    short: "1,969 company career sites across 40 source types",
    source: links.trackly,
    checked: "2026-07-12",
    state: "live public product",
    context: "Dated inventory, not a user-adoption claim.",
  },
  {
    id: "trackly-app-store",
    statement: "Trackly is available publicly on Apple's App Store.",
    short: "Trackly on the App Store",
    source: links.appStore,
    checked: "2026-07-12",
    state: "public artifact",
    context: "Public distribution artifact for the native product.",
  },
  {
    id: "paypal-detection",
    statement: "A PayPal Checkout internship prototype reduced issue-detection time by 75% in the project workflow across a diagnostic environment spanning 15+ tools.",
    short: "75% faster issue detection in the internship prototype workflow",
    source: "/projects/paypal-ai-observability/",
    checked: "2026-07-12",
    state: "public-safe resume claim",
    context: "Prototype-workflow result, not a PayPal-wide production claim.",
  },
  {
    id: "bcp-marketplace",
    statement: "At BCP/Credicorp, Kevin launched and scaled an SMB digital marketplace to 180K monthly active users and increased product cross-sell per client by 28%.",
    short: "180K MAU and 28% higher cross-sell",
    source: "/projects/smb-fintech-bcp-credicorp/",
    checked: "2026-07-12",
    state: "public resume claim",
    context: "Production SMB marketplace outcome.",
  },
  {
    id: "bcp-loans",
    statement: "Kevin led a personalized loan product that reduced processing from seven days to immediate approval and generated $40M in nine months.",
    short: "Seven days to immediate approval; $40M in nine months",
    source: "/projects/smb-fintech-bcp-credicorp/",
    checked: "2026-07-12",
    state: "public resume claim",
    context: "Production lending outcome.",
  },
  {
    id: "trackly-cli-mcp",
    statement: "Trackly ships a public command-line interface and Model Context Protocol server.",
    short: "Public CLI and MCP server",
    source: links.tracklyCli,
    checked: "2026-07-12",
    state: "public source repository",
    context: "Public technical distribution artifact; separate from the App Store listing.",
  },
];

export const assistantCorpus = {
  schemaVersion: 1,
  entries: [
    {
      id: "overview",
      title: "Kevin Astuhuaman portfolio",
      url: `${site.origin}/`,
      keywords: ["about", "overview", "ai product manager", "technical product manager", "technical builder", "role", "fit", "hire"],
      content: "Kevin Astuhuaman is an AI Product Manager and technical builder in the Bay Area. His two recruiting lanes are applied AI and agent products, and AI platform or technical product management. Trackly is his flagship product proof. PayPal Checkout is his enterprise AI observability proof. BCP and Credicorp show six years of progression, regulated-product judgment, team leadership, and operating scale.",
    },
    {
      id: "trackly",
      title: "Trackly case study",
      url: `${site.origin}/projects/trackly/`,
      keywords: ["trackly", "agent", "agents", "job search", "career pages", "scraping", "matching", "eval", "classification", "chat", "voice", "ios", "macos", "cli", "mcp", "builder"],
      content: "Kevin founded and built Trackly after seeing strong roles appear on company career pages before job boards. The live product monitors direct sources, normalizes and deduplicates jobs, applies freshness and false-zero guards, classifies job attributes, explains matches, and delivers the same product system through web, iOS, macOS, a public CLI, MCP, chat, and voice. On July 12, 2026, Trackly's public inventory showed 1,969 monitored company career sites, 40 ATS and source types, and 128,975 job records. Kevin owned the product problem, prioritization, quality thresholds, interaction decisions, release decisions, operation, and hands-on implementation. AI coding agents accelerated implementation and review but did not decide the product promise or release evidence.",
    },
    {
      id: "paypal",
      title: "PayPal AI observability case study",
      url: `${site.origin}/projects/paypal-ai-observability/`,
      keywords: ["paypal", "checkout", "observability", "diagnostics", "enterprise ai", "internship", "datadog", "triage", "detection"],
      content: "Kevin was a Technical Product Manager MBA Intern on PayPal Checkout from May through August 2025. He defined and prototyped an AI-assisted observability workflow that unified the investigation path across 15 or more diagnostic tools. The internship prototype reduced issue-detection time by 75 percent in the project workflow. An auto-triage proof of concept completed triage five times faster. These are internship prototype and POC results, not PayPal-wide production claims. The public case contains no internal screenshots, logs, merchant data, confidential system names, or internal architecture.",
    },
    {
      id: "bcp",
      title: "BCP and Credicorp product leadership case study",
      url: `${site.origin}/projects/smb-fintech-bcp-credicorp/`,
      keywords: ["bcp", "credicorp", "fintech", "bank", "smb", "lending", "marketplace", "pricing", "leadership", "team", "teams", "managed", "reports", "risk", "compliance", "growth"],
      content: "From 2018 through 2024, Kevin progressed from Product Analyst to Product Manager, Senior Product Manager, and Lead Product Manager at Banco de Credito del Peru and Credicorp. He launched and scaled an SMB digital marketplace to 180,000 monthly active users and increased product cross-sell per client by 28 percent. He led a personalized loan product from research through launch, reducing processing from seven days to immediate approval and generating 40 million dollars in nine months. He used ML-driven pricing experiments to increase conversion by 32 percent and reach 19.6 percent market share in seven months. As Lead Product Manager, he managed nine product direct reports and worked across risk, compliance, engineering, design, analytics, and commercial teams.",
    },
    {
      id: "resume",
      title: "Kevin Astuhuaman resume",
      url: `${site.origin}/resume/`,
      keywords: ["resume", "experience", "education", "haas", "berkeley", "mba", "skills", "career", "background", "mo bagel", "summit"],
      content: "Kevin earned a STEM-designated MBA from the University of California, Berkeley, Haas School of Business in May 2026 and a Bachelor of Science in Industrial Engineering from the Pontifical Catholic University of Peru in July 2018. At Haas, he built Trackly, worked with Berkeley's Open Innovation Squad on AI product strategy for MoBagel, served as VP of the Tech Club, and co-launched the school's first Tech and AI Summit with more than 560 registrations. His working range includes AI product strategy, agent workflows, LLM evals, API and MCP integration, observability, experimentation, marketplaces, fintech, analytics, Figma, SwiftUI, TypeScript, and AI-assisted development.",
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
    organization: "Trackly",
    role: "Founder and product builder",
    dates: "2025-present",
    location: "Bay Area",
    summary: "Built and operates a real-time job-search product across web, native apps, CLI, MCP, matching, chat, and voice.",
    bullets: [
      "Chose direct company career pages as the wedge after seeing strong roles appear before aggregators during the MBA recruiting cycle.",
      "Designed quality controls for stale jobs, duplicate roles, false-zero monitoring failures, classification, and match explanations.",
      "Shipped one product system across web, iOS, macOS, a public CLI, and an MCP server.",
    ],
  },
  {
    organization: "PayPal Checkout",
    role: "Technical Product Manager MBA Intern",
    dates: "May-August 2025",
    location: "Chicago, Illinois",
    summary: "Defined and prototyped an AI-assisted observability workflow for checkout diagnostics.",
    bullets: [
      "Unified the investigation path across 15+ diagnostic tools with success metrics for detection and resolution.",
      "Built an agentic diagnostic prototype using Claude, Datadog, APIs, and MCP patterns, reducing issue-detection time 75% in the project workflow.",
      "Designed auto-triage orchestration that diagnosed issues, estimated impact, and routed alerts; the POC completed triage 5x faster.",
    ],
  },
  {
    organization: "Banco de Credito del Peru / Credicorp",
    role: "Product Analyst -> Product Manager -> Senior Product Manager -> Lead Product Manager",
    dates: "2018-2024",
    location: "Lima, Peru",
    summary: "Progressed through four product roles leading lending, marketplace, growth, and platform work for SMB customers.",
    bullets: [
      "Launched and scaled an SMB digital marketplace to 180K MAU, increasing product cross-sell per client by 28%.",
      "Led a personalized loan product from research through launch, reducing processing from seven days to immediate approval and generating $40M in nine months.",
      "Managed a team of nine product direct reports and partnered with risk, compliance, design, engineering, analytics, and commercial teams.",
      "Used ML-driven pricing experiments to increase conversion 32% and reach 19.6% market share in seven months.",
    ],
  },
];

export const projects = [
  {
    name: "Trackly",
    eyebrow: "Flagship product",
    href: "/projects/trackly/",
    thesis: "A job-search system built around direct career-page signal, explainable matching, and dependable delivery across human and agent interfaces.",
    proof: "Live product | Web, iOS, macOS, CLI, MCP",
    image: "/assets/trackly-home.webp",
  },
  {
    name: "PayPal AI observability",
    eyebrow: "Enterprise AI",
    href: "/projects/paypal-ai-observability/",
    thesis: "A public-safe account of turning fragmented checkout diagnostics into one faster AI-assisted investigation workflow.",
    proof: "Internship prototype | 15+ diagnostic tools",
  },
  {
    name: "BCP/Credicorp SMB products",
    eyebrow: "Product leadership at scale",
    href: "/projects/smb-fintech-bcp-credicorp/",
    thesis: "Six years of progression across lending, marketplace, growth, and product leadership in a regulated financial institution.",
    proof: "Production products | 9 direct reports",
  },
];

export const nav = [
  { label: "Work", href: "/#work" },
  { label: "Experience", href: "/#experience" },
  { label: "Resume", href: "/resume/" },
  { label: "Contact", href: "/contact/" },
];
