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
 * `cloudinary` is the Phase 2 direct-upload path (admin dashboard images
 * uploaded straight to Cloudinary via a signed upload — see
 * `AdminService.replaceImages` / `cloudinary-storage.service.ts`).
 */
export type ProductImageStorage =
  | "static"
  | "legacy_base64"
  | "external"
  | "cloudinary";

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

  /**
   * For `storage: "cloudinary"` rows: the Cloudinary `public_id` — the
   * durable source of truth for the asset, not a stored URL. The delivery
   * URL is derived from this plus `CLOUDINARY_CLOUD_NAME` config at read
   * time (`product.mapper.ts#imageSrc`), never persisted as the only
   * record of where the image lives. Unused for other storage kinds.
   */
  @Column("text", { nullable: true })
  objectKey!: string | null;

  /**
   * Optional, cached convenience only: Cloudinary's `secure_url` as
   * returned by the signed upload, for a quick non-derived display value
   * (e.g. debugging, or an admin tool that wants the exact asset URL
   * Cloudinary minted). `objectKey` (the public_id) + Cloudinary config
   * remain the actual source of truth for every delivery URL this API
   * returns — this column is never read by `imageSrc`, and nothing
   * requires it to stay in sync with Cloudinary if the asset is later
   * transformed/moved there directly.
   */
  @Column("text", { nullable: true })
  secureUrl!: string | null;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
