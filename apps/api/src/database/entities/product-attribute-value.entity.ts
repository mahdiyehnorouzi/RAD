import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { newDbId } from "../ids";
import { Product } from "./product.entity";
import { ProductAttribute } from "./product-attribute.entity";

/**
 * One product's saved value for one attribute. `value` holds whatever shape
 * the attribute's `inputType` expects (string/number/boolean/string[]),
 * never validated again at this layer — `ProductAttributesService` is the
 * only writer and already validated it against the live definition.
 *
 * Rows are never deleted just because an attribute stops applying to a
 * product's current category (see `ProductAttributesService.saveValuesForProduct`)
 * — only an explicit attribute deletion, or the product itself being
 * deleted, removes them.
 */
@Entity("ProductAttributeValue")
@Unique("ProductAttributeValue_productId_attributeId_key", [
  "productId",
  "attributeId",
])
export class ProductAttributeValue {
  @PrimaryColumn("text")
  id!: string;

  @Index()
  @Column("text")
  productId!: string;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product!: Product;

  @Index()
  @Column("text")
  attributeId!: string;

  @ManyToOne(() => ProductAttribute, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "attributeId" })
  attribute!: ProductAttribute;

  @Column("jsonb")
  value!: unknown;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
