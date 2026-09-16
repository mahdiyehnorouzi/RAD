import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createAppDataSource } from "../src/database/data-source";
import { Product, ProductImage, Vendor } from "../src/database/entities";
import { seedProducts, seedVendors } from "./data";
import { ensureStaff } from "./ensure-staff";
import { seedCommerce } from "./seed-commerce";

const seedAssetsDir = path.join(__dirname, "seed-assets");

function seedImageSrc(slug: string, imageIndex: number) {
  const suffix = imageIndex === 0 ? "" : `-${imageIndex + 1}`;
  const filePath = path.join(seedAssetsDir, `${slug}${suffix}.webp`);
  if (!existsSync(filePath)) return undefined;
  return `data:image/webp;base64,${readFileSync(filePath).toString("base64")}`;
}

async function main() {
  const dataSource = createAppDataSource();
  await dataSource.initialize();
  try {
    await ensureStaff(dataSource);

    const vendors = dataSource.getRepository(Vendor);
    const products = dataSource.getRepository(Product);
    const images = dataSource.getRepository(ProductImage);

    for (const vendor of seedVendors) {
      const existing = await vendors.findOne({ where: { id: vendor.id } });
      if (existing) await vendors.update({ id: vendor.id }, vendor);
      else await vendors.save(vendors.create(vendor));
    }

    for (const [index, product] of seedProducts.entries()) {
      const { images: imageRows, details, en, vendorId, ...rest } = product;
      const existing = await products.findOne({ where: { slug: product.slug } });
      const row = {
        ...rest,
        sortOrder: index,
        vendorId: vendorId ?? null,
        details,
        en,
      };
      if (existing) await products.update({ slug: product.slug }, row);
      else await products.save(products.create(row));

      await images.delete({ productSlug: product.slug });
      if (imageRows.length) {
        const rows = imageRows.flatMap((image, sortOrder) => {
          const embeddedSrc =
            "src" in image && typeof image.src === "string" ? image.src : undefined;
          const src = embeddedSrc ?? seedImageSrc(product.slug, sortOrder) ?? null;
          if (!src) return [];
          return [
            images.create({
              productSlug: product.slug,
              sortOrder,
              alt: image.alt,
              enAlt: image.enAlt,
              color: "color" in image ? image.color : null,
              accent: "accent" in image ? image.accent : null,
              shape: "shape" in image ? image.shape : null,
              src,
            }),
          ];
        });
        if (rows.length) await images.save(rows);
      }
    }

    await seedCommerce(dataSource);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
