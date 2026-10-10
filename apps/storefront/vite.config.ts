import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { cdnAdapter } from "@vinext/cloudflare/cache/cdn-adapter";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

export default defineConfig({
  plugins: [
    vinext({
      cache: { cdn: cdnAdapter() },
      // Without this, vinext has no resize backend for next/image on
      // Cloudflare and serves images unoptimized (no real srcset), which
      // defeats responsive `sizes`/`srcSet` entirely. Backed by the
      // Cloudflare Images binding declared in wrangler.jsonc.
      images: { optimizer: imagesOptimizer() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
