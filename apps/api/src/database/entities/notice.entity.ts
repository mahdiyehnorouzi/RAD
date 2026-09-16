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

  @Column("boolean", { default: false })
  read!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
