import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { newDbId } from "../ids";
import { Order } from "./order.entity";
import { Product } from "./product.entity";

@Entity("OrderItem")
export class OrderItem {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  orderId!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order!: Order;

  @Column("text")
  productSlug!: string;

  @ManyToOne(() => Product, (product) => product.orderItems)
  @JoinColumn({ name: "productSlug", referencedColumnName: "slug" })
  product!: Product;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
