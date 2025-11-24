import { Router } from "express";
import { LogController, listLogsValidation } from "../controllers/log.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize("admin"));

// List logs with filters
router.get("/", listLogsValidation, LogController.list);

// Get log statistics
router.get("/stats", LogController.getStats);

// Export logs
router.get("/export", LogController.export);

// Get log by ID
router.get("/:id", LogController.getById);

export default router;

