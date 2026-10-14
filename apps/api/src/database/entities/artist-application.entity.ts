import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { newDbId } from "../ids";

@Entity("ArtistApplication")
export class ArtistApplication {
  @PrimaryColumn("text")
  id!: string;

  @Column("text", { nullable: true })
  ownerKey!: string | null;

  @Column("text")
  fullName!: string;

  @Column("text", { nullable: true })
  artistName!: string | null;

  @Column("text")
  contact!: string;

  @Column("text")
  city!: string;

  @Column("text", { nullable: true })
  instagram!: string | null;

  /** Data URLs of the sample artwork photos, up to ARTWORK_IMAGE_LIMIT. */
  @Column("simple-json")
  artworkImages!: string[];

  @Column("text", { nullable: true })
  about!: string | null;

  @Column("simple-json")
  categories!: string[];

  @Column("text")
  shippingMethod!: string;

  @Column("text", { nullable: true })
  availability!: string | null;

  @Index()
  @Column("text", { default: "submitted" })
  status!: string;

  /** RAD's internal note after review, shown nowhere to the applicant yet. */
  @Column("text", { nullable: true })
  reviewNote!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
