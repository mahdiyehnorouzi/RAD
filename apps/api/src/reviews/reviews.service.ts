import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
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
  constructor(private readonly prisma: PrismaService) {}

  async list(slug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product || product.status === "draft") {
      throw new NotFoundException("اثر پیدا نشد.");
    }
    const reviews = await this.prisma.review.findMany({
      where: { productSlug: slug },
      orderBy: { createdAt: "desc" },
    });
    return reviews.map(this.toReview);
  }

  async create(actor: Actor, slug: string, input: { rating: number; comment: string; image?: string }) {
    if (!actor.user) throw new BadRequestException("برای ثبت نظر باید وارد شوید.");
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product || product.status === "draft") {
      throw new NotFoundException("اثر پیدا نشد.");
    }
    assertImage(input.image);
    const review = await this.prisma.review.create({
      data: {
        productSlug: slug,
        userId: actor.user.id,
        author: actor.user.name,
        rating: input.rating,
        comment: input.comment.trim(),
        image: input.image,
      },
    });
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
