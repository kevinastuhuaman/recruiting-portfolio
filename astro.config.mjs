import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://portfolio.kevinastuhuaman.com",
  output: "static",
  trailingSlash: "always",
  publicDir: "./site-public",
  build: {
    format: "directory",
  },
  compressHTML: true,
});
