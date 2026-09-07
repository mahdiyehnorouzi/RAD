import { load, type CheerioAPI } from "cheerio";
import { parsePrice } from "./normalize";
import type { Comparable, PriceSource } from "./types";

function absoluteUrl(href: string | undefined, base: string) {
  if (!href) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function jsonLdProducts(
  $: CheerioAPI,
  pageUrl: string,
  source: PriceSource,
): Comparable[] {
  const output: Comparable[] = [];
  $('script[type="application/ld+json"]').each((_, node) => {
    try {
      const raw: unknown = JSON.parse($(node).text());
      const queue = Array.isArray(raw) ? [...raw] : [raw];
      while (queue.length) {
        const item = queue.shift() as Record<string, unknown> | undefined;
        if (!item || typeof item !== "object") continue;
        if (Array.isArray(item["@graph"]))
          queue.push(...(item["@graph"] as Record<string, unknown>[]));
        if (item["@type"] === "ItemList" && Array.isArray(item.itemListElement))
          for (const entry of item.itemListElement as Record<string, unknown>[])
            queue.push((entry.item ?? entry) as Record<string, unknown>);
        if (item["@type"] !== "Product") continue;
        const offers = (
          Array.isArray(item.offers) ? item.offers[0] : item.offers
        ) as Record<string, unknown> | undefined;
        const price = parsePrice(
          String(offers?.price ?? item.price ?? ""),
          source.currency,
        );
        const name = String(item.name ?? "").trim();
        if (price && name)
          output.push({
            source: source.name,
            url:
              absoluteUrl(
                String(item.url ?? offers?.url ?? pageUrl),
                pageUrl,
              ) ?? pageUrl,
            name,
            category:
              typeof item.category === "string" ? item.category : undefined,
            features: [item.description, item.material, item.color].filter(
              (x): x is string => typeof x === "string",
            ),
            priceToman: price,
          });
      }
    } catch {
      /* Ignore malformed third-party structured data. */
    }
  });
  return output;
}

export function extractPage(
  html: string,
  pageUrl: string,
  source: PriceSource,
) {
  const $ = load(html);
  const products = jsonLdProducts($, pageUrl, source);
  const selectors = source.selectors;
  if (selectors?.card && selectors.name && selectors.price)
    $(selectors.card).each((_, card) => {
      const element = $(card);
      const name = element.find(selectors.name!).first().text().trim();
      const price = parsePrice(
        element.find(selectors.price!).first().text(),
        source.currency,
      );
      const url = absoluteUrl(
        element
          .find(selectors.link ?? "a")
          .first()
          .attr("href"),
        pageUrl,
      );
      if (name && price && url)
        products.push({
          source: source.name,
          url,
          name,
          category: selectors.category
            ? element.find(selectors.category).first().text().trim()
            : undefined,
          features: selectors.features
            ? element
                .find(selectors.features)
                .map((_, n) => $(n).text().trim())
                .get()
            : [],
          priceToman: price,
        });
    });
  const links = new Set<string>();
  $(selectors?.next ?? 'a[rel="next"]').each((_, node) => {
    const url = absoluteUrl($(node).attr("href"), pageUrl);
    if (url) links.add(url);
  });
  return { products, links: [...links] };
}
