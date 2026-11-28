import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";
import type { RadIdentityEventKind } from "@rad/types";
import { newDbId } from "../ids";

@Entity("RadIdentityEvent")
export class RadIdentityEvent {
  @PrimaryColumn("text")
  id!: string;

  @Index()
  @Column("text")
  identityId!: string;

  @Column("text")
  kind!: RadIdentityEventKind;

  @Column("text", { nullable: true })
  productId!: string | null;

  @Column("text", { nullable: true })
  batchId!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  at!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
