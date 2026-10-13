import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ArtistApplication } from "../database/entities";
import { IdentityService } from "../common/identity.service";
import type { Actor } from "../common/identity";
import { assertImageData } from "../common/image-data";
import { normalizeIranMobile } from "./contact";
import {
  ARTWORK_IMAGE_ERROR,
  ARTWORK_IMAGE_LIMIT,
  ARTWORK_IMAGE_MAX,
} from "./const";
import {
  toAdminArtistApplication,
  toCustomerArtistApplication,
} from "./artist-application.mapper";
import type { CreateArtistApplicationDto } from "./dto";
import type { ReviewArtistApplicationDto } from "./review-artist-application.dto";

@Injectable()
export class ArtistApplicationsService {
  constructor(
    @InjectRepository(ArtistApplication)
    private readonly applications: Repository<ArtistApplication>,
    private readonly identity: IdentityService,
  ) {}

  async create(actor: Actor, input: CreateArtistApplicationDto) {
    const contact = normalizeIranMobile(input.contact);
    if (!contact) {
      throw new BadRequestException({
        message: "شماره موبایل درست نیست. یه بار دیگه بررسیش کن.",
        code: "contact_invalid",
      });
    }
    const images = input.artworkImages.map((image) => image.trim());
    if (!images.length) {
      throw new BadRequestException({
        message: "حداقل یک نمونه از آثار خودت را بارگذاری کن.",
        code: "artwork_invalid",
      });
    }
    if (images.length > ARTWORK_IMAGE_MAX) {
      throw new BadRequestException({
        message: `حداکثر ${ARTWORK_IMAGE_MAX} تصویر مجاز است.`,
        code: "artwork_invalid",
      });
    }
    for (const image of images) {
      try {
        assertImageData(image, ARTWORK_IMAGE_LIMIT, ARTWORK_IMAGE_ERROR);
      } catch {
        throw new BadRequestException({
          message: ARTWORK_IMAGE_ERROR,
          code: "artwork_invalid",
        });
      }
    }
    const saved = await this.applications.save(
      this.applications.create({
        ownerKey: this.identity.key(actor),
        fullName: input.fullName.trim(),
        artistName: input.artistName?.trim() || null,
        contact,
        city: input.city.trim(),
        instagram: input.instagram?.trim().replace(/^@/, "") || null,
        artworkImages: images,
        about: input.about?.trim() || null,
        categories: input.categories,
        shippingMethod: input.shippingMethod,
        availability: input.availability?.trim() || null,
        status: "submitted",
      }),
    );
    return toCustomerArtistApplication(saved);
  }

  async listAll() {
    const rows = await this.applications.find({
      order: { createdAt: "DESC" },
      take: 300,
    });
    return rows.map(toAdminArtistApplication);
  }

  async review(id: string, input: ReviewArtistApplicationDto) {
    const row = await this.applications.findOne({ where: { id } });
    if (!row) throw new NotFoundException("درخواست همکاری پیدا نشد.");
    row.status = input.status;
    row.reviewNote = input.reviewNote?.trim() || null;
    await this.applications.save(row);
    return toAdminArtistApplication(row);
  }
}
