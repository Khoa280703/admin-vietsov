import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from "typeorm";
import { Article } from "./Article";
import { Tag } from "./Tag";

@Entity("article_tags")
export class ArticleTag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  articleId!: number;

  @ManyToOne(() => Article, (article) => article.articleTags, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "articleId" })
  article!: Article;

  @Column()
  tagId!: number;

  @ManyToOne(() => Tag, (tag) => tag.articleTags, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "tagId" })
  tag!: Tag;
}

