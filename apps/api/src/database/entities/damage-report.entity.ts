import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";
import { newDbId } from "../ids";

@Entity("DamageReport")
export class DamageReport {
  @PrimaryColumn("text")
  id!: string;

  @Index()
  @Column("text")
  orderId!: string;

  @Index()
  @Column("text")
  ownerKey!: string;

  @Column("text", { nullable: true })
  userId!: string | null;

  /** Data URL of the outer box as it arrived. */
  @Column("text")
  packagingPhoto!: string;

  /** Data URL of the damage itself. */
  @Column("text")
  damagePhoto!: string;

  @Column("text")
  body!: string;

  @Index()
  @Column("text", { default: "submitted" })
  status!: string;

  @Column("text", { nullable: true })
  resolution!: string | null;

  /** RAD's reply, shown to the customer. */
  @Column("text", { nullable: true })
  note!: string | null;

  /** Sent after the report window following delivery had closed. */
  @Column("boolean", { default: false })
  late!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  reviewedAt!: Date | null;

  /** Staff user id that approved or declined the report. */
  @Column("text", { nullable: true })
  reviewedBy!: string | null;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
