import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { newDbId } from "../ids";

type Localized = { fa: string; en: string };

@Entity("HelpQuestion")
export class HelpQuestion {
  @PrimaryColumn("text")
  id!: string;

  @Column("jsonb")
  question!: Localized;

  @Column("jsonb")
  answer!: Localized;

  /** Policy document the answer links to for the full rule. */
  @Column("text", { nullable: true })
  moreSlug!: string | null;

  @Column("text", { nullable: true })
  moreSection!: string | null;

  @Column("int", { default: 0 })
  position!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  /** Soft delete, so a removed default question is not re-inserted on boot. */
  @DeleteDateColumn({ type: "timestamptz", nullable: true })
  deletedAt!: Date | null;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
