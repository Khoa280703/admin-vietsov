import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { ArticleCategory } from "./ArticleCategory";
import { ArticleTag } from "./ArticleTag";

export enum ArticleStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  UNDER_REVIEW = "under_review",
  APPROVED = "approved",
  REJECTED = "rejected",
  PUBLISHED = "published",
}

@Entity("articles")
export class Article {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  subtitle?: string;

  @Column({ unique: true })
  slug!: string;

  @Column("text", { nullable: true })
  excerpt?: string;

  @Column("text")
  contentJson!: string; // TipTap JSONContent as string

  @Column("text", { nullable: true })
  contentHtml?: string; // Computed HTML from JSON

  @Column({
    type: "varchar",
    default: ArticleStatus.DRAFT,
  })
  status!: ArticleStatus;

  @Column()
  authorId!: number;

  @ManyToOne(() => User, (user) => user.articles)
  @JoinColumn({ name: "authorId" })
  author!: User;

  @Column({ nullable: true })
  featuredImage?: string;

  @Column({ nullable: true })
  seoTitle?: string;

  @Column("text", { nullable: true })
  seoDescription?: string;

  @Column("text", { nullable: true })
  seoKeywords?: string;

  @Column({ default: false })
  isFeatured!: boolean;

  @Column({ default: false })
  isBreakingNews!: boolean;

  @Column({ default: true })
  allowComments!: boolean;

  @Column({ default: "web,mobile" })
  visibility!: string;

  @Column({ nullable: true })
  scheduledAt?: Date;

  @Column({ nullable: true })
  publishedAt?: Date;

  @Column("text", { nullable: true })
  reviewNotes?: string;

  @Column({ default: 0 })
  wordCount!: number;

  @Column({ default: 0 })
  characterCount!: number;

  @Column({ default: 0 })
  readingTime!: number;

  @Column({ default: 0 })
  views!: number;

  @OneToMany(
    () => ArticleCategory,
    (articleCategory) => articleCategory.article
  )
  articleCategories!: ArticleCategory[];

  @OneToMany(() => ArticleTag, (articleTag) => articleTag.article)
  articleTags!: ArticleTag[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
