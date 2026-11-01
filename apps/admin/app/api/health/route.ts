/**
 * Container health check for the VPS admin image. Independent of auth and
 * the backend API, so a slow or unreachable API is never mistaken for a
 * dead admin container.
 */
export function GET() {
  return Response.json(
    { ok: true },
    { headers: { "cache-control": "no-store" } },
  );
}
