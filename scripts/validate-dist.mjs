import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { routes, site } from "../src/data/site.js";

const dist = new URL("../dist/", import.meta.url);
const failures = [];
const forbidden = [
  "internal-snapshot",
  "private-artifact",
  "resume-approved",
  "latest internal snapshot",
  "kevin-astuhuaman-recruiter-packet",
  "Trackly application history",
  "(669)-268-7105",
  "$100M",
  "$620M ARR/P&L",
];

async function walk(directory) {
  const items = await readdir(directory);
  const files = [];
  for (const item of items) {
    const path = join(directory, item);
    const metadata = await stat(path);
    if (metadata.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}

const routeFile = (path) =>
  new URL(path === "/" ? "index.html" : `${path.replace(/^\//, "")}index.html`, dist);

for (const route of routes.filter((item) => item.state === "index")) {
  try {
    const html = await readFile(routeFile(route.path), "utf8");
    const canonical = `<link rel="canonical" href="${new URL(route.path, site.origin).href}">`;
    if (!html.includes(canonical)) failures.push(`${route.path}: missing canonical`);
    if (!html.includes("<main")) failures.push(`${route.path}: missing main landmark`);
    if (!html.includes("skip-link")) failures.push(`${route.path}: missing skip link`);
  } catch {
    failures.push(`${route.path}: missing built page`);
  }
}

for (const route of routes.filter((item) => item.state === "compat")) {
  try {
    const html = await readFile(routeFile(route.path), "utf8");
    if (!html.includes('name="robots" content="noindex, follow"')) failures.push(`${route.path}: compatibility page must be noindex`);
    if (html.includes('rel="canonical"')) failures.push(`${route.path}: compatibility page must not declare a canonical`);
  } catch {
    failures.push(`${route.path}: missing compatibility page`);
  }
}

const sitemap = await readFile(new URL("sitemap.xml", dist), "utf8");
for (const route of routes.filter((item) => item.state !== "index")) {
  if (sitemap.includes(new URL(route.path, site.origin).href)) failures.push(`${route.path}: non-index route in sitemap`);
}

for (const path of ["next/index.html", "recruiter-packet.md"]) {
  try {
    await stat(new URL(path, dist));
    failures.push(`${path}: must not be deployed`);
  } catch {
    // Expected: deliberately outside the generated public directory.
  }
}

for (const path of ["proof.json", "assistant-corpus.json", "2e43f7d61916408ea525527e4bc9b5c7.txt", ".well-known/agent-skills/index.json", ".well-known/agent-skills/site-navigation/SKILL.md"]) {
  try {
    await stat(new URL(path, dist));
  } catch {
    failures.push(`${path}: missing public compatibility artifact`);
  }
}

const errorPage = await readFile(new URL("404.html", dist), "utf8");
if (!errorPage.includes('name="robots" content="noindex, follow"')) failures.push("404.html: missing noindex");
if (errorPage.includes('rel="canonical"')) failures.push("404.html: must not declare a canonical");

for (const file of await walk(dist.pathname)) {
  if (!/\.(?:html|json|txt|md|xml)$/i.test(file)) continue;
  const contents = await readFile(file, "utf8");
  for (const term of forbidden) {
    if (contents.includes(term)) failures.push(`${file}: contains forbidden public term ${term}`);
  }
}

if (failures.length) {
  console.error(`Public build validation failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("Public build boundary, route manifest, and canonical checks passed.");
