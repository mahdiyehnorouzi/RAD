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

@Entity("ShapeQuestion")
export class ShapeQuestion {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  trait!: string;

  @Column("jsonb")
  prompt!: Localized;

  @Column("jsonb")
  hint!: Localized;

  @Column("jsonb")
  choices!: Array<{
    label: Localized;
    note: Localized;
    photo: { src: string; alt: Localized };
    value: number;
  }>;

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
