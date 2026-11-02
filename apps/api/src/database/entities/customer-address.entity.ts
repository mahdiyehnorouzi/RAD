import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { newDbId } from "../ids";
import { User } from "./user.entity";

/**
 * Delivery addresses the customer can reuse. This is not the order snapshot:
 * `Order.name`, `Order.city`, `Order.phone`, and `Order.address` stay as they
 * were at checkout.
 *
 * At most one row per user has `isDefault = true`. The partial unique index
 * is the backstop; writes also lock the user row.
 */
@Entity("CustomerAddress")
@Index("UQ_CustomerAddress_default", ["userId"], {
  unique: true,
  where: `"isDefault" = true`,
})
export class CustomerAddress {
  @PrimaryColumn("text")
  id!: string;

  @Index("IDX_CustomerAddress_userId")
  @Column("text")
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column("text")
  recipientName!: string;

  /** Canonical Iranian mobile `09` + nine digits. */
  @Column("text")
  phone!: string;

  @Column("text")
  provinceId!: string;

  @Column("text")
  cityId!: string;

  @Column("text")
  provinceLabel!: string;

  @Column("text")
  cityLabel!: string;

  @Column("text")
  address!: string;

  @Column("text", { nullable: true })
  postalCode!: string | null;

  @Column("boolean", { default: false })
  isDefault!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
