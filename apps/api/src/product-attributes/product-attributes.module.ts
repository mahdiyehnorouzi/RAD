import { Module } from "@nestjs/common";
import { ProductAttributesService } from "./product-attributes.service";

@Module({
  providers: [ProductAttributesService],
  exports: [ProductAttributesService],
})
export class ProductAttributesModule {}
