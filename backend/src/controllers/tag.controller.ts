import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Tag } from "../entities/Tag";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { LogService } from "../services/log.service";
import { LogLevel } from "../entities/Log";
import { body, query, validationResult } from "express-validator";

export class TagController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const search = req.query.search as string | undefined;

      const tagRepository = AppDataSource.getRepository(Tag);
      const queryBuilder = tagRepository.createQueryBuilder("tag");

      if (search) {
        queryBuilder.where("tag.name LIKE :search OR tag.slug LIKE :search", {
          search: `%${search}%`,
        });
      }

      const [tags, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy("tag.createdAt", "DESC")
        .getManyAndCount();

      res.json({
        data: tags,
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
      const tagRepository = AppDataSource.getRepository(Tag);
      const tag = await tagRepository.findOne({ where: { id: parseInt(id) } });

      if (!tag) {
        res.status(404).json({ error: "Tag not found" });
        return;
      }

      res.json({ data: tag });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, slug, description } = req.body;

      const tagRepository = AppDataSource.getRepository(Tag);
      const existingTag = await tagRepository.findOne({
        where: [{ name }, { slug }],
      });

      if (existingTag) {
        throw new AppError("Tag name or slug already exists", 400);
      }

      const tag = tagRepository.create({
        name,
        slug,
        description,
      });

      await tagRepository.save(tag);

      // Log tag creation
      const authReq = req as AuthRequest;
      LogService.writeLog({
        userId: authReq.userId,
        action: "create_tag",
        module: "tags",
        endpoint: req.path,
        method: req.method,
        statusCode: 201,
        ipAddress:
          (req.headers["x-forwarded-for"] as string) ||
          req.socket.remoteAddress ||
          undefined,
        userAgent: req.headers["user-agent"],
        message: `User created tag: ${tag.name}`,
        level: LogLevel.INFO,
        metadata: { tagId: tag.id, tagName: tag.name },
      }).catch((error) => console.error("Failed to log tag creation:", error));

      res.status(201).json({ data: tag });
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
      const { name, slug, description } = req.body;

      const tagRepository = AppDataSource.getRepository(Tag);
      const tag = await tagRepository.findOne({ where: { id: parseInt(id) } });

      if (!tag) {
        res.status(404).json({ error: "Tag not found" });
        return;
      }

      if (name) {
        const existingTag = await tagRepository.findOne({ where: { name } });
        if (existingTag && existingTag.id !== tag.id) {
          throw new AppError("Tag name already exists", 400);
        }
        tag.name = name;
      }

      if (slug) {
        const existingTag = await tagRepository.findOne({ where: { slug } });
        if (existingTag && existingTag.id !== tag.id) {
          throw new AppError("Tag slug already exists", 400);
        }
        tag.slug = slug;
      }

      if (description !== undefined) tag.description = description;

      await tagRepository.save(tag);

      // Log tag update
      const authReq = req as AuthRequest;
      LogService.writeLog({
        userId: authReq.userId,
        action: "update_tag",
        module: "tags",
        endpoint: req.path,
        method: req.method,
        statusCode: 200,
        ipAddress:
          (req.headers["x-forwarded-for"] as string) ||
          req.socket.remoteAddress ||
          undefined,
        userAgent: req.headers["user-agent"],
        message: `User updated tag: ${tag.name}`,
        level: LogLevel.INFO,
        metadata: { tagId: tag.id },
      }).catch((error) => console.error("Failed to log tag update:", error));

      res.json({ data: tag });
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
      const tagRepository = AppDataSource.getRepository(Tag);
      const tag = await tagRepository.findOne({ where: { id: parseInt(id) } });

      if (!tag) {
        res.status(404).json({ error: "Tag not found" });
        return;
      }

      const tagName = tag.name;
      await tagRepository.remove(tag);

      // Log tag deletion
      const authReq = req as AuthRequest;
      LogService.writeLog({
        userId: authReq.userId,
        action: "delete_tag",
        module: "tags",
        endpoint: req.path,
        method: req.method,
        statusCode: 200,
        ipAddress:
          (req.headers["x-forwarded-for"] as string) ||
          req.socket.remoteAddress ||
          undefined,
        userAgent: req.headers["user-agent"],
        message: `User deleted tag: ${tagName}`,
        level: LogLevel.INFO,
        metadata: { tagId: parseInt(id) },
      }).catch((error) => console.error("Failed to log tag deletion:", error));

      res.json({ message: "Tag deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export const createTagValidation = [
  body("name").notEmpty().withMessage("Tag name is required"),
  body("slug").notEmpty().withMessage("Tag slug is required"),
  body("description").optional(),
];

export const updateTagValidation = [
  body("name").optional().notEmpty(),
  body("slug").optional().notEmpty(),
  body("description").optional(),
];

export const listTagsValidation = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("search").optional().isString(),
];
