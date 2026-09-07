import { extractPage } from "./extract";
import type { Comparable, PriceSource, PricingConfig } from "./types";

function allowed(url: URL, source: PriceSource) {
  return source.allowedHosts.some(
    (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
  );
}
function robotsAllows(content: string, pathname: string) {
  let applies = false;
  const disallowed: string[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const [key, ...rest] = raw.split(":");
    const value = rest.join(":").trim();
    if (key.trim().toLowerCase() === "user-agent") applies = value === "*";
    if (applies && key.trim().toLowerCase() === "disallow" && value)
      disallowed.push(value);
  }
  return !disallowed.some((path) => pathname.startsWith(path));
}
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function crawl(
  config: PricingConfig,
  fetcher: typeof fetch = fetch,
): Promise<Comparable[]> {
  const found = new Map<string, Comparable>();
  for (const source of config.sources) {
    const queue = [...source.startUrls];
    const visited = new Set<string>();
    const robotCache = new Map<string, string>();
    while (queue.length && visited.size < (config.maxPagesPerSource ?? 30)) {
      const target = new URL(queue.shift()!);
      if (!allowed(target, source) || visited.has(target.toString())) continue;
      visited.add(target.toString());
      const origin = target.origin;
      if (!robotCache.has(origin)) {
        const response = await fetcher(`${origin}/robots.txt`, {
          headers: {
            "user-agent":
              config.userAgent ??
              "RADPriceResearchBot/1.0 (+https://rad-object.com)",
          },
        });
        robotCache.set(origin, response.ok ? await response.text() : "");
      }
      if (!robotsAllows(robotCache.get(origin)!, target.pathname)) continue;
      const response = await fetcher(target, {
        headers: {
          "user-agent":
            config.userAgent ??
            "RADPriceResearchBot/1.0 (+https://rad-object.com)",
          accept: "text/html",
        },
      });
      if (
        !response.ok ||
        !(response.headers.get("content-type") ?? "").includes("text/html")
      )
        continue;
      const page = extractPage(
        await response.text(),
        target.toString(),
        source,
      );
      for (const item of page.products)
        found.set(`${item.source}:${item.url}:${item.name}`, item);
      for (const link of page.links)
        if (allowed(new URL(link), source)) queue.push(link);
      if (config.delayMs ?? 1000) await wait(config.delayMs ?? 1000);
    }
  }
  return [...found.values()];
}
