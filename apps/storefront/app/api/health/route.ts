/**
 * Liara's health check hits this directly (see liara.json) — deliberately
 * independent of locale middleware, auth, and the backend API, so a slow or
 * unreachable Liara API never gets mistaken for a dead frontend container.
 */
export function GET() {
  return Response.json(
    { ok: true },
    { headers: { "cache-control": "no-store" } },
  );
}
