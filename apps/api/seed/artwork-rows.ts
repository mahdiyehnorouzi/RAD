import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { artists, type ArtworkRecord } from "@rad/artworks";
import { IsNull, Not, type DataSource, type DeepPartial } from "typeorm";
import {
  Product,
  ProductImage,
  RadIdentity,
  Vendor,
} from "../src/database/entities";
import { assignNewNumberToExistingProduct } from "../src/identities/identity.allocator";
import { plannedSeedRadNumber } from "./identity-seed";

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
 * Upserts works by slug. A number already reserved, retired, or held by a
 * different work is never taken. `status` is set only on insert: after that
 * the API owns it, and re-seeding must not resell a sold work.
 */
export async function seedArtworks(
  dataSource: DataSource,
  records: ArtworkRecord[],
  sortOrderFor: (record: ArtworkRecord) => number,
) {
  const products = dataSource.getRepository(Product);
  const images = dataSource.getRepository(ProductImage);
  const identities = dataSource.getRepository(RadIdentity);

  for (const record of records) {
    const existing = await products.findOne({ where: { slug: record.slug } });
    const holder = await products.findOne({
      where: { radNumber: record.radNumber },
    });
    const identity = await identities.findOne({
      where: { radNumber: record.radNumber },
    });
    const radNumber = plannedSeedRadNumber({
      recordNumber: record.radNumber,
      existingProductId: existing?.id ?? null,
      existingProductNumber: existing?.radNumber ?? null,
      holderProductId: holder?.id ?? null,
      identity: identity
        ? { status: identity.status, productId: identity.productId }
        : null,
    });
    const row = artworkRow(
      { ...record, radNumber: radNumber ?? record.radNumber },
      sortOrderFor(record),
    );
    row.radNumber = radNumber;
    if (existing) {
      const { status: _status, ...content } = row;
      if (existing.radNumber != null) content.radNumber = existing.radNumber;
      await products.save(products.merge(existing, content));
    } else {
      await products.save(products.create(row));
    }
    const saved = await products.findOne({ where: { slug: record.slug } });
    if (saved?.radNumber != null) {
      await ensureSeedIdentity(dataSource, saved.id, saved.radNumber);
    }

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

async function ensureSeedIdentity(
  dataSource: DataSource,
  productId: string,
  radNumber: number,
) {
  const identities = dataSource.getRepository(RadIdentity);
  const identity = await identities.findOne({ where: { radNumber } });
  if (!identity) {
    await identities.save(
      identities.create({
        radNumber,
        productId,
        status: "assigned",
        batchId: null,
        reservedAt: new Date(),
        assignedAt: new Date(),
        printedAt: null,
      }),
    );
    return;
  }
  if (identity.productId === productId && identity.status === "assigned")
    return;
}

/** Works created outside the registry get the next number from the shared allocator. */
export async function backfillRadNumbers(dataSource: DataSource) {
  const products = dataSource.getRepository(Product);
  const missing = await products.find({
    where: { radNumber: IsNull(), id: Not(IsNull()) },
    order: { sortOrder: "ASC", createdAt: "ASC" },
  });
  for (const product of missing) {
    await assignNewNumberToExistingProduct(dataSource, product.id);
  }
}
