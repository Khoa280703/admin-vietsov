import { Router } from "express";
import {
  RoleController,
  createRoleValidation,
  updateRoleValidation,
} from "../controllers/role.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { body } from "express-validator";

const router = Router();

// All routes require authentication
router.use(authenticate);

// List roles
router.get("/", RoleController.list);

// Get role by ID
router.get("/:id", RoleController.getById);

// Create role (admin only)
router.post("/", authorize("admin"), createRoleValidation, RoleController.create);

// Update role (admin only)
router.put("/:id", authorize("admin"), updateRoleValidation, RoleController.update);

// Update role permissions (admin only)
router.put(
  "/:id/permissions",
  authorize("admin"),
  body("permissions").isObject().withMessage("Permissions must be an object"),
  RoleController.updatePermissions
);

export default router;

