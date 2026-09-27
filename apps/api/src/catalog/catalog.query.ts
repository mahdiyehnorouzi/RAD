import type { Repository, SelectQueryBuilder } from "typeorm";
import type { Product } from "../database/entities";
import { publicProductWhere } from "./product.mapper";

/**
 * Public works with image metadata only (never base64 `src`), skipping image
 * rows that cannot be served by `/catalog/images/:id`.
 */
export function publicCatalogQuery(
  products: Repository<Product>,
): SelectQueryBuilder<Product> {
  return products
    .createQueryBuilder("product")
    .leftJoinAndSelect("product.vendor", "vendor")
    .leftJoin(
      "product.images",
      "images",
      "images.src IS NOT NULL AND images.src LIKE :imagePrefix",
      { imagePrefix: "data:image/%" },
    )
    .addSelect([
      "images.id",
      "images.alt",
      "images.enAlt",
      "images.color",
      "images.accent",
      "images.shape",
      "images.sortOrder",
    ])
    .where("product.status NOT IN (:...hidden)", {
      hidden: publicProductWhere.status.notIn,
    })
    .orderBy("product.radNumber", "ASC", "NULLS LAST")
    .addOrderBy("product.sortOrder", "ASC")
    .addOrderBy("images.sortOrder", "ASC");
}

/** The shop only lists works that were offered for sale. */
export function pricedCatalogQuery(products: Repository<Product>) {
  return publicCatalogQuery(products).andWhere(
    "product.tomanPrice IS NOT NULL",
  );
}
