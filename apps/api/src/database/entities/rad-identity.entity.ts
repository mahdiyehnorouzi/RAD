import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import type { RadIdentityStatus } from "@rad/types";
import { newDbId } from "../ids";

/**
 * Permanent RAD number. A row may exist before any product, and deleting
 * a product must not delete this row. `Product.radNumber` is a copy of
 * the number owned here.
 */
@Entity("RadIdentity")
export class RadIdentity {
  @PrimaryColumn("text")
  id!: string;

  @Column("int", { unique: true })
  radNumber!: number;

  @Index()
  @Column("text", { unique: true, nullable: true })
  productId!: string | null;

  @Index()
  @Column("text")
  status!: RadIdentityStatus;

  @Index()
  @Column("text", { nullable: true })
  batchId!: string | null;

  @Column({ type: "timestamptz" })
  reservedAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  assignedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  printedAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
