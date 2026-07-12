const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

document.documentElement.classList.add("has-js");

if (window.location.protocol === "http:" && !localHosts.has(window.location.hostname)) {
  window.location.replace(`https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`);
}

const modeButtons = document.querySelectorAll("[data-mode]");
const modePanels = document.querySelectorAll("[data-mode-panel]");

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode;
    modeButtons.forEach((item) => {
      item.classList.toggle("is-active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    modePanels.forEach((panel) => {
      panel.hidden = panel.dataset.modePanel !== mode;
    });
  });
});

const packet = `Kevin Astuhuaman is an AI Product Manager, ex-PayPal in AI/ML observability, and Berkeley Haas MBA with seven years of product experience. His recent enterprise AI work is an agentic observability prototype for PayPal Checkout. He also built Trackly across web, iOS, macOS, CLI, MCP, chat, and voice; worked on AI product strategy, high-fidelity prototyping, and go-to-market recommendations for Berkeley's Fujitsu and MoBagel challenge; and progressed to Lead Product Manager with nine product direct reports at Banco de Credito BCP, part of Credicorp. Portfolio: https://portfolio.kevinastuhuaman.com/ GitHub: https://github.com/kevinastuhuaman LinkedIn: https://www.linkedin.com/in/kevinastuhuaman`;

document.querySelectorAll("[data-copy-packet]").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(packet);
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = "Copy packet";
      }, 1800);
    } catch {
      button.textContent = "Copy unavailable";
    }
  });
});

const searchButton = document.querySelector("[data-open-search]");
const searchDialog = document.querySelector("[data-search-dialog]");
const searchInput = document.querySelector("[data-search-input]");
const searchResults = document.querySelector("[data-search-results]");

const searchable = [
  ["PayPal AI Observability", "/projects/paypal-ai-observability/", "Agentic observability prototype, 15+ diagnostic tools, 75% faster detection in the project workflow"],
  ["Trackly", "/projects/trackly/", "Real-time job-search product, 1,969 companies, web, iOS, macOS, CLI, MCP"],
  ["Berkeley and MoBagel", "/projects/berkeley-mobagel-ai-gtm/", "AI product strategy, Figma prototype, roadmap, business model, and go-to-market recommendations"],
  ["BCP Product Leadership", "/projects/smb-fintech-bcp-credicorp/", "Digital-first small-business products, Lead Product Manager, nine product direct reports"],
  ["How I build with AI tools", "/projects/agentic-dev-workflows/", "Claude Code, Codex, MCP, evals, observability, automation"],
  ["Recruiter Brief", "/packet/", "Legacy path to the current portfolio, resume, and selected product evidence"],
  ["Resume", "/resume/", "Recruiter-readable resume snapshot"],
  ["Proof", "/proof/", "Evidence registry and claim status"],
  ["GitHub", "https://github.com/kevinastuhuaman", "Public repositories and build record"],
  ["LinkedIn", "https://www.linkedin.com/in/kevinastuhuaman", "Professional profile"]
];

function renderSearch(query = "") {
  if (!searchResults) return;
  const normalized = query.trim().toLowerCase();
  const matches = searchable.filter(([title, , description]) => {
    return `${title} ${description}`.toLowerCase().includes(normalized);
  });
  searchResults.innerHTML = matches
    .map(([title, href, description]) => {
      return `<a class="search-result" href="${href}"><strong>${title}</strong><span>${description}</span></a>`;
    })
    .join("");
}

function openSearch() {
  if (!searchDialog) return;
  searchDialog.removeAttribute("hidden");
  renderSearch();
  searchInput?.focus();
}

function closeSearch() {
  searchDialog?.setAttribute("hidden", "");
}

searchButton?.addEventListener("click", openSearch);
searchDialog?.addEventListener("click", (event) => {
  if (event.target === searchDialog) closeSearch();
});
searchInput?.addEventListener("input", (event) => renderSearch(event.target.value));

document.addEventListener("keydown", (event) => {
  const isCommandSearch = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
  if (isCommandSearch) {
    event.preventDefault();
    openSearch();
  }
  if (event.key === "Escape") closeSearch();
});

renderSearch();

const revealTargets = document.querySelectorAll(
  ".packet-wall, .section-grid, .packet-card, .artifact-card, .timeline-item, .proof-tile, .evidence-row"
);

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  revealTargets.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );

  revealTargets.forEach((item) => {
    item.classList.add("reveal");
    revealObserver.observe(item);
  });
}
