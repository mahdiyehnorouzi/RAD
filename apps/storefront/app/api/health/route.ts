/**
 * Container health check for the VPS storefront image. Independent of
 * locale middleware, auth, and the backend API, so a slow or unreachable
 * API is never mistaken for a dead frontend container.
 */
export function GET() {
  return Response.json(
    { ok: true },
    { headers: { "cache-control": "no-store" } },
  );
}
