import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { newDbId } from "../ids";
import { PasswordResetToken } from "./password-reset-token.entity";
import { Review } from "./review.entity";

/**
 * `phone` is a contact number, not a login identifier. The unique index
 * allows many nulls (PostgreSQL) and rejects two accounts sharing one
 * canonical mobile.
 */
@Index("UQ_User_phone", ["phone"], { unique: true })
@Entity("User")
export class User {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  name!: string;

  @Column("text", { unique: true })
  email!: string;

  /** Canonical Iranian mobile `09` + nine digits, or null when unset. */
  @Column("text", { nullable: true })
  phone!: string | null;

  // Column is NOT NULL today (no migration here makes it nullable - that's
  // scoped to the Google Sign-In migration). Typed as nullable anyway: if
  // this API artifact is ever the rollback target for a release where that
  // migration already ran, this entity reads real rows that the DB allows
  // to be null, regardless of what this decorator says.
  @Column("text")
  passwordHash!: string | null;

  @Column("text", { default: "customer" })
  role!: string;

  @Column("text", { nullable: true })
  adminRole!: string | null;

  @Column("text", { default: "active" })
  status!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @OneToMany(() => Review, (review) => review.user)
  reviews!: Review[];

  @OneToMany(() => PasswordResetToken, (token) => token.user)
  passwordResetTokens!: PasswordResetToken[];

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
