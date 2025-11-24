import { Router } from "express";
import {
  CategoryController,
  createCategoryValidation,
  updateCategoryValidation,
  listCategoriesValidation,
} from "../controllers/category.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// List categories (public, but authenticated for admin features)
router.get("/", listCategoriesValidation, CategoryController.list);

// Get category types
router.get("/types", CategoryController.getTypes);

// Get category by ID
router.get("/:id", CategoryController.getById);

// All write operations require admin
router.use(authenticate);
router.use(authorize("admin"));

router.post("/", createCategoryValidation, CategoryController.create);
router.put("/:id", updateCategoryValidation, CategoryController.update);
router.delete("/:id", CategoryController.delete);

export default router;

