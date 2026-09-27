import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
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

/** One row per artwork; commerce reads it as a product. */
@Entity("Product")
export class Product {
  @PrimaryColumn("text")
  id!: string;

  /** Permanent archive number (`RAD / 041`). */
  @Column("int", { unique: true, nullable: true })
  radNumber!: number | null;

  @Column("text", { unique: true })
  slug!: string;

  @Column("text")
  name!: string;

  @Column("text")
  subtitle!: string;

  /** `null` for archive works that were never offered for sale. */
  @Column("int", { nullable: true })
  tomanPrice!: number | null;

  @Column("int", { nullable: true })
  usdPrice!: number | null;

  @Column("int", { nullable: true })
  year!: number | null;

  /** `{ body, surface, process }`, each `{ fa, en }`. */
  @Column("jsonb", { nullable: true })
  materials!: unknown;

  @Column("jsonb", { nullable: true })
  dimensions!: unknown;

  @Column("jsonb", { nullable: true })
  care!: unknown;

  @Column("jsonb", { nullable: true })
  owner!: unknown;

  @Column("jsonb", { nullable: true })
  passport!: unknown;

  @Column("jsonb", { nullable: true })
  difference!: unknown;

  @Column("text")
  color!: string;

  @Column("text")
  accent!: string;

  @Column("text")
  shape!: string;

  @Column("text")
  category!: string;

  @Index()
  @Column("text", { default: "draft" })
  status!: string;

  /** Set while a cart/checkout holds the work as `sold`; cleared once paid. */
  @Index()
  @Column({ type: "timestamptz", nullable: true })
  holdExpiresAt!: Date | null;

  /** Owner key (`user:…` / `guest:…`) of the cart that holds the work. */
  @Column("text", { nullable: true })
  heldBy!: string | null;

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
