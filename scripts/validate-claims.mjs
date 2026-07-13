import { claimsById, publicClaims } from "../src/data/claims.js";
import { assistantCorpus } from "../src/data/site.js";

const todayPst = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const errors = [];
const ids = new Set();

for (const claim of publicClaims) {
  for (const field of ["id", "statement", "short", "context", "source", "evidenceType", "verified", "reviewDate"]) {
    if (!claim[field]) errors.push(`${claim.id || "unknown"}: missing ${field}`);
  }
  if (ids.has(claim.id)) errors.push(`${claim.id}: duplicate claim id`);
  ids.add(claim.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(claim.verified) || !/^\d{4}-\d{2}-\d{2}$/.test(claim.reviewDate)) {
    errors.push(`${claim.id}: verification dates must use YYYY-MM-DD`);
  }
  if (claim.verified > claim.reviewDate) errors.push(`${claim.id}: verification date follows review date`);
  if (claim.reviewDate < todayPst) errors.push(`${claim.id}: evidence review expired on ${claim.reviewDate}`);
  if (claim.metrics && (!Array.isArray(claim.metrics) || claim.metrics.some((metric) => !metric.value || !metric.label))) {
    errors.push(`${claim.id}: metrics require value and label`);
  }
}

const bcp = claimsById["bcp-digital-growth"];
const bcpText = `${bcp?.statement ?? ""} ${bcp?.short ?? ""} ${bcp?.context ?? ""}`;
if (!/monthly website traffic/i.test(bcpText) || /180(?:,000|k)\s+(?:monthly\s+)?(?:active\s+)?users?/i.test(bcpText)) {
  errors.push("bcp-digital-growth: 180K must be labeled only as monthly website traffic");
}

const paypal = claimsById["paypal-detection"];
if (!/prototype/i.test(`${paypal?.statement ?? ""} ${paypal?.context ?? ""}`) || /paypal-wide production|deployed to production|shipped to production/i.test(paypal?.statement ?? "")) {
  errors.push("paypal-detection: employer claim must retain the prototype boundary");
}

const requiredCorpusClaims = [
  ["trackly", "trackly-inventory"],
  ["paypal", "paypal-discovery"],
  ["paypal", "paypal-detection"],
  ["paypal", "paypal-triage"],
  ["bcp", "bcp-access"],
  ["bcp", "bcp-loans"],
  ["bcp", "bcp-digital-growth"],
  ["mobagel", "berkeley-mobagel-brief"],
  ["resume", "berkeley-tech-ai-summit"],
];
for (const [entryId, claimId] of requiredCorpusClaims) {
  const content = assistantCorpus.entries.find((entry) => entry.id === entryId)?.content ?? "";
  const statement = claimsById[claimId]?.statement ?? "";
  if (!statement || !content.includes(statement)) {
    errors.push(`assistant corpus drift: ${entryId} must consume canonical claim ${claimId}`);
  }
}

const bcpCorpus = assistantCorpus.entries.find((entry) => entry.id === "bcp")?.content ?? "";
if (/180(?:,000|k)\s+(?:monthly\s+)?(?:active\s+)?users?/i.test(bcpCorpus)) {
  errors.push("assistant corpus drift: BCP 180K is not a user or MAU claim");
}

if (errors.length) {
  throw new Error(`Claim validation failed:\n- ${errors.join("\n- ")}`);
}

console.log(`Validated ${publicClaims.length} canonical public claims as of ${todayPst} PST.`);
