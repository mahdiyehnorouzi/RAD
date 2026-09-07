import { PrismaClient } from "@prisma/client";

const prices: Record<string, number> = {
  "blue-pedestal-tray": 3_500_000,
  "blue-pink-jar": 3_000_000,
  "cat-cup": 2_000_000,
  "contour-jar": 3_200_000,
  "dachshund-sculpture": 3_500_000,
  "olive-loop-vessel": 4_000_000,
  "blue-flower-portrait": 4_500_000,
  "mint-angular-cup": 2_000_000,
  "orange-boat-sculpture": 4_500_000,
  "spotted-loop-teapot": 4_000_000,
  "mint-loop-vessel": 3_800_000,
  "speckled-cup": 2_000_000,
  "speckled-sculpted-mug": 2_000_000,
  "yellow-graphic-pitcher": 3_500_000,
  "red-vessel-27": 4_500_000,
  "olive-memory": 4_000_000,
  "lut-line": 4_000_000,
  "night-clay": 4_000_000,
  "pomegranate-bowl": 4_000_000,
  "white-silence": 4_500_000,
  "blue-window": 6_000_000,
  "woven-garden": 4_000_000,
  "walnut-tide": 4_000_000,
  "silver-orbit": 3_000_000,
  "red-garden-print": 2_500_000,
  "quiet-weight": 5_000_000,
};

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.product.findMany({
    select: { slug: true, name: true, tomanPrice: true },
    orderBy: { sortOrder: "asc" },
  });
  const updates = existing.flatMap((product) => {
    const nextPrice = prices[product.slug];
    return nextPrice === undefined
      ? []
      : [
          {
            ...product,
            nextPrice,
            usdPrice: Math.max(1, Math.round(nextPrice / 85_000)),
          },
        ];
  });
  console.table(updates);
  const missing = existing.filter(
    (product) => prices[product.slug] === undefined,
  );
  if (missing.length)
    throw new Error(
      `No baseline price for: ${missing.map((product) => product.slug).join(", ")}`,
    );
  if (!apply) {
    console.log("Preview only. Re-run with --apply to update the database.");
    return;
  }
  await prisma.$transaction(
    updates.map((product) =>
      prisma.product.update({
        where: { slug: product.slug },
        data: { tomanPrice: product.nextPrice, usdPrice: product.usdPrice },
      }),
    ),
  );
  console.log(`Updated ${updates.length} product prices.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
