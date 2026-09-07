import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { crawl } from "./crawler";
import { recommendPrice } from "./policy";
import type { PricingConfig } from "./types";

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
async function main() {
  const configPath = resolve(argument("--config") ?? "pricing.config.json");
  const outputPath = resolve(argument("--output") ?? "pricing-report.json");
  const apply = process.argv.includes("--apply");
  const config = JSON.parse(
    await readFile(configPath, "utf8"),
  ) as PricingConfig;
  if (!config.sources?.length)
    throw new Error("Pricing config must include at least one source.");
  const prisma = new PrismaClient();
  try {
    const [comparables, products] = await Promise.all([
      crawl(config),
      prisma.product.findMany({
        where: { status: { in: ["available", "draft"] } },
      }),
    ]);
    const recommendations = products.map((product) =>
      recommendPrice(product, comparables, config),
    );
    if (apply) {
      const accepted = recommendations.filter(
        (item) => item.status === "recommended" && item.recommendedPriceToman,
      );
      await prisma.$transaction(
        accepted.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: {
              tomanPrice: item.recommendedPriceToman!,
              usdPrice: Math.max(
                1,
                Math.round(item.recommendedPriceToman! / 85_000),
              ),
            },
          }),
        ),
      );
    }
    await writeFile(
      outputPath,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), applied: apply, comparableCount: comparables.length, recommendations }, null, 2)}\n`,
    );
    console.log(
      `${apply ? "Applied" : "Reviewed"} ${recommendations.filter((item) => item.status === "recommended").length} safe recommendations. Report: ${outputPath}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
