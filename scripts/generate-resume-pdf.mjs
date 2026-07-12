import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { chromium } from "@playwright/test";

const root = new URL("../dist/", import.meta.url).pathname;
const output = join(root, "kevin-astuhuaman-resume.pdf");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
};

const server = createServer(async (request, response) => {
  try {
    const rawPath = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    let requestPath = rawPath.endsWith("/") ? `${rawPath}index.html` : rawPath;
    let filePath = normalize(join(root, requestPath));
    if (!filePath.startsWith(root)) throw new Error("Invalid path");
    const metadata = await stat(filePath);
    if (metadata.isDirectory()) filePath = join(filePath, "index.html");
    response.writeHead(200, { "content-type": mime[extname(filePath)] ?? "application/octet-stream" });
    response.end(await readFile(filePath));
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Could not start PDF preview server");

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${address.port}/resume/`, { waitUntil: "networkidle" });
  await page.pdf({
    path: output,
    format: "Letter",
    printBackground: false,
    preferCSSPageSize: true,
    tagged: true,
    outline: true,
    margin: { top: "0.45in", right: "0.48in", bottom: "0.45in", left: "0.48in" },
  });
} finally {
  const cleanup = [
    new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  ];
  if (browser) cleanup.unshift(browser.close());
  const results = await Promise.allSettled(cleanup);
  const failure = results.find((result) => result.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
}

console.log("Generated tagged public resume PDF.");
