import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Category, CategoryType } from "../entities/Category";
import { CategoryService } from "../services/category.service";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { LogService } from "../services/log.service";
import { LogLevel } from "../entities/Log";
import { body, query, validationResult } from "express-validator";
import { TreeRepository } from "typeorm";

export class CategoryController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const type = req.query.type as CategoryType | undefined;
      const categories = await CategoryService.getTree(type);

      res.json({ data: categories });
    } catch (error: any) {
      console.error("Error in CategoryController.list:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error?.message || "Unknown error",
      });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const repository = AppDataSource.getTreeRepository(Category);
      const category = await repository.findOne({
        where: { id: parseInt(id) },
        relations: ["parent", "children"],
      });

      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }

      res.json({ data: category });
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

      const { name, slug, type, parentId, description, order } = req.body;

      const repository = AppDataSource.getRepository(Category); // Use regular repository, not tree repository
      const existingCategory = await repository.findOne({ where: { slug } });

      if (existingCategory) {
        throw new AppError("Category slug already exists", 400);
      }

      // Validate parent if provided
      let parentIdNum: number | undefined = undefined;
      if (parentId !== null && parentId !== undefined) {
        parentIdNum =
          typeof parentId === "string" ? parseInt(parentId) : parentId;
        const parent = await repository.findOne({ where: { id: parentIdNum } });
        if (!parent) {
          throw new AppError("Parent category not found", 404);
        }
      }

      // Insert category using raw query (like in seed.ts)
      const result = await AppDataSource.query(
        `INSERT INTO categories (name, slug, type, description, isActive, [order], parentId, createdAt, updatedAt)
         OUTPUT INSERTED.id
         VALUES (@0, @1, @2, @3, @4, @5, @6, GETDATE(), GETDATE())`,
        [
          name,
          slug,
          type || CategoryType.OTHER,
          description || null,
          1, // isActive = true
          order || 0,
          parentIdNum || null,
        ]
      );

      const categoryId = result[0].id;

      // Manually populate closure table (like in seed.ts)
      // Insert self-reference
      await AppDataSource.query(
        `INSERT INTO categories_closure (id_ancestor, id_descendant) VALUES (@0, @0)`,
        [categoryId]
      );

      // If has parent, insert all ancestor-descendant relationships
      if (parentIdNum) {
        await AppDataSource.query(
          `INSERT INTO categories_closure (id_ancestor, id_descendant)
           SELECT cc.id_ancestor, @0
           FROM categories_closure cc
           WHERE cc.id_descendant = @1`,
          [categoryId, parentIdNum]
        );
      }

      // Fetch the saved category with relations
      const savedCategory = await repository.findOne({
        where: { id: categoryId },
        relations: ["parent", "children"],
      });

      if (!savedCategory) {
        throw new AppError("Failed to retrieve created category", 500);
      }

      // Log category creation
      const authReq = req as AuthRequest;
      LogService.writeLog({
        userId: authReq.userId,
        action: "create_category",
        module: "categories",
        endpoint: req.path,
        method: req.method,
        statusCode: 201,
        ipAddress:
          (req.headers["x-forwarded-for"] as string) ||
          req.socket.remoteAddress ||
          undefined,
        userAgent: req.headers["user-agent"],
        message: `User created category: ${savedCategory.name}`,
        level: LogLevel.INFO,
        metadata: {
          categoryId: savedCategory.id,
          categoryName: savedCategory.name,
        },
      }).catch((error) =>
        console.error("Failed to log category creation:", error)
      );

      res.status(201).json({ data: savedCategory });
    } catch (error: any) {
      console.error("Error in CategoryController.create:", error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({
          error: "Internal server error",
          message: error?.message || "Unknown error",
          stack:
            process.env.NODE_ENV === "development" ? error?.stack : undefined,
        });
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
      const { name, slug, type, parentId, description, order, isActive } =
        req.body;

      const repository = AppDataSource.getTreeRepository(Category);
      const category = await repository.findOne({
        where: { id: parseInt(id) },
      });

      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }

      if (name) category.name = name;
      if (slug) {
        const existingCategory = await repository.findOne({ where: { slug } });
        if (existingCategory && existingCategory.id !== category.id) {
          throw new AppError("Category slug already exists", 400);
        }
        category.slug = slug;
      }
      if (type) category.type = type;
      if (description !== undefined) category.description = description;
      if (order !== undefined) category.order = order;
      if (isActive !== undefined) category.isActive = isActive;

      if (parentId !== undefined) {
        if (parentId === null) {
          category.parent = undefined;
        } else {
          const parent = await repository.findOne({ where: { id: parentId } });
          if (!parent) {
            throw new AppError("Parent category not found", 404);
          }
          if (parent.id === category.id) {
            throw new AppError("Category cannot be its own parent", 400);
          }
          category.parent = parent;
        }
      }

      await repository.save(category);

      const updatedCategory = await repository.findOne({
        where: { id: category.id },
        relations: ["parent", "children"],
      });

      res.json({ data: updatedCategory });
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
      const repository = AppDataSource.getTreeRepository(Category);
      const category = await repository.findOne({
        where: { id: parseInt(id) },
        relations: ["children"],
      });

      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }

      // Check if category has children
      const children = await repository.findDescendants(category);
      if (children.length > 1) {
        // More than 1 because it includes itself
        throw new AppError("Cannot delete category with children", 400);
      }

      await repository.remove(category);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  static async getTypes(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        data: Object.values(CategoryType).map((type) => ({
          value: type,
          label: type.replace("_", " ").toUpperCase(),
        })),
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export const createCategoryValidation = [
  body("name").notEmpty().withMessage("Category name is required"),
  body("slug").notEmpty().withMessage("Category slug is required"),
  body("type").optional().isIn(Object.values(CategoryType)),
  body("parentId").optional().isInt(),
  body("description").optional(),
  body("order").optional().isInt(),
];

export const updateCategoryValidation = [
  body("name").optional().notEmpty(),
  body("slug").optional().notEmpty(),
  body("type").optional().isIn(Object.values(CategoryType)),
  body("parentId")
    .optional()
    .custom((value) => {
      if (value === null || value === undefined) return true;
      return Number.isInteger(parseInt(value));
    }),
  body("description").optional(),
  body("order").optional().isInt(),
  body("isActive").optional().isBoolean(),
];

export const listCategoriesValidation = [
  query("type").optional().isIn(Object.values(CategoryType)),
];
