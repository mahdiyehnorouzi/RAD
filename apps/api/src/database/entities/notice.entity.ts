import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";
import { newDbId } from "../ids";

@Entity("Notice")
export class Notice {
  @PrimaryColumn("text")
  id!: string;

  @Index()
  @Column("text")
  ownerKey!: string;

  @Column("text")
  kind!: string;

  @Column("text", { nullable: true })
  productSlug!: string | null;

  /**
   * Links a `commission_message` notice to the specific `StageMessage.id`
   * it was created for (BUG-03), so a single message can be marked read on
   * its own instead of bulk-marking every unread notice for the
   * conversation. Null for notice kinds that are per-conversation, not
   * per-message.
   */
  @Column("text", { nullable: true })
  messageId!: string | null;

  @Column("boolean", { default: false })
  read!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
