import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appRoot, "../..");

/** @type {import('next').NextConfig} */
export default {
  transpilePackages: ["@rad/ui", "@rad/types"],
  turbopack: { root: monorepoRoot },
  // Only for the plain `next build` path (Docker/Liara) — gated behind an
  // env var so `vinext build` (Cloudflare) never sees it; vinext has its
  // own output pipeline and standalone's bundled server.js makes no sense
  // on Workers anyway.
  ...(process.env.LIARA_BUILD === "1" ? { output: "standalone" } : {}),
};
