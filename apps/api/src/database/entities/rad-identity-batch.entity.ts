import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from "typeorm";
import { newDbId } from "../ids";

/** One successful reservation request. The idempotency key makes retries safe. */
@Entity("RadIdentityBatch")
export class RadIdentityBatch {
  @PrimaryColumn("text")
  id!: string;

  @Column("text", { unique: true })
  idempotencyKey!: string;

  @Column("int")
  quantity!: number;

  @Column("int")
  startNumber!: number;

  @Column("int")
  endNumber!: number;

  @Column("text", { nullable: true })
  createdById!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  printedAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
