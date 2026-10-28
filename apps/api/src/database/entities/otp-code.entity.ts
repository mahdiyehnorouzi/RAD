import { BeforeInsert, Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";
import { newDbId } from "../ids";

/**
 * A single-use, expiring SMS verification code for one phone number.
 * Table-only addition: no change to `User`. `request()`/`verify()` live in
 * `OtpService` (auth module) — this entity never stores a phone's raw code,
 * only its hash, mirroring `PasswordResetToken`.
 */
@Entity("OtpCode")
export class OtpCode {
  @PrimaryColumn("text")
  id!: string;

  @Index()
  @Column("text")
  phone!: string;

  @Column("text")
  codeHash!: string;

  @Column("int", { default: 0 })
  attempts!: number;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
