import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { newDbId } from "../ids";
import { Product } from "./product.entity";

@Entity("ProductImage")
export class ProductImage {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  productSlug!: string;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productSlug", referencedColumnName: "slug" })
  product!: Product;

  @Column("text")
  alt!: string;

  @Column("text")
  enAlt!: string;

  @Column("text", { nullable: true })
  color!: string | null;

  @Column("text", { nullable: true })
  accent!: string | null;

  @Column("text", { nullable: true })
  shape!: string | null;

  @Column("text", { nullable: true })
  src!: string | null;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
