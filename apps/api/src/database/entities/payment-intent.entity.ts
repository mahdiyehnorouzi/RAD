import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { newDbId } from "../ids";
import { Order } from "./order.entity";

@Entity("PaymentIntent")
export class PaymentIntent {
  @PrimaryColumn("text")
  id!: string;

  @Column("text", { unique: true })
  orderId!: string;

  @OneToOne(() => Order, (order) => order.payment, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order!: Order;

  @Column("int")
  amount!: number;

  @Column("text")
  currency!: string;

  @Column("text", { default: "sandbox" })
  provider!: string;

  @Column("text", { default: "created" })
  status!: string;

  @Column("text", { nullable: true })
  receiptImage!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  submittedAt!: Date | null;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
