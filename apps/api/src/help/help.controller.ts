import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { HelpService } from "./help.service";

@ApiTags("help")
@Controller("help")
export class HelpController {
  constructor(private readonly help: HelpService) {}

  @Get("questions")
  @ApiOperation({ summary: "Common questions on the help page, in order" })
  @ApiOkResponse({ description: "Bilingual questions, each optionally linked to a policy section" })
  questions() {
    return this.help.list();
  }
}
