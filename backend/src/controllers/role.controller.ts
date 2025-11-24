import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Role } from "../entities/Role";
import { AppError } from "../middleware/error.middleware";
import { body, validationResult } from "express-validator";

export class RoleController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const roleRepository = AppDataSource.getRepository(Role);
      const roles = await roleRepository.find({
        order: { createdAt: "DESC" },
      });

      res.json({ data: roles });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const roleRepository = AppDataSource.getRepository(Role);
      const role = await roleRepository.findOne({ where: { id: parseInt(id) } });

      if (!role) {
        res.status(404).json({ error: "Role not found" });
        return;
      }

      res.json({ data: role });
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

      const { name, description, permissions } = req.body;

      const roleRepository = AppDataSource.getRepository(Role);
      const existingRole = await roleRepository.findOne({ where: { name } });

      if (existingRole) {
        throw new AppError("Role name already exists", 400);
      }

      const role = roleRepository.create({
        name,
        description,
        permissions: permissions ? JSON.stringify(permissions) : undefined,
      });

      await roleRepository.save(role);
      res.status(201).json({ data: role });
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
      const { name, description, permissions } = req.body;

      const roleRepository = AppDataSource.getRepository(Role);
      const role = await roleRepository.findOne({ where: { id: parseInt(id) } });

      if (!role) {
        res.status(404).json({ error: "Role not found" });
        return;
      }

      if (name && name !== role.name) {
        const existingRole = await roleRepository.findOne({ where: { name } });
        if (existingRole) {
          throw new AppError("Role name already exists", 400);
        }
        role.name = name;
      }

      if (description !== undefined) role.description = description;
      if (permissions !== undefined) role.permissions = JSON.stringify(permissions);

      await roleRepository.save(role);
      res.json({ data: role });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  static async updatePermissions(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const { permissions } = req.body;

      const roleRepository = AppDataSource.getRepository(Role);
      const role = await roleRepository.findOne({ where: { id: parseInt(id) } });

      if (!role) {
        res.status(404).json({ error: "Role not found" });
        return;
      }

      role.permissions = JSON.stringify(permissions);
      await roleRepository.save(role);

      res.json({ data: role });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export const createRoleValidation = [
  body("name").notEmpty().withMessage("Role name is required"),
  body("description").optional(),
  body("permissions").optional().isObject(),
];

export const updateRoleValidation = [
  body("name").optional().notEmpty(),
  body("description").optional(),
  body("permissions").optional().isObject(),
];

