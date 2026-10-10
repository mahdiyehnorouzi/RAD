import type { Repository, SelectQueryBuilder } from "typeorm";
import type { Product } from "../database/entities";
import { publicProductWhere } from "./product.mapper";

/**
 * Public works. `images.storage` is selected so `product.mapper.ts` can
 * resolve a real path for `static`/`external`/`cloudinary` rows directly;
 * only `legacy_base64` rows get masked behind `/catalog/images/:id` there.
 *
 * `images.src` is fetched via a `CASE` expression rather than a plain
 * column select: for `legacy_base64` rows the mapper (`imageSrc` in
 * `product.mapper.ts`) never looks at `src` at all — it always returns
 * `/catalog/images/:id` — so there is no reason to pay for detoasting a
 * (potentially large) base64 data URI on every public list/detail query.
 * The `CASE` only returns `src` for `static`/`external`/null-storage rows,
 * where the mapper does use it. Postgres does not evaluate the `ELSE`
 * branch when the `WHEN` matches, so the large payload is never detoasted
 * for `legacy_base64` rows. `stripImageSrc` still nulls it out again at the
 * application layer as defense in depth, but the DB-side cost is what this
 * fixes. Admin's "embedImages" path (`CatalogAdminService`/
 * `productIncludeWithSrc`) uses a separate `relations: { images: true }`
 * TypeORM `find`/`findOne` call, not this query builder, so it is
 * unaffected and still always gets the full `src`.
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
      "images.src IS NOT NULL OR images.storage = 'cloudinary'",
    )
    .addSelect([
      "images.id",
      "images.alt",
      "images.enAlt",
      "images.color",
      "images.accent",
      "images.shape",
      "images.sortOrder",
      "images.storage",
      "images.objectKey",
    ])
    .addSelect(
      "CASE WHEN images.storage = 'legacy_base64' THEN NULL ELSE images.src END",
      "images_src",
    )
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
