const API_BASE = process.env.API_URL || "http://localhost:4000";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

export async function proxyApiRequest(
  request: Request,
  pathSegments: string[],
): Promise<Response> {
  const path = pathSegments.map(encodeURIComponent).join("/");
  const target = new URL(`/${path}`, API_BASE);
  const incoming = new URL(request.url);
  target.search = incoming.search;

  const headers = new Headers(request.headers);
  headers.set("host", target.host);
  for (const key of HOP_BY_HOP) headers.delete(key);

  const method = request.method;
  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers,
    redirect: "manual",
  };

  if (method !== "GET" && method !== "HEAD" && request.body) {
    init.body = request.body;
    init.duplex = "half";
  }

  try {
    const upstream = await fetch(target, init);
    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!HOP_BY_HOP.has(key.toLowerCase())) responseHeaders.append(key, value);
    });

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { error: "API unavailable" },
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }
}
