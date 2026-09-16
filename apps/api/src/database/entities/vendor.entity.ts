import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity("Vendor")
export class Vendor {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  displayName!: string;

  @Column("text")
  displayNameEn!: string;

  @Column("text")
  kind!: string;

  @Column("boolean", { default: false })
  verified!: boolean;

  @OneToMany(() => Product, (product) => product.vendor)
  products!: Product[];
}
