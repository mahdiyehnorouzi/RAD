import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { OrderItem } from "./order-item.entity";
import { PaymentIntent } from "./payment-intent.entity";

@Entity("Order")
export class Order {
  @PrimaryColumn("text")
  id!: string;

  @Index()
  @Column("text")
  ownerKey!: string;

  @Column("text", { nullable: true })
  userId!: string | null;

  @Column("int")
  total!: number;

  @Column("int")
  usdTotal!: number;

  @Column("text", { default: "payment_pending" })
  status!: string;

  @Column("text")
  name!: string;

  @Column("text")
  city!: string;

  @Column("text", { default: "" })
  phone!: string;

  @Column("text", { default: "" })
  address!: string;

  @Column("text", { nullable: true })
  trackingCode!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  estimatedDeliveryAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @OneToMany(() => OrderItem, (item) => item.order)
  items!: OrderItem[];

  @OneToOne(() => PaymentIntent, (payment) => payment.order)
  payment!: PaymentIntent | null;
}
