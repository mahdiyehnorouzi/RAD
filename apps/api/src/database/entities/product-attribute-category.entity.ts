import {
  BeforeInsert,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from "typeorm";
import { newDbId } from "../ids";
import { ProductAttribute } from "./product-attribute.entity";

/**
 * Which product category an attribute applies to. One attribute may have
 * several rows (many categories); a category may have several attributes.
 * `category` is the English store value persisted on `Product.category`
 * (see `apps/api/src/catalog/category.ts`), not the admin's Persian label.
 */
@Entity("ProductAttributeCategory")
@Unique("ProductAttributeCategory_attributeId_category_key", [
  "attributeId",
  "category",
])
export class ProductAttributeCategory {
  @PrimaryColumn("text")
  id!: string;

  @Index()
  @Column("text")
  attributeId!: string;

  @ManyToOne(() => ProductAttribute, (attribute) => attribute.categoryLinks, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "attributeId" })
  attribute!: ProductAttribute;

  @Index()
  @Column("text")
  category!: string;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
