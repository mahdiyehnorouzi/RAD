import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { newDbId } from "../ids";
import { ProductAttributeCategory } from "./product-attribute-category.entity";
import { ProductAttributeOption } from "./product-attribute-option.entity";

/**
 * An admin-defined product spec (رنگ، جنس، ارتفاع، …), configurable without
 * touching code. `key` is the stable identifier a product's
 * {@link ProductAttributeValue} rows reference; `label` is the Persian
 * display name shown in the admin and storefront.
 */
@Entity("ProductAttribute")
@Unique("ProductAttribute_key_key", ["key"])
export class ProductAttribute {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  key!: string;

  @Column("text")
  label!: string;

  /** text | number | select | multiselect | boolean */
  @Column("text")
  inputType!: string;

  /** Shown next to a `number` value (e.g. سانتی‌متر). */
  @Column("text", { nullable: true })
  unit!: string | null;

  @Column("boolean", { default: false })
  required!: boolean;

  @Column("boolean", { default: true })
  active!: boolean;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @OneToMany(() => ProductAttributeOption, (option) => option.attribute, {
    cascade: true,
  })
  options!: ProductAttributeOption[];

  @OneToMany(() => ProductAttributeCategory, (link) => link.attribute, {
    cascade: true,
  })
  categoryLinks!: ProductAttributeCategory[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
