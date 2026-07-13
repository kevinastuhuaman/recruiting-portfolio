import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  integrations: [react()],
  site: "https://portfolio.kevinastuhuaman.com",
  output: "static",
  trailingSlash: "always",
  publicDir: "./site-public",
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self' https://closeai.mba https://*.openai.azure.com https://*.services.ai.azure.com https://*.api.cognitive.microsoft.com https://us.i.posthog.com https://cloudflareinsights.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ],
      scriptDirective: {
        resources: ["'self'", "https://static.cloudflareinsights.com"],
      },
    },
  },
  build: {
    format: "directory",
    inlineStylesheets: "never",
  },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
  compressHTML: true,
});
