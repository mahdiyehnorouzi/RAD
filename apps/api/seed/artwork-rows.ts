import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { artists, type ArtworkRecord } from "@rad/artworks";
import { In, IsNull, Not, type DataSource, type DeepPartial } from "typeorm";
import { nextRadNumber } from "../src/catalog/rad-number";
import { Product, ProductImage, Vendor } from "../src/database/entities";

const seedAssetsDir = path.join(__dirname, "seed-assets");

function seedImageSrc(slug: string, imageIndex: number) {
  const suffix = imageIndex === 0 ? "" : `-${imageIndex + 1}`;
  const filePath = path.join(seedAssetsDir, `${slug}${suffix}.webp`);
  if (!existsSync(filePath)) return undefined;
  return `data:image/webp;base64,${readFileSync(filePath).toString("base64")}`;
}

/** Legacy `details` list read by `/products`, derived from the artwork fields. */
function detailLines(record: ArtworkRecord, locale: "fa" | "en") {
  const lines = [
    record.dimensions,
    record.materials.body,
    record.materials.surface,
  ]
    .filter((line): line is NonNullable<typeof line> => Boolean(line))
    .map((line) => line[locale]);
  return [...lines, locale === "fa" ? "تنها یک نسخه" : "One of one"];
}

export function artworkRow(
  record: ArtworkRecord,
  sortOrder: number,
): DeepPartial<Product> {
  return {
    radNumber: record.radNumber,
    slug: record.slug,
    name: record.title.fa,
    subtitle: record.description.fa,
    story: record.story.fa,
    details: detailLines(record, "fa"),
    en: {
      name: record.title.en,
      subtitle: record.description.en,
      story: record.story.en,
      details: detailLines(record, "en"),
    },
    tomanPrice: record.price,
    usdPrice: record.usdPrice,
    color: record.color,
    accent: record.accent,
    shape: record.shape,
    category: record.category,
    status: record.initialStatus,
    year: record.year,
    materials: record.materials,
    dimensions: record.dimensions,
    care: record.care,
    owner: record.owner,
    passport: record.passport,
    difference: record.difference,
    vendorId: record.artistId,
    sortOrder,
  };
}

export async function seedArtists(dataSource: DataSource) {
  const vendors = dataSource.getRepository(Vendor);
  for (const artist of artists) {
    const row = {
      id: artist.id,
      displayName: artist.name.fa,
      displayNameEn: artist.name.en,
      kind: artist.kind,
      verified: artist.verified,
    };
    const existing = await vendors.findOne({ where: { id: artist.id } });
    if (existing) await vendors.update({ id: artist.id }, row);
    else await vendors.save(vendors.create(row));
  }
}

/**
 * Upserts works by slug. Numbers held by other rows are released first so a
 * registry number always points at exactly one work.
 */
export async function seedArtworks(
  dataSource: DataSource,
  records: ArtworkRecord[],
  sortOrderFor: (record: ArtworkRecord) => number,
) {
  const products = dataSource.getRepository(Product);
  const images = dataSource.getRepository(ProductImage);
  await products.update(
    { radNumber: In(records.map((record) => record.radNumber)) },
    { radNumber: null },
  );

  for (const record of records) {
    const row = artworkRow(record, sortOrderFor(record));
    const existing = await products.findOne({ where: { slug: record.slug } });
    await products.save(
      existing ? products.merge(existing, row) : products.create(row),
    );

    const imageRows = record.images.flatMap((image, sortOrder) => {
      const src = seedImageSrc(record.slug, sortOrder);
      if (!src) return [];
      return [
        images.create({
          productSlug: record.slug,
          sortOrder,
          alt: image.alt,
          enAlt: image.enAlt,
          color: image.color ?? null,
          accent: image.accent ?? null,
          shape: image.shape ?? null,
          src,
        }),
      ];
    });
    if (imageRows.length) {
      await images.delete({ productSlug: record.slug });
      await images.save(imageRows);
    }
  }
}

/** Works created outside the registry (admin uploads) get the next free numbers. */
export async function backfillRadNumbers(dataSource: DataSource) {
  const products = dataSource.getRepository(Product);
  const missing = await products.find({
    where: { radNumber: IsNull(), id: Not(IsNull()) },
    order: { sortOrder: "ASC", createdAt: "ASC" },
  });
  let next = await nextRadNumber(products);
  for (const product of missing) {
    await products.update({ id: product.id }, { radNumber: next });
    next += 1;
  }
}
