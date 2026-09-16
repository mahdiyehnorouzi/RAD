import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Favorite, Product } from "../database/entities";
import { IdentityService } from "../common/identity.service";
import type { Actor } from "../common/identity";

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favorites: Repository<Favorite>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    private readonly identity: IdentityService,
  ) {}

  async list(actor: Actor) {
    const rows = await this.favorites.find({
      where: { ownerKey: this.identity.key(actor) },
      order: { createdAt: "DESC" },
    });
    return { slugs: rows.map((row) => row.productSlug) };
  }

  async toggle(actor: Actor, slug: string) {
    const product = await this.products.findOne({ where: { slug } });
    if (!product || product.status === "draft") {
      throw new NotFoundException("اثر پیدا نشد.");
    }
    const ownerKey = this.identity.key(actor);
    const existing = await this.favorites.findOne({
      where: { ownerKey, productSlug: slug },
    });
    if (existing) {
      await this.favorites.delete({ id: existing.id });
      return { ...((await this.list(actor))), added: false };
    }
    await this.favorites.save(this.favorites.create({ ownerKey, productSlug: slug }));
    return { ...((await this.list(actor))), added: true };
  }
}
