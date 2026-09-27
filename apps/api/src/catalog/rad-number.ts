import type { EntityManager, Repository } from "typeorm";
import { Product } from "../database/entities";

export function formatArtworkNumber(radNumber: number) {
  return `RAD-${String(radNumber).padStart(3, "0")}`;
}

/** Next free archive number; numbers are never reused or derived from list order. */
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
