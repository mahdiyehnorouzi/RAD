import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CartItem, Product } from "../database/entities";
import { IdentityService } from "../common/identity.service";
import type { Actor } from "../common/identity";

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItems: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    private readonly identity: IdentityService,
  ) {}

  async get(actor: Actor) {
    const items = await this.cartItems.find({
      where: { ownerKey: this.identity.key(actor) },
      select: { id: true, productSlug: true },
      order: { createdAt: "ASC" },
    });
    return { slugs: items.map((item) => item.productSlug) };
  }

  async add(actor: Actor, slug: string) {
    const product = await this.products.findOne({
      where: { slug },
      select: { id: true, status: true },
    });
    if (!product || product.status === "draft") {
      throw new NotFoundException("اثر پیدا نشد.");
    }
    if (product.status === "sold" || product.status === "reserved") {
      throw new ConflictException("این اثر دیگر قابل افزودن به سبد نیست.");
    }
    const ownerKey = this.identity.key(actor);
    const existing = await this.cartItems.findOne({
      where: { ownerKey, productSlug: slug },
    });
    if (!existing) {
      await this.cartItems.save(this.cartItems.create({ ownerKey, productSlug: slug }));
    }
    return this.get(actor);
  }

  async remove(actor: Actor, slug: string) {
    await this.cartItems.delete({
      ownerKey: this.identity.key(actor),
      productSlug: slug,
    });
    return this.get(actor);
  }

  async clear(actor: Actor) {
    await this.cartItems.delete({ ownerKey: this.identity.key(actor) });
    return this.get(actor);
  }
}
