import { Controller, Get, Param, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("products")
  list(@Query("category") category?: string) {
    return this.catalog.list(category);
  }

  @Get("products/:slug")
  bySlug(@Param("slug") slug: string) {
    return this.catalog.bySlug(slug);
  }

  @Get("products/:slug/related")
  related(@Param("slug") slug: string) {
    return this.catalog.related(slug);
  }

  @Get("search")
  search(@Query("q") query = "", @Query("locale") locale: "fa" | "en" = "fa") {
    return this.catalog.search(query, locale === "en" ? "en" : "fa");
  }
}
