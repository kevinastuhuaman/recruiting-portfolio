const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

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

const packet = `Kevin Astuhuaman is an AI Product Manager and Berkeley Haas MBA who builds production AI-agent systems across recruiting automation, observability, and fintech. He built Trackly across web, iOS, macOS, CLI, and MCP surfaces; built AI observability tooling at PayPal across 15+ checkout systems; and worked on digital-first financial products tied to 100K+ SMBs and a $620M ARR/P&L portfolio. Portfolio: https://portfolio.kevinastuhuaman.com/ GitHub: https://github.com/kevinastuhuaman LinkedIn: https://www.linkedin.com/in/kevinastuhuaman`;

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
  ["Trackly", "/projects/trackly/", "Real-time job-search agent, 1,900+ companies, web, iOS, macOS, CLI, MCP"],
  ["PayPal AI Observability", "/projects/paypal-ai-observability/", "AI observability tooling, 15+ checkout systems, 75% faster detection"],
  ["BCP Credicorp SMB Fintech", "/projects/smb-fintech-bcp-credicorp/", "Digital-first SMB products, 100K+ entrepreneurs, $620M ARR/P&L"],
  ["Agentic Dev Workflows", "/projects/agentic-dev-workflows/", "Claude Code, Codex, MCP, evals, observability, automation"],
  ["Recruiter Packet", "/packet/", "One-page packet for target roles, proof points, work authorization, and links"],
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
