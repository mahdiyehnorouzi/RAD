import type { EntityManager, Repository } from "typeorm";
import { Product } from "../database/entities";

export function formatArtworkNumber(radNumber: number) {
  return `RAD-${String(radNumber).padStart(3, "0")}`;
}

/**
 * Highest stored product number plus one. New allocation goes through
 * `identities/identity.allocator.ts`, which also counts reserved tags.
 * This helper remains for readers that only need the product-table maximum.
 */
export async function nextRadNumber(
  products: Repository<Product> | EntityManager,
) {
  const repo =
    "getRepository" in products ? products.getRepository(Product) : products;
  const row = await repo
    .createQueryBuilder("product")
    .select("MAX(product.radNumber)", "max")
    .getRawOne<{ max: string | number | null }>();
  return Number(row?.max ?? 0) + 1;
}
