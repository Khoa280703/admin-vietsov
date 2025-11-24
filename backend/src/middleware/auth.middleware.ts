import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { AuthService } from "../services/auth.service";

export interface AuthRequest extends Request {
  user?: User;
  userId?: number;
  roleId?: number;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyToken(token);

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: payload.userId, isActive: true },
      relations: ["role"],
    });

    if (!user) {
      res.status(401).json({ error: "User not found or inactive" });
      return;
    }

    req.user = user;
    req.userId = user.id;
    req.roleId = user.roleId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const authorize = (requiredRole?: string, requiredPermissions?: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Check role
    if (requiredRole && req.user.role?.name !== requiredRole) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    // Check permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const permissions = req.user.role?.permissions
        ? JSON.parse(req.user.role.permissions)
        : {};

      const hasPermission = requiredPermissions.some((permission) => {
        const [module, action] = permission.split(":");
        return permissions[module]?.includes(action);
      });

      if (!hasPermission) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }
    }

    next();
  };
};

