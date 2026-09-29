import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ShapeService } from "./shape.service";

@ApiTags("shape")
@Controller("shape")
export class ShapeController {
  constructor(private readonly shape: ShapeService) {}

  @Get("questions")
  @ApiOperation({ summary: "Questions of the “what shape is my RAD?” quiz, in order" })
  @ApiOkResponse({ description: "Bilingual quiz questions with two choices each" })
  questions() {
    return this.shape.list();
  }
}
