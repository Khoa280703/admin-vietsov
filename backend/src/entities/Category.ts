import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Tree,
  TreeChildren,
  TreeParent,
} from "typeorm";
import { ArticleCategory } from "./ArticleCategory";

export enum CategoryType {
  EVENT = "event",
  NEWS_TYPE = "news_type",
  OTHER = "other",
}

@Entity("categories")
@Tree("closure-table")
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({
    type: "varchar",
    default: CategoryType.OTHER,
  })
  type!: CategoryType;

  @TreeParent()
  @ManyToOne(() => Category, (category) => category.children, { nullable: true })
  @JoinColumn({ name: "parentId" })
  parent?: Category;

  @Column({ nullable: true })
  parentId?: number;

  @TreeChildren()
  @OneToMany(() => Category, (category) => category.parent)
  children!: Category[];

  @Column("text", { nullable: true })
  description?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  order!: number;

  @OneToMany(() => ArticleCategory, (articleCategory) => articleCategory.category)
  articleCategories!: ArticleCategory[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

