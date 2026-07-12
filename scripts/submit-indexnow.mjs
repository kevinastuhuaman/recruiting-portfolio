import { routes, site } from "../src/data/site.js";

const key = "2e43f7d61916408ea525527e4bc9b5c7";
const keyLocation = `${site.origin}/${key}.txt`;
const urlList = routes
  .filter((route) => route.state === "index")
  .map((route) => new URL(route.path, site.origin).href);

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(site.origin).hostname,
    key,
    keyLocation,
    urlList,
  }),
});

if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow submission failed with HTTP ${response.status}: ${await response.text()}`);
}

console.log(`IndexNow accepted ${urlList.length} canonical URLs with HTTP ${response.status}.`);
