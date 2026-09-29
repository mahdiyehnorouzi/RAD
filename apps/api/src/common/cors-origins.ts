/**
 * Credentialed CORS: every allowed origin is matched exactly. Never allow a
 * shared hosting suffix (`*.workers.dev`, `*.chatgpt.site`); anyone can
 * publish a page there and call the API with a visitor's session.
 */
const PRODUCTION_ORIGINS = [
  "https://rad-object.com",
  "https://www.rad-object.com",
  "https://admin.rad-object.com",
  "https://rad-studio.rad-studio.workers.dev",
  "https://rad-admin.rad-studio.workers.dev",
];

const LOCAL_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3002",
];

function listFromEnv(value?: string) {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export function allowedOrigins(env: NodeJS.ProcessEnv = process.env) {
  return new Set([
    ...PRODUCTION_ORIGINS,
    ...(env.NODE_ENV === "production" ? [] : LOCAL_ORIGINS),
    ...listFromEnv(env.STOREFRONT_ORIGIN),
    ...listFromEnv(env.ADMIN_ORIGIN),
    ...listFromEnv(env.CORS_ORIGINS),
  ]);
}

/** Requests without an `Origin` header (server-to-server, curl) are not CORS requests. */
export function isAllowedOrigin(origin: string | undefined, allowed: Set<string>) {
  return !origin || allowed.has(origin);
}
