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
