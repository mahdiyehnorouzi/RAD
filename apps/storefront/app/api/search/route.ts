import { NextResponse, type NextRequest } from "next/server";
import { getCatalog } from "@/lib/catalog/get-catalog-works";
import { productCopy } from "@/lib/catalog/products";
import {
  normalizeQuery,
  productMatchesQuery,
  type SearchHit,
} from "@/lib/catalog/search";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const locale = params.get("locale") === "en" ? "en" : "fa";
  const normalized = normalizeQuery(params.get("q") ?? "", locale);
  const { products } = normalized ? await getCatalog() : { products: [] };
  const results: SearchHit[] = products
    .filter((product) => productMatchesQuery(product, normalized, locale))
    .map((product) => {
      const copy = productCopy(product, locale);
      return { slug: product.slug, name: copy.name, subtitle: copy.subtitle };
    });
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=30" } },
  );
}
