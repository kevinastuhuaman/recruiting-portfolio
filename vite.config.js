import { defineConfig } from "vite";
import { resolve } from "node:path";

const root = resolve(__dirname);

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        resume: resolve(root, "resume/index.html"),
        proof: resolve(root, "proof/index.html"),
        next: resolve(root, "next/index.html"),
        contact: resolve(root, "contact/index.html"),
        trackly: resolve(root, "projects/trackly/index.html"),
        paypal: resolve(root, "projects/paypal-ai-observability/index.html"),
        bcp: resolve(root, "projects/smb-fintech-bcp-credicorp/index.html"),
        workflows: resolve(root, "projects/agentic-dev-workflows/index.html")
      }
    }
  }
});
