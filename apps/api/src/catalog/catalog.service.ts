import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { productInclude, publicProductWhere, toProduct } from "./product.mapper";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async list(category?: string) {
    const products = await this.prisma.product.findMany({
      where: {
        ...publicProductWhere,
        ...(category && category !== "all" ? { category } : {}),
      },
      include: productInclude,
      orderBy: { sortOrder: "asc" },
    });
    return products.map((product) => toProduct(product));
  }

  async bySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });
    if (!product || product.status === "draft" || product.status === "review") {
      throw new NotFoundException("اثر پیدا نشد.");
    }
    return toProduct(product);
  }

  async related(slug: string) {
    const products = await this.prisma.product.findMany({
      where: { slug: { not: slug }, ...publicProductWhere },
      include: productInclude,
      orderBy: { sortOrder: "asc" },
    });
    return products.map((product) => toProduct(product));
  }

  async search(query: string, locale: "fa" | "en" = "fa") {
    const needle = query.trim().toLocaleLowerCase(locale);
    if (!needle) return [];
    const products = await this.list();
    return products.filter((product) => {
      const copy = locale === "en" ? product.en : product;
      return `${copy.name} ${copy.subtitle} ${copy.story}`
        .toLocaleLowerCase(locale)
        .includes(needle);
    });
  }
}
