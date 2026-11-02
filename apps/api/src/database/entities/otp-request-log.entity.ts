import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";
import { newDbId } from "../ids";

/**
 * One row per OTP send attempt for a phone number, kept forever (never
 * deleted) so `OtpService` can count how many times a phone has been sent
 * a code in a trailing window — a persistent, phone-keyed rate limit that
 * a process restart or IP rotation can't reset or bypass, backed by the
 * same Postgres the rest of auth already uses (no new infra). Deliberately
 * separate from `OtpCode`: that table's rows get deleted/replaced on every
 * new request (so verification always sees exactly one active code), which
 * would erase the request history this rate limit needs to count against.
 */
@Entity("OtpRequestLog")
export class OtpRequestLog {
  @PrimaryColumn("text")
  id!: string;

  @Index()
  @Column("text")
  phone!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
