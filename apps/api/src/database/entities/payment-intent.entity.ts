import {
  BeforeInsert,
  Column,
  Entity,
  Index,
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

  /** sha256 of `receiptImage`, so one screenshot cannot pay for two orders. */
  @Index()
  @Column("text", { nullable: true })
  receiptHash!: string | null;

  /** Bank transfer reference (شماره پیگیری) the customer entered with the receipt. */
  @Index()
  @Column("text", { nullable: true })
  trackingNumber!: string | null;

  /** How many receipts the customer has submitted for this order. */
  @Column("int", { default: 0 })
  receiptSubmissions!: number;

  @Column({ type: "timestamptz", nullable: true })
  submittedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  reviewedAt!: Date | null;

  /** Staff user id that confirmed or rejected the payment. */
  @Column("text", { nullable: true })
  reviewedBy!: string | null;

  @Column("text", { nullable: true })
  rejectionReason!: string | null;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
