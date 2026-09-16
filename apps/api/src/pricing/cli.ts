import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { In } from "typeorm";
import { createAppDataSource } from "../database/data-source";
import { Product } from "../database/entities";
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
  const config = JSON.parse(await readFile(configPath, "utf8")) as PricingConfig;
  if (!config.sources?.length) {
    throw new Error("Pricing config must include at least one source.");
  }

  const dataSource = createAppDataSource();
  await dataSource.initialize();
  try {
    const productsRepo = dataSource.getRepository(Product);
    const [comparables, products] = await Promise.all([
      crawl(config),
      productsRepo.find({
        where: { status: In(["available", "draft"]) },
      }),
    ]);
    const recommendations = products.map((product) =>
      recommendPrice(product, comparables, config),
    );
    if (apply) {
      const accepted = recommendations.filter(
        (item) => item.status === "recommended" && item.recommendedPriceToman,
      );
      await dataSource.transaction(async (manager) => {
        for (const item of accepted) {
          await manager.getRepository(Product).update(
            { id: item.productId },
            {
              tomanPrice: item.recommendedPriceToman!,
              usdPrice: Math.max(1, Math.round(item.recommendedPriceToman! / 85_000)),
            },
          );
        }
      });
    }
    await writeFile(
      outputPath,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          applied: apply,
          comparableCount: comparables.length,
          recommendations,
        },
        null,
        2,
      )}\n`,
    );
    console.log(
      `${apply ? "Applied" : "Reviewed"} ${recommendations.filter((item) => item.status === "recommended").length} safe recommendations. Report: ${outputPath}`,
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
