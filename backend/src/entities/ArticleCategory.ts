import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from "typeorm";
import { Article } from "./Article";
import { Category } from "./Category";

@Entity("article_categories")
export class ArticleCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  articleId!: number;

  @ManyToOne(() => Article, (article) => article.articleCategories, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "articleId" })
  article!: Article;

  @Column()
  categoryId!: number;

  @ManyToOne(() => Category, (category) => category.articleCategories, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "categoryId" })
  category!: Category;
}

