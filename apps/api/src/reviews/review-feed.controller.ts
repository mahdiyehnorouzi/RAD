import { Controller, Get } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";

@Controller("reviews")
export class ReviewFeedController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  feed() {
    return this.reviews.feed();
  }
}
