import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product, Review } from "../database/entities";
import type { Actor } from "../common/identity";

const allowedImage = /^data:image\/(jpeg|png|webp);base64,/i;
const maxImageBytes = 1024 * 1024;

function assertImage(image?: string) {
  if (!image) return;
  if (!allowedImage.test(image)) {
    throw new BadRequestException("فقط تصویر JPEG، PNG یا WebP تا ۱ مگابایت مجاز است.");
  }
  const base64 = image.split(",")[1] ?? "";
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes === 0 || bytes > maxImageBytes) {
    throw new BadRequestException("فقط تصویر JPEG، PNG یا WebP تا ۱ مگابایت مجاز است.");
  }
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(Review)
    private readonly reviews: Repository<Review>,
  ) {}

  async list(slug: string) {
    const product = await this.products.findOne({ where: { slug } });
    if (!product || product.status === "draft") {
      throw new NotFoundException("اثر پیدا نشد.");
    }
    const reviews = await this.reviews.find({
      where: { productSlug: slug },
      order: { createdAt: "DESC" },
    });
    return reviews.map((review) => this.toReview(review));
  }

  async create(actor: Actor, slug: string, input: { rating: number; comment: string; image?: string }) {
    if (!actor.user) throw new BadRequestException("برای ثبت نظر باید وارد شوید.");
    const product = await this.products.findOne({ where: { slug } });
    if (!product || product.status === "draft") {
      throw new NotFoundException("اثر پیدا نشد.");
    }
    assertImage(input.image);
    const review = await this.reviews.save(
      this.reviews.create({
        productSlug: slug,
        userId: actor.user.id,
        author: actor.user.name,
        rating: input.rating,
        comment: input.comment.trim(),
        image: input.image ?? null,
      }),
    );
    return this.toReview(review);
  }

  private toReview(review: {
    id: string;
    productSlug: string;
    author: string;
    rating: number;
    comment: string;
    image: string | null;
    createdAt: Date;
  }) {
    return {
      id: review.id,
      productSlug: review.productSlug,
      author: review.author,
      rating: review.rating,
      comment: review.comment,
      image: review.image ?? undefined,
      createdAt: review.createdAt.getTime(),
    };
  }
}
