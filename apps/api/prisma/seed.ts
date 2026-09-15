import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { seedProducts, seedVendors } from "./data";
import { ensureStaff } from "./ensure-staff";
import { seedCommerce } from "./seed-commerce";

const prisma = new PrismaClient();
const seedAssetsDir = path.join(__dirname, "seed-assets");

function seedImageSrc(slug: string, imageIndex: number) {
  const suffix = imageIndex === 0 ? "" : `-${imageIndex + 1}`;
  const filePath = path.join(seedAssetsDir, `${slug}${suffix}.webp`);
  if (!existsSync(filePath)) return undefined;
  return `data:image/webp;base64,${readFileSync(filePath).toString("base64")}`;
}

async function main() {
  await ensureStaff(prisma);

  for (const vendor of seedVendors) {
    await prisma.vendor.upsert({
      where: { id: vendor.id },
      update: vendor,
      create: vendor,
    });
  }

  for (const [index, product] of seedProducts.entries()) {
    const { images, details, en, vendorId, ...rest } = product;
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        ...rest,
        sortOrder: index,
        vendorId: vendorId ?? null,
        details,
        en,
      },
      create: {
        ...rest,
        sortOrder: index,
        vendorId: vendorId ?? null,
        details,
        en,
      },
    });
    await prisma.productImage.deleteMany({ where: { productSlug: product.slug } });
    if (images.length) {
      await prisma.productImage.createMany({
        data: images.map((image, sortOrder) => ({
          productSlug: product.slug,
          sortOrder,
          ...image,
          src:
            "src" in image && image.src
              ? image.src
              : seedImageSrc(product.slug, sortOrder),
        })),
      });
    }
  }

  await seedCommerce(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
