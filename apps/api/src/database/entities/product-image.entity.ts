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

/**
 * Which of the historically-overloaded `src` formats a row holds.
 */
export type ProductImageStorage =
  "static" | "legacy_base64" | "external" | "seaweedfs" | "seaweedfs_video";

/**
 * Storage kinds that legitimately persist `src: null` and resolve their
 * delivery URL from `objectKey` instead (see `product.mapper.ts#imageSrc`).
 * `catalog.query.ts`'s public `leftJoin` must allow every kind listed here
 * through, or rows of that kind are silently dropped from the public API
 * before they ever reach the mapper — this happened in production for
 * `seaweedfs`/`seaweedfs_video` rows, which were missing from that join's
 * whitelist for source-less remote-media rows.
 */
export const SRC_LESS_IMAGE_STORAGE_KINDS: ProductImageStorage[] = [
  "seaweedfs",
  "seaweedfs_video",
];

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

  /**
   * Stored as plain `text`, not a native Postgres enum, to match the rest
   * of this codebase's convention (e.g. `Order.status`, `Product.status`):
   * a TS union type at the app layer, no DB-level enum type to migrate
   * alongside every future value addition.
   */
  @Column("text", { nullable: true })
  storage!: ProductImageStorage | null;

  /** Object key used by the S3-compatible media storage. */
  @Column("text", { nullable: true })
  objectKey!: string | null;

  /** Legacy optional media field retained for existing database compatibility. */
  @Column("text", { nullable: true })
  secureUrl!: string | null;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
