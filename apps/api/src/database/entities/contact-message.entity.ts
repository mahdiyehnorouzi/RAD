import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";
import { newDbId } from "../ids";

@Entity("ContactMessage")
export class ContactMessage {
  @PrimaryColumn("text")
  id!: string;

  @Index()
  @Column("text")
  ownerKey!: string;

  @Column("text", { nullable: true })
  userId!: string | null;

  @Index()
  @Column("text", { nullable: true })
  orderId!: string | null;

  /** False when the order number was typed by someone other than its buyer. */
  @Column("boolean", { default: false })
  fromOrderOwner!: boolean;

  @Column("text")
  topic!: string;

  @Column("text")
  source!: string;

  @Column("text", { default: "" })
  name!: string;

  @Column("text")
  contact!: string;

  @Column("text")
  body!: string;

  /**
   * Null for the first message in a thread; set to that message's own `id`
   * for every reply (a flat, two-level thread — a reply to a reply still
   * points at the original root, never chains deeper). Added for admin/
   * customer bidirectional replies; see `contact-message-thread.migration.ts`.
   */
  @Index()
  @Column("text", { nullable: true })
  parentId!: string | null;

  /** True for a staff reply, false for the customer's own message. */
  @Column("boolean", { default: false })
  fromAdmin!: boolean;

  @Index()
  @Column("text", { default: "new" })
  status!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  resolvedAt!: Date | null;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
