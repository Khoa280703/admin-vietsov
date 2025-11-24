import { Router } from "express";
import {
  UserController,
  createUserValidation,
  updateUserValidation,
  listUsersValidation,
} from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// List users (admin only)
router.get("/", authorize("admin"), listUsersValidation, UserController.list);

// Get user by ID
router.get("/:id", UserController.getById);

// Create user (admin only)
router.post("/", authorize("admin"), createUserValidation, UserController.create);

// Update user (admin or self)
router.put("/:id", updateUserValidation, UserController.update);

// Delete user (admin only, soft delete)
router.delete("/:id", authorize("admin"), UserController.delete);

// Assign role (admin only)
router.put("/:id/role", authorize("admin"), UserController.assignRole);

export default router;

