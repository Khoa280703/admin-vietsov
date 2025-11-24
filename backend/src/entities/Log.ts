import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

export enum LogLevel {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

@Entity("logs")
export class Log {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  userId?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "userId" })
  user?: User;

  @Column()
  action!: string; // e.g., "login", "create_article", "delete_category"

  @Column()
  module!: string; // e.g., "auth", "articles", "categories"

  @Column()
  endpoint!: string; // e.g., "/api/v1/articles"

  @Column()
  method!: string; // GET, POST, PUT, DELETE

  @Column()
  statusCode!: number; // 200, 404, 500, etc.

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ type: "text", nullable: true })
  userAgent?: string;

  @Column("text")
  message!: string; // Mô tả chi tiết

  @Column({
    type: "varchar",
    default: LogLevel.INFO,
  })
  level!: LogLevel; // info, warn, error

  @Column("text", { nullable: true })
  metadata?: string; // JSON string lưu thêm data như request body, response, error details

  @CreateDateColumn()
  createdAt!: Date;
}

