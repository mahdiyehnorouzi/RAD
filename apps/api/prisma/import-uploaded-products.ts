import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { photoProducts } from "./photo-products";

const prisma = new PrismaClient();
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

  await prisma.vendor.upsert({
    where: { id: "rad-studio" },
    update: {},
    create: {
      id: "rad-studio",
      displayName: "استودیو رَد",
      displayNameEn: "RAD Studio",
      kind: "rad",
      verified: true,
    },
  });
  const studio = await prisma.vendor.findUnique({ where: { id: "rad-studio" } });
  if (!studio) throw new Error("Required RAD Studio vendor record was not created.");

  const highestSortOrder = await prisma.product.aggregate({ _max: { sortOrder: true } });
  const firstSortOrder = (highestSortOrder._max.sortOrder ?? -1) + 1;

  for (const [productIndex, product] of products.entries()) {
    const { images, details, en, vendorId, ...rest } = product;
    const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
    const sortOrder = existing?.sortOrder ?? firstSortOrder + productIndex;

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        ...rest,
        details,
        en,
        vendor: vendorId ? { connect: { id: vendorId } } : { disconnect: true },
      },
      create: {
        ...rest,
        sortOrder,
        details,
        en,
        vendor: vendorId ? { connect: { id: vendorId } } : undefined,
      },
    });

    await prisma.productImage.deleteMany({ where: { productSlug: product.slug } });
    await prisma.productImage.createMany({
      data: images.map((image, imageIndex) => ({
        productSlug: product.slug,
        sortOrder: imageIndex,
        ...image,
        src: uploadedImageSrc(product.slug, imageIndex),
      })),
    });
  }

  const imported = await prisma.product.findMany({
    where: { slug: { in: [...uploadedSlugs] } },
    select: { slug: true, images: { select: { id: true } } },
    orderBy: { sortOrder: "asc" },
  });
  console.log(imported.map((product) => `${product.slug}: ${product.images.length} image(s)`).join("\n"));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
