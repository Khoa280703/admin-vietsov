import { Router } from "express";
import {
  TagController,
  createTagValidation,
  updateTagValidation,
  listTagsValidation,
} from "../controllers/tag.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// List tags (public, but authenticated for admin features)
router.get("/", listTagsValidation, TagController.list);

// Get tag by ID
router.get("/:id", TagController.getById);

// All write operations require admin
router.use(authenticate);
router.use(authorize("admin"));

router.post("/", createTagValidation, TagController.create);
router.put("/:id", updateTagValidation, TagController.update);
router.delete("/:id", TagController.delete);

export default router;

