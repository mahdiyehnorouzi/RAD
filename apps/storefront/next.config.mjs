import path from "node:path";
import { fileURLToPath } from "node:url";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

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
// `host` (hostname[:port]) for the NEXT_PUBLIC_ compare in product-media.tsx
// — a plain string equality against another URL's `.host`, so the port
// belongs in it there. `remotePatterns.hostname`, below, is a different,
// stricter schema: it must be the bare hostname with NO port — Next
// matches the port separately via its own `port` field (an embedded port
// there is matched literally and never equals the real request's port,
// silently failing every match whenever SEAWEEDFS_PUBLIC_URL has one, e.g.
// any deployment not proxied through a bare :443/:80).
let seaweedfsPublicHost;
let seaweedfsHostname;
let seaweedfsPort;
let seaweedfsPathname;
try {
  if (process.env.SEAWEEDFS_PUBLIC_URL) {
    const url = new URL(process.env.SEAWEEDFS_PUBLIC_URL);
    seaweedfsPublicHost = url.host;
    seaweedfsHostname = url.hostname;
    seaweedfsPort = url.port;
    // Scoped to this one bucket path, not the whole host — SEAWEEDFS_PUBLIC_URL
    // is the API's own domain (e.g. api.rad-object.com/storage/rad-public), so
    // an unscoped pattern would let Next's optimizer fetch any other path on
    // that same host, not just product photos.
    seaweedfsPathname = `${url.pathname.replace(/\/+$/, "")}/**`;
  }
} catch {
  seaweedfsPublicHost = undefined;
  seaweedfsHostname = undefined;
  seaweedfsPort = undefined;
  seaweedfsPathname = undefined;
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
            {
              protocol: "https",
              hostname: seaweedfsHostname,
              port: seaweedfsPort,
              pathname: seaweedfsPathname,
            },
            {
              protocol: "http",
              hostname: seaweedfsHostname,
              port: seaweedfsPort,
              pathname: seaweedfsPathname,
            },
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

// export default nextConfig;
export default withBundleAnalyzer(nextConfig);
