import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

/**
 * After every build, stamps the CACHE_VERSION in dist/sw.js with the current
 * Unix timestamp so the browser always sees a genuinely new service worker.
 */
function stampServiceWorker() {
  return {
    name: "stamp-sw",
    closeBundle() {
      const swPath = path.resolve("dist", "sw.js");
      if (!fs.existsSync(swPath)) return;
      const stamp = Date.now();
      let src = fs.readFileSync(swPath, "utf8");
      src = src.replace(/const CACHE_VERSION\s*=\s*"[^"]*"/, `const CACHE_VERSION = "v${stamp}"`);
      fs.writeFileSync(swPath, src);
      console.log(`✅ sw.js stamped with version v${stamp}`);
    },
  };
}

export default defineConfig({
  plugins: [react(), stampServiceWorker()],

  base: "/family-app/",

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts:   ["recharts"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },

  server: {
    port: 5173,
    host: true,
  },
});
