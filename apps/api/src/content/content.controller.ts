import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ContentService } from "./content.service";

@ApiTags("content")
@Controller("content")
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get("faq")
  @ApiOperation({ summary: "Product page shipping FAQ" })
  @ApiQuery({ name: "locale", required: false, enum: ["fa", "en"], example: "fa" })
  @ApiOkResponse({
    description: "Localized FAQ section for product detail pages",
    schema: {
      example: {
        eyebrow: "ارسال آثار رَد",
        title: "پیش از خرید بدانید",
        items: [
          {
            id: "damage",
            icon: "shield-check",
            question: "اگر اثر در ارسال آسیب ببیند؟",
            answer:
              "تمام آثار بیمه‌اند. آسیب را تا ۲۴ ساعت با عکس اعلام کنید؛ رَد مسئول پیگیری و جبران است.",
          },
        ],
      },
    },
  })
  faq(@Query("locale") locale: "fa" | "en" = "fa") {
    return this.content.faq(locale === "en" ? "en" : "fa");
  }
}
