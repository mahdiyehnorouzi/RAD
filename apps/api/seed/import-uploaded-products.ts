import { artworkRecords } from "@rad/artworks";
import { In } from "typeorm";
import { createAppDataSource } from "../src/database/data-source";
import { Product } from "../src/database/entities";
import { seedArtists, seedArtworks } from "./artwork-rows";

const uploadedSlugs = new Set([
  "cobalt-ripple-tray",
  "pink-petal-cup",
  "cobalt-fold-bowl",
  "croissant-handle-mug",
]);

async function main() {
  const records = artworkRecords.filter((record) =>
    uploadedSlugs.has(record.slug),
  );
  if (records.length !== uploadedSlugs.size) {
    throw new Error("Uploaded product metadata is incomplete.");
  }

  const dataSource = createAppDataSource();
  await dataSource.initialize();
  try {
    const products = dataSource.getRepository(Product);
    await seedArtists(dataSource);
    const existing = await products.find({
      where: { slug: In([...uploadedSlugs]) },
    });
    const highest = await products
      .createQueryBuilder("product")
      .select("MAX(product.sortOrder)", "max")
      .getRawOne<{ max: string | null }>();
    let nextSortOrder = Number(highest?.max ?? -1) + 1;
    const sortOrders = new Map(
      existing.map((product) => [product.slug, product.sortOrder]),
    );
    await seedArtworks(
      dataSource,
      records,
      (record) => sortOrders.get(record.slug) ?? nextSortOrder++,
    );

    const imported = await products.find({
      where: { slug: In([...uploadedSlugs]) },
      relations: { images: true },
      order: { radNumber: "ASC" },
    });
    console.log(
      imported
        .map(
          (product) =>
            `RAD-${String(product.radNumber).padStart(3, "0")} ${product.slug}: ${product.images.length} image(s)`,
        )
        .join("\n"),
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
