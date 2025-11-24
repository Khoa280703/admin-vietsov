import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Article, ArticleStatus } from "../entities/Article";
import { ArticleService } from "../services/article.service";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { LogService } from "../services/log.service";
import { LogLevel } from "../entities/Log";
import { body, query, validationResult } from "express-validator";

export class ArticleController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const authReq = req as AuthRequest;
      const isAdmin = authReq.user?.role?.name === "admin";

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const status = req.query.status as ArticleStatus | undefined;
      const authorId = req.query.authorId ? parseInt(req.query.authorId as string) : undefined;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const tagId = req.query.tagId ? parseInt(req.query.tagId as string) : undefined;

      const articleRepository = AppDataSource.getRepository(Article);
      const queryBuilder = articleRepository
        .createQueryBuilder("article")
        .leftJoinAndSelect("article.author", "author")
        .leftJoinAndSelect("author.role", "role")
        .leftJoinAndSelect("article.articleCategories", "articleCategories")
        .leftJoinAndSelect("articleCategories.category", "category")
        .leftJoinAndSelect("article.articleTags", "articleTags")
        .leftJoinAndSelect("articleTags.tag", "tag");

      // User can only see their own articles, admin can see all
      if (!isAdmin) {
        queryBuilder.where("article.authorId = :userId", { userId: authReq.userId });
      }

      if (status) {
        queryBuilder.andWhere("article.status = :status", { status });
      }

      if (authorId) {
        queryBuilder.andWhere("article.authorId = :authorId", { authorId });
      }

      if (categoryId) {
        queryBuilder.andWhere("category.id = :categoryId", { categoryId });
      }

      if (tagId) {
        queryBuilder.andWhere("tag.id = :tagId", { tagId });
      }

      const [articles, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy("article.createdAt", "DESC")
        .getManyAndCount();

      res.json({
        data: articles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;
      const isAdmin = authReq.user?.role?.name === "admin";

      const article = await ArticleService.getArticleWithRelations(parseInt(id));

      // User can only see their own articles, admin can see all
      if (!isAdmin && article.authorId !== authReq.userId) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }

      res.json({ data: article });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const authReq = req as AuthRequest;
      const article = await ArticleService.createArticle(authReq.userId!, req.body);

      // Log article creation
      LogService.writeLog({
        userId: authReq.userId,
        action: "create_article",
        module: "articles",
        endpoint: req.path,
        method: req.method,
        statusCode: 201,
        ipAddress: req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || undefined,
        userAgent: req.headers["user-agent"],
        message: `User created article: ${article.title}`,
        level: LogLevel.INFO,
        metadata: { articleId: article.id, articleTitle: article.title },
      }).catch((error) => console.error("Failed to log article creation:", error));

      res.status(201).json({ data: article });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const authReq = req as AuthRequest;
      const isAdmin = authReq.user?.role?.name === "admin";

      const article = await ArticleService.updateArticle(
        parseInt(id),
        authReq.userId!,
        req.body,
        isAdmin
      );

      // Log article update
      LogService.writeLog({
        userId: authReq.userId,
        action: "update_article",
        module: "articles",
        endpoint: req.path,
        method: req.method,
        statusCode: 200,
        ipAddress: req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || undefined,
        userAgent: req.headers["user-agent"],
        message: `User updated article: ${article.title}`,
        level: LogLevel.INFO,
        metadata: { articleId: article.id },
      }).catch((error) => console.error("Failed to log article update:", error));

      res.json({ data: article });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;
      const isAdmin = authReq.user?.role?.name === "admin";

      const articleRepository = AppDataSource.getRepository(Article);
      const article = await articleRepository.findOne({ where: { id: parseInt(id) } });

      if (!article) {
        res.status(404).json({ error: "Article not found" });
        return;
      }

      // User can only delete their own articles, admin can delete any
      if (!isAdmin && article.authorId !== authReq.userId) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }

      await articleRepository.remove(article);

      // Log article deletion
      LogService.writeLog({
        userId: authReq.userId,
        action: "delete_article",
        module: "articles",
        endpoint: req.path,
        method: req.method,
        statusCode: 200,
        ipAddress: req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || undefined,
        userAgent: req.headers["user-agent"],
        message: `User deleted article ID: ${id}`,
        level: LogLevel.INFO,
        metadata: { articleId: parseInt(id) },
      }).catch((error) => console.error("Failed to log article deletion:", error));

      res.json({ message: "Article deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async submit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;

      const article = await ArticleService.submitArticle(parseInt(id), authReq.userId!);

      res.json({ data: article, message: "Article submitted for review" });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  static async approve(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const { notes } = req.body;
      const authReq = req as AuthRequest;

      const article = await ArticleService.reviewArticle(parseInt(id), authReq.userId!, "approve", notes);

      res.json({ data: article, message: "Article approved" });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  static async reject(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const { notes } = req.body;
      const authReq = req as AuthRequest;

      const article = await ArticleService.reviewArticle(parseInt(id), authReq.userId!, "reject", notes);

      res.json({ data: article, message: "Article rejected" });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  static async publish(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;
      const isAdmin = authReq.user?.role?.name === "admin";

      const article = await ArticleService.publishArticle(parseInt(id), authReq.userId!, isAdmin);

      res.json({ data: article, message: "Article published" });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  static async myArticles(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const authReq = req as AuthRequest;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const status = req.query.status as ArticleStatus | undefined;

      const articleRepository = AppDataSource.getRepository(Article);
      const queryBuilder = articleRepository
        .createQueryBuilder("article")
        .leftJoinAndSelect("article.author", "author")
        .leftJoinAndSelect("author.role", "role")
        .leftJoinAndSelect("article.articleCategories", "articleCategories")
        .leftJoinAndSelect("articleCategories.category", "category")
        .leftJoinAndSelect("article.articleTags", "articleTags")
        .leftJoinAndSelect("articleTags.tag", "tag")
        .where("article.authorId = :userId", { userId: authReq.userId });

      if (status) {
        queryBuilder.andWhere("article.status = :status", { status });
      }

      const [articles, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy("article.createdAt", "DESC")
        .getManyAndCount();

      res.json({
        data: articles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export const createArticleValidation = [
  body("title").notEmpty().withMessage("Title is required"),
  body("content").notEmpty().withMessage("Content is required"),
  body("slug").optional(),
  body("categoryIds").optional().isArray(),
  body("tagIds").optional().isArray(),
];

export const updateArticleValidation = [
  body("title").optional().notEmpty(),
  body("content").optional(),
  body("categoryIds").optional().isArray(),
  body("tagIds").optional().isArray(),
];

export const listArticlesValidation = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("status").optional().isIn(Object.values(ArticleStatus)),
  query("authorId").optional().isInt(),
  query("categoryId").optional().isInt(),
  query("tagId").optional().isInt(),
];

export const reviewArticleValidation = [
  body("notes").optional().isString(),
];

