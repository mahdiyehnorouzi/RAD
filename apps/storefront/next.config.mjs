import path from "node:path";
import { fileURLToPath } from "node:url";
const appRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appRoot, "../..");
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@rad/ui", "@rad/types", "@rad/artworks", "@rad/state", "@rad/i18n"],
  turbopack: { root: monorepoRoot },
  async redirects() { return [
    { source: "/passport", destination: "/reviews", permanent: true },
    { source: "/archive", destination: "/products", permanent: true },
    // Public images are WebP now; the database and shared links still hold .png/.jpg paths.
    // vinext rejects looser patterns (e.g. `.+` inside a group) as ReDoS risks.
    {
      source: "/:dir(about|catalog|contact|difference|help|home|making|now|shape|states|studio)/:file([\\w/-]+).:ext(png|jpg|jpeg)",
      destination: "/:dir/:file.webp",
      permanent: true,
    },
    { source: "/rad-mark.png", destination: "/rad-mark.webp", permanent: true },
  ]; },
  async headers() { return [
    { source: "/(.*)", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "X-Frame-Options", value: "DENY" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }] },
    { source: "/sw.js", headers: [{ key: "Content-Type", value: "application/javascript; charset=utf-8" }, { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" }] },
  ]; },
};

export default nextConfig;
