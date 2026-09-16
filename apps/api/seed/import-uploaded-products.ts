import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { In } from "typeorm";
import { createAppDataSource } from "../src/database/data-source";
import { Product, ProductImage, Vendor } from "../src/database/entities";
import { photoProducts } from "./photo-products";

const seedAssetsDir = path.join(__dirname, "seed-assets");
const uploadedSlugs = new Set([
  "cobalt-ripple-tray",
  "pink-petal-cup",
  "cobalt-fold-bowl",
  "croissant-handle-mug",
]);

function uploadedImageSrc(slug: string, imageIndex: number) {
  const suffix = imageIndex === 0 ? "" : `-${imageIndex + 1}`;
  const filePath = path.join(seedAssetsDir, `${slug}${suffix}.webp`);
  if (!existsSync(filePath)) {
    throw new Error(`Missing uploaded product image: ${filePath}`);
  }
  return `data:image/webp;base64,${readFileSync(filePath).toString("base64")}`;
}

async function main() {
  const products = photoProducts.filter((product) => uploadedSlugs.has(product.slug));
  if (products.length !== uploadedSlugs.size) {
    throw new Error("Uploaded product metadata is incomplete.");
  }

  const dataSource = createAppDataSource();
  await dataSource.initialize();
  try {
    const vendors = dataSource.getRepository(Vendor);
    const productRepo = dataSource.getRepository(Product);
    const images = dataSource.getRepository(ProductImage);

    const existingVendor = await vendors.findOne({ where: { id: "rad-studio" } });
    if (!existingVendor) {
      await vendors.save(
        vendors.create({
          id: "rad-studio",
          displayName: "استودیو رَد",
          displayNameEn: "RAD Studio",
          kind: "rad",
          verified: true,
        }),
      );
    }
    const studio = await vendors.findOne({ where: { id: "rad-studio" } });
    if (!studio) throw new Error("Required RAD Studio vendor record was not created.");

    const highest = await productRepo
      .createQueryBuilder("product")
      .select("MAX(product.sortOrder)", "max")
      .getRawOne<{ max: string | null }>();
    const firstSortOrder = Number(highest?.max ?? -1) + 1;

    for (const [productIndex, product] of products.entries()) {
      const { images: imageRows, details, en, vendorId, ...rest } = product;
      const existing = await productRepo.findOne({ where: { slug: product.slug } });
      const sortOrder = existing?.sortOrder ?? firstSortOrder + productIndex;
      const row = {
        ...rest,
        sortOrder,
        details,
        en,
        vendorId: vendorId ?? null,
      };
      if (existing) await productRepo.update({ slug: product.slug }, row);
      else await productRepo.save(productRepo.create(row));

      await images.delete({ productSlug: product.slug });
      await images.save(
        imageRows.map((image, imageIndex) =>
          images.create({
            productSlug: product.slug,
            sortOrder: imageIndex,
            ...image,
            src: uploadedImageSrc(product.slug, imageIndex),
          }),
        ),
      );
    }

    const imported = await productRepo.find({
      where: { slug: In([...uploadedSlugs]) },
      relations: { images: true },
      order: { sortOrder: "ASC" },
    });
    console.log(
      imported.map((product) => `${product.slug}: ${product.images.length} image(s)`).join("\n"),
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
