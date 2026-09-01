import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { seedProducts, seedVendors } from "./data";

const prisma = new PrismaClient();
const seedAssetsDir = path.join(__dirname, "seed-assets");

function seedImageSrc(slug: string) {
  const filePath = path.join(seedAssetsDir, `${slug}.webp`);
  if (!existsSync(filePath)) return undefined;
  return `data:image/webp;base64,${readFileSync(filePath).toString("base64")}`;
}

async function seedStaff() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "mahdiyeh.norozi77@gmail.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "rad-studio-owner";
  const passwordHash = await hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "مهدیه نوروزی",
      passwordHash,
      role: "admin",
      adminRole: "owner",
      status: "active",
    },
    create: {
      name: "مهدیه نوروزی",
      email: adminEmail,
      passwordHash,
      role: "admin",
      adminRole: "owner",
      status: "active",
    },
  });

  const editorHash = await hash("rad-editor-2026", 12);
  await prisma.user.upsert({
    where: { email: "sahar@rad.studio" },
    update: {
      name: "سحر میرزایی",
      role: "artist",
      adminRole: "editor",
      status: "active",
    },
    create: {
      name: "سحر میرزایی",
      email: "sahar@rad.studio",
      passwordHash: editorHash,
      role: "artist",
      adminRole: "editor",
      status: "active",
    },
  });
}

async function main() {
  await seedStaff();

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
      const photo = seedImageSrc(product.slug);
      await prisma.productImage.createMany({
        data: images.map((image, sortOrder) => ({
          productSlug: product.slug,
          sortOrder,
          ...image,
          src: "src" in image && image.src ? image.src : photo,
        })),
      });
    }
  }
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
