import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { AuthService } from "../services/auth.service";
import { AppError } from "../middleware/error.middleware";
import { LogService } from "../services/log.service";
import { LogLevel } from "../entities/Log";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import { AuthRequest } from "../middleware/auth.middleware";

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { username, password } = req.body;

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: [{ username }, { email: username }],
        relations: ["role"],
      });

      if (!user || !user.isActive) {
        // Log failed login attempt
        LogService.writeLog({
          action: "login_failed",
          module: "auth",
          endpoint: req.path,
          method: req.method,
          statusCode: 401,
          ipAddress: req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || undefined,
          userAgent: req.headers["user-agent"],
          message: `Failed login attempt for username/email: ${username}`,
          level: LogLevel.WARN,
        }).catch((error) => console.error("Failed to log failed login:", error));
        throw new AppError("Invalid credentials", 401);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // Log failed login attempt
        LogService.writeLog({
          userId: user.id,
          action: "login_failed",
          module: "auth",
          endpoint: req.path,
          method: req.method,
          statusCode: 401,
          ipAddress: req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || undefined,
          userAgent: req.headers["user-agent"],
          message: `Failed login attempt for user: ${user.username} (invalid password)`,
          level: LogLevel.WARN,
        }).catch((error) => console.error("Failed to log failed login:", error));
        throw new AppError("Invalid credentials", 401);
      }

      const tokens = AuthService.generateToken(user);

      // Log successful login
      const authReq = req as AuthRequest;
      LogService.writeLog({
        userId: user.id,
        action: "login",
        module: "auth",
        endpoint: req.path,
        method: req.method,
        statusCode: 200,
        ipAddress: req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || undefined,
        userAgent: req.headers["user-agent"],
        message: `User ${user.username} logged in successfully`,
        level: LogLevel.INFO,
      }).catch((error) => console.error("Failed to log login:", error));

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        ...tokens,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: "Refresh token is required" });
        return;
      }

      const tokens = AuthService.refreshToken(refreshToken);
      res.json(tokens);
    } catch (error) {
      res.status(401).json({ error: "Invalid refresh token" });
    }
  }

  static async me(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as any;
      const userId = authReq.userId;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["role"],
        select: ["id", "username", "email", "fullName", "roleId", "isActive", "createdAt"],
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        user: {
          ...user,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export const loginValidation = [
  body("username").notEmpty().withMessage("Username or email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

