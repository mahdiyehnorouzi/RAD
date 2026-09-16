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
} from "typeorm";
import { newDbId } from "../ids";
import { Product } from "./product.entity";

@Entity("CartItem")
@Unique("CartItem_ownerKey_productSlug_key", ["ownerKey", "productSlug"])
export class CartItem {
  @PrimaryColumn("text")
  id!: string;

  @Index()
  @Column("text")
  ownerKey!: string;

  @Column("text")
  productSlug!: string;

  @ManyToOne(() => Product, (product) => product.cartItems)
  @JoinColumn({ name: "productSlug", referencedColumnName: "slug" })
  product!: Product;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
