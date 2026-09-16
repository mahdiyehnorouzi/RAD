import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { newDbId } from "../ids";
import { CartItem } from "./cart-item.entity";
import { Favorite } from "./favorite.entity";
import { OrderItem } from "./order-item.entity";
import { ProductImage } from "./product-image.entity";
import { Review } from "./review.entity";
import { Vendor } from "./vendor.entity";

@Entity("Product")
export class Product {
  @PrimaryColumn("text")
  id!: string;

  @Column("text", { unique: true })
  slug!: string;

  @Column("text")
  name!: string;

  @Column("text")
  subtitle!: string;

  @Column("int")
  tomanPrice!: number;

  @Column("int")
  usdPrice!: number;

  @Column("text")
  color!: string;

  @Column("text")
  accent!: string;

  @Column("text")
  shape!: string;

  @Column("text")
  category!: string;

  @Column("text", { default: "available" })
  status!: string;

  @Column("text")
  story!: string;

  @Column("jsonb")
  details!: unknown;

  @Column("jsonb")
  en!: unknown;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @Column("text", { nullable: true })
  vendorId!: string | null;

  @ManyToOne(() => Vendor, (vendor) => vendor.products, { nullable: true })
  @JoinColumn({ name: "vendorId" })
  vendor!: Vendor | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => ProductImage, (image) => image.product)
  images!: ProductImage[];

  @OneToMany(() => CartItem, (item) => item.product)
  cartItems!: CartItem[];

  @OneToMany(() => Favorite, (favorite) => favorite.product)
  favorites!: Favorite[];

  @OneToMany(() => Review, (review) => review.product)
  reviews!: Review[];

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems!: OrderItem[];

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
