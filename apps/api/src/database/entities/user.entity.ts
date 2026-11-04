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

  // Nullable: a phone-only (SMS OTP) account has no email. Still unique
  // when present — Postgres allows any number of NULLs under a unique
  // constraint, so this never blocks two phone-only accounts from
  // coexisting.
  @Column("text", { unique: true, nullable: true })
  email!: string | null;

  /** Canonical Iranian mobile `09` + nine digits, or null when unset. */
  @Column("text", { nullable: true })
  phone!: string | null;

  // Phone-only (SMS OTP) accounts never set a real password (an unusable
  // random hash instead — see `AuthService.signInWithPhone`); a
  // Google-only account genuinely has none, hence nullable here (added by
  // `AddUserGoogleAuth1793800000000`, together with `googleId` below).
  @Column("text", { nullable: true })
  passwordHash!: string | null;

  // Google's stable per-account subject id. Set once a Google sign-in
  // links or creates this user — see `AuthService.signInWithGoogle`.
  @Column("text", { nullable: true, unique: true })
  googleId!: string | null;

  // OTP-verified sign-in identifier. Deliberately a separate column from
  // `phone` above: `phone` is self-reported contact info (`ProfileService`
  // lets any signed-in user set it to any number, unverified), while this
  // column is only ever written after `OtpService.verifyCode` succeeds for
  // that exact number (`AuthService.signInWithPhone`). Looking up or
  // auto-linking by the unverified `phone` column instead would let
  // whoever later proves ownership of a number a victim once typed into
  // their own contact field sign into that victim's account with no
  // password — see the AddUserVerifiedPhone migration's docstring.
  @Column("text", { unique: true, nullable: true })
  verifiedPhone!: string | null;

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
