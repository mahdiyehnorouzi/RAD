import path from "node:path";
import { fileURLToPath } from "node:url";
const appRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appRoot, "../..");

// SEAWEEDFS_PUBLIC_URL is a per-deployment env var (see
// apps/api/src/storage/seaweedfs-storage.service.ts), not a fixed domain
// the way Cloudinary's is — it can still be parsed at build/start time,
// though, letting `remotePatterns` allowlist it (and, via `env` below,
// letting `product-media.tsx`'s client-side loader recognize it) so
// SeaweedFS-hosted thumbnails stop bypassing Next's image optimizer and
// shipping full-size originals at thumbnail display size. Left undefined
// when the var is unset/unparseable — that `src` then falls back to its
// existing unresized passthrough, same as before this change.
let seaweedfsPublicHost;
try {
  seaweedfsPublicHost = process.env.SEAWEEDFS_PUBLIC_URL
    ? new URL(process.env.SEAWEEDFS_PUBLIC_URL).host
    : undefined;
} catch {
  seaweedfsPublicHost = undefined;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: { NEXT_PUBLIC_SEAWEEDFS_HOST: seaweedfsPublicHost ?? "" },
  transpilePackages: ["@rad/ui", "@rad/types", "@rad/artworks", "@rad/i18n"],
  turbopack: { root: monorepoRoot },
  // Next's default (60s) means the on-demand image optimizer re-resizes
  // the same url+width+quality from scratch once a minute, all day, for
  // local/public images (Cloudinary/SeaweedFS photos bypass this route
  // entirely via product-media.tsx's custom loaders). These are static
  // product/marketing photos that don't change in place — a day-long
  // cache removes the repeat resize cost without real staleness risk.
  // certificate-scene.tsx requests quality 80 (vs. the 75 default) for its
  // wide/tall hero photos, so both must be allowed or the optimizer 400s.
  images: {
    minimumCacheTTL: 60 * 60 * 24,
    qualities: [75, 80],
    ...(seaweedfsPublicHost
      ? {
          remotePatterns: [
            { protocol: "https", hostname: seaweedfsPublicHost },
            { protocol: "http", hostname: seaweedfsPublicHost },
          ],
        }
      : {}),
  },
  // Only for the plain `next build` path (Docker/Liara) — gated behind an
  // env var so `vinext build` (Cloudflare) never sees it; vinext has its
  // own output pipeline and standalone's bundled server.js makes no sense
  // on Workers anyway.
  ...(process.env.LIARA_BUILD === "1" ? { output: "standalone" } : {}),
  async redirects() {
    return [
      // Canonicalize to the www host so www/non-www never split into two
      // session identities (host-only cookies differ per hostname). This
      // must run for every path, including /r/[code] QR redirects, which
      // is why it lives here rather than in proxy.ts (whose matcher
      // excludes /r/).
      {
        source: "/:path*",
        has: [{ type: "host", value: "^rad-object\\.com$" }],
        destination: "https://www.rad-object.com/:path*",
        permanent: true,
      },
      { source: "/passport", destination: "/reviews", permanent: true },
      { source: "/archive", destination: "/products", permanent: true },
      // Public images are WebP now; the database and shared links still hold .png/.jpg paths.
      // vinext rejects looser patterns (e.g. `.+` inside a group) as ReDoS risks.
      {
        source:
          "/:dir(about|catalog|contact|difference|help|home|making|now|shape|states|studio)/:file([\\w/-]+).:ext(png|jpg|jpeg)",
        destination: "/:dir/:file.webp",
        permanent: true,
      },
      {
        source: "/rad-mark.png",
        destination: "/rad-mark.webp",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
