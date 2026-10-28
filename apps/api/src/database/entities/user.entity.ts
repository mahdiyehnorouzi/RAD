import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { newDbId } from "../ids";
import { PasswordResetToken } from "./password-reset-token.entity";
import { Review } from "./review.entity";

@Entity("User")
export class User {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  name!: string;

  // Nullable: a phone-only (SMS OTP) account has no email. Still unique
  // when present — Postgres allows any number of NULLs under a unique
  // constraint, so this never blocks two phone-only accounts from
  // coexisting.
  @Column("text", { unique: true, nullable: true })
  email!: string | null;

  // Phone-only (SMS OTP) accounts never set a real password — see
  // `AuthService.signInWithPhone` for why `passwordHash` stays required
  // (an unusable random hash) rather than nullable here: that keeps this
  // migration independent of PR #96's own nullable-passwordHash migration
  // (Google sign-in), avoiding two PRs racing to alter the same column.
  @Column("text")
  passwordHash!: string | null;

  // Nullable: only SMS-OTP accounts have one. Unique when present, same
  // reasoning as `email` above.
  @Column("text", { unique: true, nullable: true })
  phone!: string | null;

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
