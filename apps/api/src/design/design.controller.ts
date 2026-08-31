import { Body, Controller, Post } from "@nestjs/common";
import { DesignService } from "./design.service";
import { GenerateDesignDto } from "./dto/generate.dto";

@Controller("design")
export class DesignController {
  constructor(private readonly design: DesignService) {}

  @Post()
  generate(@Body() body: GenerateDesignDto) {
    return this.design.generate(body.prompt);
  }
}
