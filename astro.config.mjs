import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  integrations: [react()],
  site: "https://portfolio.kevinastuhuaman.com",
  output: "static",
  trailingSlash: "always",
  publicDir: "./site-public",
  devToolbar: { enabled: false },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self' https://api.portfolio.kevinastuhuaman.com https://cloudflareinsights.com https://us.i.posthog.com https://us-assets.i.posthog.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ],
      scriptDirective: {
        resources: ["'self'", "https://static.cloudflareinsights.com", "https://us-assets.i.posthog.com"],
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
