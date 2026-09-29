import { Module } from "@nestjs/common";
import { ShapeController } from "./shape.controller";
import { ShapeService } from "./shape.service";

@Module({
  controllers: [ShapeController],
  providers: [ShapeService],
  exports: [ShapeService],
})
export class ShapeModule {}
