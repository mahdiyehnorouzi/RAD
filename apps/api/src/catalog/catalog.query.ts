import type { Repository, SelectQueryBuilder } from "typeorm";
import type { Product } from "../database/entities";
import { publicProductWhere } from "./product.mapper";

/**
 * Public works. `images.storage` is selected so `product.mapper.ts` can
 * resolve a real path for `static`/`external`/`cloudinary`/`cloudinary_video`/
 * `s3`/`s3_video` rows directly; only `legacy_base64` rows get masked
 * behind `/catalog/images/:id` there. The join condition must list every
 * `src`-less storage kind explicitly (`cloudinary`, `cloudinary_video`,
 * `s3`, `s3_video`) — a kind missing here is silently dropped from the
 * public response entirely, not just un-rendered, since the row never
 * even gets fetched. (`s3`/`s3_video` are listed here even though nothing
 * writes such a row yet — this query must already be correct for the PR
 * that starts writing them, same as `cloudinary`/`cloudinary_video` had
 * to be from the moment that storage kind was introduced.)
 *
 * `images.src` is a plain column select, not a raw `CASE` expression: an
 * earlier attempt to skip detoasting `legacy_base64`'s base64 payload via
 * `addSelect("CASE WHEN ... END", "images_src")` turned out not to
 * hydrate onto the entity at all under TypeORM's raw-alias hydration —
 * confirmed against real Postgres in CI, where it silently broke `src`
 * for every row, not just `legacy_base64` ones. `stripImageSrc` still
 * nulls `legacy_base64`'s `src` out at the application layer (defense in
 * depth, and now the only layer doing it), so no base64 payload reaches a
 * public response either way; the DB-side detoast-avoidance is a known,
 * accepted regression pending a follow-up that validates a safer
 * mechanism (e.g. `getRawAndEntities()` with manual zipping) against a
 * real database before landing it again. Admin's "embedImages" path
 * (`CatalogAdminService`/`productIncludeWithSrc`) uses a separate
 * `relations: { images: true }` TypeORM `find`/`findOne` call, not this
 * query builder, so it is unaffected and still always gets the full `src`.
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
      "images.src IS NOT NULL OR images.storage IN ('cloudinary', 'cloudinary_video', 's3', 's3_video')",
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
      "images.src",
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
