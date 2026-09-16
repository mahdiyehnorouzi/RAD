import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { newDbId } from "../ids";
import { Product } from "./product.entity";
import { User } from "./user.entity";

@Entity("Review")
export class Review {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  productSlug!: string;

  @ManyToOne(() => Product, (product) => product.reviews)
  @JoinColumn({ name: "productSlug", referencedColumnName: "slug" })
  product!: Product;

  @Column("text")
  userId!: string;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column("text")
  author!: string;

  @Column("int")
  rating!: number;

  @Column("text")
  comment!: string;

  @Column("text", { nullable: true })
  image!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
