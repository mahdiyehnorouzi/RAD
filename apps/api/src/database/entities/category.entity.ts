import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { newDbId } from "../ids";

type CategoryName = { fa: string; en: string };

/**
 * A catalog category. `parentId` null is a parent; a non-null parent must
 * itself be a root. Depth is two. Products keep their existing category
 * slug and may optionally point at a child via `Product.subcategoryId`.
 */
@Entity("Category")
@Unique("UQ_Category_slug", ["slug"])
export class Category {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  slug!: string;

  @Index()
  @Column("text", { nullable: true })
  parentId!: string | null;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "parentId" })
  parent!: Category | null;

  @OneToMany(() => Category, (category) => category.parent)
  children!: Category[];

  @Column("jsonb")
  name!: CategoryName;

  @Column("boolean", { default: true })
  active!: boolean;

  @Column("int", { default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = newDbId();
  }
}
