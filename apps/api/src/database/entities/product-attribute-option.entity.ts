import {
  BeforeInsert,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { newDbId } from "../ids";
import { ProductAttribute } from "./product-attribute.entity";

/** One selectable option of a `select`/`multiselect` attribute. */
@Entity("ProductAttributeOption")
export class ProductAttributeOption {
  @PrimaryColumn("text")
  id!: string;

  @Index()
  @Column("text")
  attributeId!: string;

  @ManyToOne(() => ProductAttribute, (attribute) => attribute.options, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "attributeId" })
  attribute!: ProductAttribute;

  /** Stable key stored on a product's value (e.g. `white`); never reused once referenced. */
  @Column("text")
  value!: string;

  /** Persian display label (e.g. سفید). */
  @Column("text")
  label!: string;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
