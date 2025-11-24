import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { LogService } from "../services/log.service";
import { LogLevel } from "../entities/Log";
import bcrypt from "bcryptjs";
import { body, query, validationResult } from "express-validator";

export class UserController {
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

      const userRepository = AppDataSource.getRepository(User);
      const [users, total] = await userRepository.findAndCount({
        relations: ["role"],
        skip,
        take: limit,
        order: { createdAt: "DESC" },
        select: ["id", "username", "email", "fullName", "roleId", "isActive", "createdAt", "updatedAt"],
      });

      res.json({
        data: users,
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
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: parseInt(id) },
        relations: ["role"],
        select: ["id", "username", "email", "fullName", "roleId", "isActive", "createdAt", "updatedAt"],
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({ data: user });
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

      const { username, email, password, fullName, roleId } = req.body;

      const userRepository = AppDataSource.getRepository(User);
      const existingUser = await userRepository.findOne({
        where: [{ username }, { email }],
      });

      if (existingUser) {
        throw new AppError("Username or email already exists", 400);
      }

      const roleRepository = AppDataSource.getRepository(Role);
      const role = await roleRepository.findOne({ where: { id: roleId } });
      if (!role) {
        throw new AppError("Role not found", 404);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = userRepository.create({
        username,
        email,
        password: hashedPassword,
        fullName,
        roleId,
        isActive: true,
      });

      await userRepository.save(user);

      const savedUser = await userRepository.findOne({
        where: { id: user.id },
        relations: ["role"],
        select: ["id", "username", "email", "fullName", "roleId", "isActive", "createdAt", "updatedAt"],
      });

      // Log user creation
      LogService.writeLog({
        userId: authReq.userId,
        action: "create_user",
        module: "users",
        endpoint: req.path,
        method: req.method,
        statusCode: 201,
        ipAddress: req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || undefined,
        userAgent: req.headers["user-agent"],
        message: `User ${authReq.user?.username} created new user: ${savedUser?.username}`,
        level: LogLevel.INFO,
        metadata: { createdUserId: savedUser?.id, createdUsername: savedUser?.username },
      }).catch((error) => console.error("Failed to log user creation:", error));

      res.status(201).json({ data: savedUser });
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
      const { username, email, fullName, roleId, isActive } = req.body;

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: parseInt(id) } });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Check permissions: user can only update themselves, admin can update anyone
      const isAdmin = authReq.user?.role?.name === "admin";
      if (!isAdmin && authReq.userId !== user.id) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }

      if (username) user.username = username;
      if (email) user.email = email;
      if (fullName) user.fullName = fullName;
      if (roleId && isAdmin) {
        const roleRepository = AppDataSource.getRepository(Role);
        const role = await roleRepository.findOne({ where: { id: roleId } });
        if (!role) {
          throw new AppError("Role not found", 404);
        }
        user.roleId = roleId;
      }
      if (isActive !== undefined && isAdmin) user.isActive = isActive;

      await userRepository.save(user);

      // Log user update
      LogService.writeLog({
        userId: authReq.userId,
        action: "update_user",
        module: "users",
        endpoint: req.path,
        method: req.method,
        statusCode: 200,
        ipAddress: req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || undefined,
        userAgent: req.headers["user-agent"],
        message: `User ${authReq.user?.username} updated user: ${user.username}`,
        level: LogLevel.INFO,
        metadata: { updatedUserId: user.id },
      }).catch((error) => console.error("Failed to log user update:", error));

      const updatedUser = await userRepository.findOne({
        where: { id: user.id },
        relations: ["role"],
        select: ["id", "username", "email", "fullName", "roleId", "isActive", "createdAt", "updatedAt"],
      });

      res.json({ data: updatedUser });
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
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: parseInt(id) } });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Soft delete: set isActive to false
      const deletedUsername = user.username;
      user.isActive = false;
      await userRepository.save(user);

      // Log user deletion
      const authReq = req as AuthRequest;
      LogService.writeLog({
        userId: authReq.userId,
        action: "delete_user",
        module: "users",
        endpoint: req.path,
        method: req.method,
        statusCode: 200,
        ipAddress: req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || undefined,
        userAgent: req.headers["user-agent"],
        message: `User ${authReq.user?.username} deleted user: ${deletedUsername}`,
        level: LogLevel.INFO,
        metadata: { deletedUserId: parseInt(id) },
      }).catch((error) => console.error("Failed to log user deletion:", error));

      res.json({ message: "User deactivated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async assignRole(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const { roleId } = req.body;

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: parseInt(id) } });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const roleRepository = AppDataSource.getRepository(Role);
      const role = await roleRepository.findOne({ where: { id: roleId } });
      if (!role) {
        throw new AppError("Role not found", 404);
      }

      user.roleId = roleId;
      await userRepository.save(user);

      const updatedUser = await userRepository.findOne({
        where: { id: user.id },
        relations: ["role"],
        select: ["id", "username", "email", "fullName", "roleId", "isActive", "createdAt", "updatedAt"],
      });

      res.json({ data: updatedUser });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
}

export const createUserValidation = [
  body("username").notEmpty().withMessage("Username is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("roleId").isInt().withMessage("Valid role ID is required"),
];

export const updateUserValidation = [
  body("username").optional().notEmpty(),
  body("email").optional().isEmail(),
  body("fullName").optional().notEmpty(),
  body("roleId").optional().isInt(),
  body("isActive").optional().isBoolean(),
];

export const listUsersValidation = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

