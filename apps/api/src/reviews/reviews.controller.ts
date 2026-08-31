import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { IdentityService } from "../common/identity.service";
import { AuthGuard } from "../common/guards/auth.guard";
import type { AuthedRequest } from "../common/session.middleware";

@Controller("products/:slug/reviews")
export class ReviewsController {
  constructor(
    private readonly reviews: ReviewsService,
    private readonly identity: IdentityService,
  ) {}

  @Get()
  list(@Param("slug") slug: string) {
    return this.reviews.list(slug);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Param("slug") slug: string,
    @Body() body: CreateReviewDto,
    @Req() request: AuthedRequest,
  ) {
    return this.reviews.create(await this.identity.fromRequest(request), slug, body);
  }
}
