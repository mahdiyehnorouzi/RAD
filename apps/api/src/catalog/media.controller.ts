import { Controller, Get, NotFoundException, Param, Res } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Response } from "express";
import { Repository } from "typeorm";
import { ProductImage } from "../database/entities";

@Controller("catalog/images")
export class MediaController {
  constructor(
    @InjectRepository(ProductImage)
    private readonly images: Repository<ProductImage>,
  ) {}

  @Get(":id")
  async byId(@Param("id") id: string, @Res() res: Response) {
    const image = await this.images.findOne({ where: { id } });
    if (!image?.src?.startsWith("data:image/")) {
      throw new NotFoundException("تصویر پیدا نشد.");
    }
    const comma = image.src.indexOf(",");
    const meta = image.src.slice(0, comma);
    const base64 = image.src.slice(comma + 1);
    const mime = meta.match(/^data:(image\/[^;]+);base64$/)?.[1] ?? "image/webp";
    res.setHeader("Content-Type", mime);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(Buffer.from(base64, "base64"));
  }
}
